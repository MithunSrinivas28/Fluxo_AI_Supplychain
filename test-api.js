const API_BASE = "http://localhost:5000";

async function runTests() {
  console.log("Starting API Smoke Tests...");
  let token = "";

  // 1. Auth 
  try {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({email:"admin@test.com", password:"test123"})
    });
    const loginData = await loginRes.json();
    if(loginRes.ok) {
       token = loginData.data?.token || loginData.token;
       console.log("✔ Auth working");
    } else {
       console.error("✖ Auth failed:", loginData);
       process.exit(1);
    }
  } catch(e) { console.error(e); process.exit(1); }

  const authHeaders = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };

  // 3. Inventory Pipeline Add
  // Using an existing Product that we know exists: EGG-01 (Assuming product_id: 101 or 1)
  // Even if it fails, it might just create the inventory record.
  try {
    const invAdd = await fetch(`${API_BASE}/inventory`, {
      method: "POST", headers: authHeaders,
      body: JSON.stringify({ 
         productId: 101, sku: "EGG-01", type: "adjustment", source: "manual", 
         quantity: 50, newStock: 150, newMin: 20 
      })
    });
    if(invAdd.ok || invAdd.status === 201) console.log("✔ POST /inventory -> 201 (or 200)");
    else console.error("✖ POST /inventory failed", invAdd.status, await invAdd.text());
  } catch(e) { console.error(e); }

  // 4. Request Pipeline Test
  try {
    const reqAdd = await fetch(`${API_BASE}/requests`, {
      method: "POST", headers: authHeaders,
      body: JSON.stringify({ 
         sku: "EGG-01", zone: "east", warehouse: "test-wh", 
         requested_quantity: 50, discount_percent: 0, is_festival: 0, 
         order_date: new Date().toISOString() 
      })
    });
    if(reqAdd.ok || reqAdd.status === 201) console.log("✔ POST /requests -> 201 (or 200)");
    else console.error("✖ POST /requests failed to return 2xx status", reqAdd.status, await reqAdd.text());
  } catch(e) { console.error(e); }

  console.log("Smoke Test Finish.");
}
runTests();
