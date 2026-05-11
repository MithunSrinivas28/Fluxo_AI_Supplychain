const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function handleResponse(res: Response) {
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch (err) {
        console.error("Invalid JSON response:", text);
        return { success: false, message: "Invalid server response" };
    }
}

const customFetch = async (url: string, options?: any) => {
    console.log("API CALL:", url, { method: options?.method || 'GET', body: options?.body });
    const res = await fetch(url, options);
    if (res.status === 401) {
        localStorage.removeItem("token");
        window.dispatchEvent(new Event("auth-expired"));
    }
    return res;
};

function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}

export async function loginUser(email: string, password: string) {
    try {
        console.log("LOGIN REQUEST:", API_BASE);
        const res = await customFetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const json = await handleResponse(res);
        if (!res.ok) throw new Error(json.message || json.error || "Login failed");

        // Backend returns { success, message, data: { token, user } }
        const result = json.data || json;
        return result;
    } catch (error) {
        console.error("API error:", error);
        throw error;
    }
}

export async function registerUser(name: string, email: string, password: string) {
    try {
        const res = await customFetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // Removed role since front-end doesn't control role
            body: JSON.stringify({ name, email, password }),
        });
        const data = await handleResponse(res);
        if (!res.ok) throw new Error(data.message || data.error || "Registration failed");
        return data;
    } catch (error) {
        console.error("API error:", error);
        throw error;
    }
}

export async function getInventory() {
    try {
        const res = await customFetch(`${API_BASE}/inventory`, { headers: getAuthHeaders() });
        const json = await handleResponse(res);
        if (!res.ok) throw new Error(json.message || json.error || "Inventory fetch failed");
        
        const items = json.data || [];
        return Array.isArray(items) ? items.map((item: any) => ({
            id: item._id || item.id || Math.random().toString(),
            product: item.product || "Unknown Product",
            sku: item.sku || "UNKN-001",
            category: item.category || "General",
            stock: item.stockLevel ?? item.stock ?? 0,
            minStock: item.minStock ?? 50,
            status: item.status || "healthy",
            lastUpdated: item.updatedAt || new Date().toISOString(),
            zone: item.warehouseZone || item.zone || "Zone A",
            warehouse: item.warehouse || "Unknown",
            transactions: []
        })) : [];
    } catch (error) {
        console.error("API error:", error);
        throw error;
    }
}

export async function getDemand() {
    try {
        const res = await customFetch(`${API_BASE}/demand`, { headers: getAuthHeaders() });
        const json = await handleResponse(res);
        if (!res.ok) throw new Error(json.message || json.error || "Demand fetch failed");
        return json.data || [];
    } catch (error) {
        console.error("API error:", error);
        throw error;
    }
}

export async function getDecisions() {
    try {
        const res = await customFetch(`${API_BASE}/decision/reorder?region=global&category=all`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            console.warn("Decision fetch failed, returning empty suggestions");
            return [];
        }
        const json = await handleResponse(res);
        return json.data || [];
    } catch (error) {
        console.error("API error:", error);
        return [];
    }
}

export async function getRequests() {
    try {
        const res = await customFetch(`${API_BASE}/requests`, { headers: getAuthHeaders() });
        const json = await handleResponse(res);
        if (!res.ok) throw new Error(json.message || json.error || "Requests fetch failed");
        return json.data || [];
    } catch (error) {
        console.error("API error:", error);
        throw error;
    }
}

export async function createRequest(payload: any) {
    try {
        const res = await customFetch(`${API_BASE}/requests`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await handleResponse(res);
        if (!res.ok) throw new Error(data.message || data.error || "Request creation failed");
        return data;
    } catch (error) {
        console.error("API error:", error);
        throw error;
    }
}

export async function createInventory(payload: any) {
    try {
        const res = await customFetch(`${API_BASE}/inventory`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await handleResponse(res);
        if (!res.ok) throw new Error(data.message || data.error || "Inventory creation failed");
        return data;
    } catch (error) {
        console.error("API error:", error);
        throw error;
    }
}

export async function createDemand(payload: any) {
    try {
        const res = await customFetch(`${API_BASE}/demand`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await handleResponse(res);
        if (!res.ok) throw new Error(data.message || data.error || "Demand creation failed");
        return data;
    } catch (error) {
        console.error("API error:", error);
        throw error;
    }
}

export async function pingHealth() {
    try {
        const res = await customFetch(`${API_BASE}/health`);
        if (!res.ok) throw new Error("Health check failed");
        return await handleResponse(res);
    } catch (error) {
        console.error("Health check error:", error);
        throw error;
    }
}

export async function parseNLP(message: string) {
    try {
        const res = await customFetch(`${API_BASE}/api/ai/parse`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ message })
        });
        const data = await handleResponse(res);
        if (!res.ok) throw new Error(data.message || data.error || "NLP parse failed");
        return data; 
    } catch (error) {
        console.error("API error:", error);
        throw error;
    }
}