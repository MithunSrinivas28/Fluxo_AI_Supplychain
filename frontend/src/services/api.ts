export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

// ─── Auth ───

export async function loginUser(email: string, password: string) {
    try {
        const res = await customFetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const json = await handleResponse(res);
        if (!res.ok) throw new Error(json.message || json.error || "Login failed");
        const result = json.data || json;
        return result;
    } catch (error) {
        console.error("API error:", error);
        throw error;
    }
}

export async function registerUser(name: string, email: string, password: string, role: string = "retailer") {
    try {
        const res = await customFetch(`${API_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, role }),
        });
        const data = await handleResponse(res);
        if (!res.ok) throw new Error(data.message || data.error || "Registration failed");
        return data;
    } catch (error) {
        console.error("API error:", error);
        throw error;
    }
}

// ─── Products ───

export async function getProducts() {
    try {
        const res = await customFetch(`${API_URL}/api/products`, { headers: getAuthHeaders() });
        const json = await handleResponse(res);
        if (!res.ok) throw new Error(json.message || json.error || "Products fetch failed");
        return json.data || [];
    } catch (error) {
        console.error("API error:", error);
        throw error;
    }
}

// ─── Inventory ───

export async function getInventory() {
    try {
        const res = await customFetch(`${API_URL}/api/inventory`, { headers: getAuthHeaders() });
        const json = await handleResponse(res);
        if (!res.ok) throw new Error(json.message || json.error || "Inventory fetch failed");
        
        const items = json.data || [];
        return Array.isArray(items) ? items.map((item: any) => ({
            id: item._id || item.id || Math.random().toString(),
            product: item.product || "Unknown Product",
            sku: item.sku || "UNKN-001",
            product_id: item.product_id,
            category: item.category || "General",
            stock: item.stockLevel ?? item.stock ?? 0,
            minStock: item.minStock ?? 50,
            status: item.status || "healthy",
            lastUpdated: item.updatedAt || new Date().toISOString(),
            zone: item.zone || "North",
            warehouse: item.warehouse || "A",
            transactions: []
        })) : [];
    } catch (error) {
        console.error("API error:", error);
        throw error;
    }
}

export async function createInventory(payload: any) {
    try {
        const res = await customFetch(`${API_URL}/api/inventory`, {
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

// ─── Demand ───

export async function getDemand() {
    try {
        const res = await customFetch(`${API_URL}/api/demand`, { headers: getAuthHeaders() });
        const json = await handleResponse(res);
        if (!res.ok) throw new Error(json.message || json.error || "Demand fetch failed");
        return json.data || [];
    } catch (error) {
        console.error("API error:", error);
        throw error;
    }
}

export async function createDemand(payload: any) {
    try {
        const res = await customFetch(`${API_URL}/api/demand`, {
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

// ─── Decisions ───

export async function getDecisions() {
    try {
        const res = await customFetch(`${API_URL}/api/decision/reorder?region=global&category=all`, {
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

// ─── Requests ───

export async function getRequests() {
    try {
        const res = await customFetch(`${API_URL}/api/requests`, { headers: getAuthHeaders() });
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
        const res = await customFetch(`${API_URL}/api/requests`, {
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

// ─── Health ───

export async function pingHealth() {
    try {
        const res = await customFetch(`${API_URL}/api/health`);
        if (!res.ok) throw new Error("Health check failed");
        return await handleResponse(res);
    } catch (error) {
        console.error("Health check error:", error);
        throw error;
    }
}

// ─── AI / NLP ───

export async function parseNLP(message: string) {
    try {
        const res = await customFetch(`${API_URL}/api/ai/parse`, {
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

// ─── Analytics ───

export async function getAnalyticsDemandTrends(period: string = "30d") {
    try {
        const res = await customFetch(`${API_URL}/api/analytics/demand-trends?period=${period}`, {
            headers: getAuthHeaders()
        });
        const json = await handleResponse(res);
        if (!res.ok) return [];
        return json.data || [];
    } catch (error) {
        console.error("Analytics demand trends error:", error);
        return [];
    }
}

export async function getAnalyticsSeasonal() {
    try {
        const res = await customFetch(`${API_URL}/api/analytics/seasonal`, {
            headers: getAuthHeaders()
        });
        const json = await handleResponse(res);
        if (!res.ok) return [];
        return json.data || [];
    } catch (error) {
        console.error("Analytics seasonal error:", error);
        return [];
    }
}

export async function getAnalyticsCategoryDemand() {
    try {
        const res = await customFetch(`${API_URL}/api/analytics/category-demand`, {
            headers: getAuthHeaders()
        });
        const json = await handleResponse(res);
        if (!res.ok) return [];
        return json.data || [];
    } catch (error) {
        console.error("Analytics category demand error:", error);
        return [];
    }
}

export async function getAnalyticsZonePerformance() {
    try {
        const res = await customFetch(`${API_URL}/api/analytics/zone-performance`, {
            headers: getAuthHeaders()
        });
        const json = await handleResponse(res);
        if (!res.ok) return [];
        return json.data || [];
    } catch (error) {
        console.error("Analytics zone performance error:", error);
        return [];
    }
}

export async function getAnalyticsWarehouseUtilization() {
    try {
        const res = await customFetch(`${API_URL}/api/analytics/warehouse-utilization`, {
            headers: getAuthHeaders()
        });
        const json = await handleResponse(res);
        if (!res.ok) return [];
        return json.data || [];
    } catch (error) {
        console.error("Analytics warehouse utilization error:", error);
        return [];
    }
}

export async function getAnalyticsTopProducts(limit: number = 10) {
    try {
        const res = await customFetch(`${API_URL}/api/analytics/top-products?limit=${limit}`, {
            headers: getAuthHeaders()
        });
        const json = await handleResponse(res);
        if (!res.ok) return [];
        return json.data || [];
    } catch (error) {
        console.error("Analytics top products error:", error);
        return [];
    }
}

export async function getAnalyticsFestivalImpact() {
    try {
        const res = await customFetch(`${API_URL}/api/analytics/festival-impact`, {
            headers: getAuthHeaders()
        });
        const json = await handleResponse(res);
        if (!res.ok) return [];
        return json.data || [];
    } catch (error) {
        console.error("Analytics festival impact error:", error);
        return [];
    }
}

export async function getAnalyticsForecastHistory() {
    try {
        const res = await customFetch(`${API_URL}/api/analytics/forecast-history`, {
            headers: getAuthHeaders()
        });
        const json = await handleResponse(res);
        if (!res.ok) return [];
        return json.data || [];
    } catch (error) {
        console.error("Analytics forecast history error:", error);
        return [];
    }
}

export async function getAnalyticsFeatureImportance() {
    try {
        const res = await customFetch(`${API_URL}/api/analytics/feature-importance`, {
            headers: getAuthHeaders()
        });
        const json = await handleResponse(res);
        if (!res.ok) return [];
        return json.data || [];
    } catch (error) {
        console.error("Analytics feature importance error:", error);
        return [];
    }
}

export async function postMLPreview(payload: any) {
    try {
        const res = await customFetch(`${API_URL}/api/analytics/ml-preview`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        const json = await handleResponse(res);
        if (!res.ok) throw new Error(json.message || json.error || "ML preview failed");
        return json.data || json;
    } catch (error) {
        console.error("ML Preview error:", error);
        throw error;
    }
}

// ─── Bulk Upload ───

export async function bulkUploadRequests(rows: any[]) {
    try {
        const res = await customFetch(`${API_URL}/api/bulk/requests`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ rows })
        });
        const data = await handleResponse(res);
        if (!res.ok) throw new Error(data.message || data.error || "Bulk upload failed");
        return data;
    } catch (error) {
        console.error("API error:", error);
        throw error;
    }
}