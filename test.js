const API_BASE = "http://localhost:5000";

async function runTests() {
  console.log("Starting API Smoke Tests...");
  let token = "";

  // 1. Auth 
  try {
    await fetch(`${API_BASE}/auth/register`, {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({name:"Admin", email:"admin@test.com", password:"test123", role:"admin"})
    });
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({email:"admin@test.com", password:"test123"})
    });
    const loginData = await loginRes.json();
    if(loginRes.ok) {
       token = loginData.data?.token || loginData.token;
       console.log("✔ Auth working (Login successful)");
    } else {
       console.error("✖ Auth failed:", loginData);
       process.exit(1);
    }
  } catch(e) { console.error(e); process.exit(1); }

  const authHeaders = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
  const simpleHeaders = { "Authorization": `Bearer ${token}` };

  // 2. Fetch endpoints
  let existingSku = "PROD-123";
  let existingProductId = 123;
  try {
    const invRes = await fetch(`${API_BASE}/inventory`, { headers: authHeaders });
    if(invRes.ok) {
       console.log("✔ GET /inventory -> 200");
       const data = await invRes.json();
       const items = data.data || data || [];
       if(items.length > 0) {
           existingSku = items[0].sku || "PROD-123";
           existingProductId = items[0].product_id || 123;
       }
    } else console.error("✖ GET /inventory failed", invRes.status);

    const demRes = await fetch(`${API_BASE}/demand`, { headers: authHeaders });
    if(demRes.ok) console.log("✔ GET /demand -> 200");
    else console.error("✖ GET /demand failed", demRes.status);

    const decRes = await fetch(`${API_BASE}/decision/reorder?region=global&category=all`, { headers: simpleHeaders });
    if(decRes.ok) console.log("✔ GET /decision/reorder -> 200");
    else {
      const resp = await decRes.text();
      console.error("✖ GET /decision/reorder failed", decRes.status, resp);
    }
  } catch(e) { console.error(e); }

  // 3. Inventory Pipeline Add
  try {
    const invAdd = await fetch(`${API_BASE}/inventory`, {
      method: "POST", headers: authHeaders,
      body: JSON.stringify({ 
         productId: existingProductId, type: "adjustment", source: "manual", 
         quantity: 50, newStock: 150, newMin: 20 
      })
    });
    if(invAdd.ok || invAdd.status === 201) console.log("✔ POST /inventory -> 201");
    else {
      const text = await invAdd.text();
      console.error("✖ POST /inventory failed", invAdd.status, text);
    }
  } catch(e) { console.error("POST /inventory error:", e); }

  // 4. Request Pipeline Test
  try {
    const reqAdd = await fetch(`${API_BASE}/requests`, {
      method: "POST", headers: authHeaders,
      body: JSON.stringify({ 
         sku: existingSku, zone: "east", warehouse: "test-wh", 
         requested_quantity: 50, discount_percent: 0, is_festival: 0, 
         order_date: new Date().toISOString() 
      })
    });
    if(reqAdd.ok || reqAdd.status === 201) {
       console.log("✔ POST /requests -> 201");
    } else {
      const text = await reqAdd.text();
      console.error("✖ POST /requests failed to return 2xx status", reqAdd.status, text);
    }
  } catch(e) { console.error("POST /requests error:", e); }

  console.log("Smoke Test Script Execution Finished.");
}

runTests();
