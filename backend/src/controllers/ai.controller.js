import { Inventory } from "../models/inventory.model.js";
import { DemandRequest } from "../models/demandRequest.model.js";
import { WeeklySales } from "../models/weeklySales.model.js";
import { Product } from "../models/product.model.js";

/**
 * chatWithAI — Fully self-contained RAG implementation.
 * 
 * Instead of proxying to an external Python RAG service (which is not deployed),
 * this controller:
 * 1. Enriches context from live MongoDB data (inventory, requests, sales, products)
 * 2. Calls Groq API directly with the enriched context
 * 3. Returns the AI response
 * 
 * This eliminates the RAG_SERVICE_URL dependency entirely.
 */
export const chatWithAI = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("GROQ_API_KEY is not set in environment variables");
      return res.status(503).json({ 
        error: "AI service configuration missing",
        response: "The AI service is not configured yet. Please set the GROQ_API_KEY environment variable."
      });
    }

    // ─── Gather Rich Context from MongoDB ───
    const [allInventory, recentRequests, allProducts] = await Promise.all([
      Inventory.find().lean(),
      DemandRequest.find().sort({ createdAt: -1 }).limit(20).lean(),
      Product.find().lean(),
    ]);

    // Zone-level summary
    const zoneSummary = {};
    for (const inv of allInventory) {
      const z = inv.zone || "Unknown";
      if (!zoneSummary[z]) zoneSummary[z] = { totalStock: 0, items: 0 };
      zoneSummary[z].totalStock += inv.stockLevel || 0;
      zoneSummary[z].items += 1;
    }
    const zoneSummaryStr = Object.entries(zoneSummary)
      .map(([z, d]) => `${z}: ${d.totalStock} units across ${d.items} items`)
      .join("\n");

    // Low stock alerts
    const lowStock = allInventory
      .filter(i => i.stockLevel < 100)
      .sort((a, b) => a.stockLevel - b.stockLevel)
      .slice(0, 15)
      .map(i => `${i.product} (${i.zone}/${i.warehouse}): ${i.stockLevel} units`)
      .join("\n");

    // Category breakdown
    const catMap = {};
    for (const inv of allInventory) {
      const c = inv.category || "unknown";
      if (!catMap[c]) catMap[c] = { totalStock: 0, count: 0 };
      catMap[c].totalStock += inv.stockLevel || 0;
      catMap[c].count += 1;
    }
    const catStr = Object.entries(catMap)
      .map(([c, d]) => `${c}: ${d.totalStock} units, ${d.count} items`)
      .join("\n");

    // Recent requests summary
    const requestsStr = recentRequests
      .map(r => `${r.sku} - qty:${r.requested_quantity}, forecast:${r.forecast?.toFixed(0) || 'N/A'}, risk:${r.risk_level}, status:${r.status}`)
      .join("\n");

    // Product catalog
    const productStr = allProducts
      .map(p => `${p.name} (${p.sku}): ${p.category}, base_price=₹${p.base_price}`)
      .join("\n");

    // Total inventory stats
    const totalStock = allInventory.reduce((s, i) => s + (i.stockLevel || 0), 0);

    // ─── Build Prompt Context ───
    const contextBlock = `
--- LIVE SYSTEM DATA ---
Total Inventory: ${allInventory.length} items, ${totalStock} total units

Zone Summary:
${zoneSummaryStr}

Low Stock Alerts (< 100 units):
${lowStock || "No critical low-stock items"}

Category Breakdown:
${catStr}

Product Catalog:
${productStr}

Recent Demand Requests (last 20):
${requestsStr || "No recent requests"}
`;

    // ─── Build Messages for Groq ───
    const messages = [
      {
        role: "system",
        content: `You are Fluxo's AI supply chain analyst. You have access to live inventory, demand, and product data from the Fluxo platform.

Answer questions using specific numbers from the data provided. Be concise, reference actual figures, and provide actionable insights.

When asked about risk, consider stock levels vs demand rates.
When asked about trends, reference recent request patterns.
When asked about products, use the actual product catalog data.

Available zones: North, South, East, West
Available warehouses: A, B, C
Categories: agriculture, dairy, poultry, grains, vegetables, fruits, electronics, raw_materials, furniture

Always ground your answers in the actual data. Never make up numbers.`
      }
    ];

    // Add conversation history
    if (Array.isArray(history)) {
      messages.push(...history.slice(-6));
    }

    // Add user message with context
    messages.push({
      role: "user",
      content: `${contextBlock}\n\nQuestion: ${message}`
    });

    // ─── Call Groq API Directly ───
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          messages,
          max_tokens: 1024,
          temperature: 0.3
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const errText = await response.text();
        console.error("Groq API error:", response.status, errText);
        return res.status(502).json({ 
          error: "AI inference failed",
          response: "I'm having trouble connecting to the AI service right now. Please try again in a moment."
        });
      }

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

      return res.json({ response: aiContent });
    } catch (fetchErr) {
      clearTimeout(timeout);
      console.error("Groq API unreachable:", fetchErr.message);
      return res.json({ 
        response: "The AI service is temporarily unavailable. Please try again in a moment."
      });
    }
  } catch (error) {
    console.error("AI Service Error:", error);
    return res.status(500).json({ error: "AI service failed" });
  }
};

/**
 * parseNLPRequest — Extract structured data from natural language text.
 * Uses Groq API directly.
 */
export const parseNLPRequest = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("GROQ_API_KEY missing in backend environment variables.");
      return res.status(500).json({ error: "Missing backend AI configuration" });
    }

    const prompt = `Extract structured data from the following text into a raw JSON object with no markdown formatting.
Return ONLY valid JSON with keys: "product" (string), "quantity" (number), "zone" (string).
Example: {"product": "eggs", "quantity": 500, "zone": "Zone A"}
Text: "${message}"`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq NLP Pipeline Error:", errText);
      throw new Error("Llama3 parser failed to respond");
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    // Sanitize markdown fences from json mode hallucination
    if (content.startsWith("\`\`\`json")) {
        content = content.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    } else if (content.startsWith("\`\`\`")) {
        content = content.replace(/\`\`\`/g, "").trim();
    }

    const parsed = JSON.parse(content);
    return res.json(parsed);

  } catch (error) {
    console.error("NLP extraction failed:", error);
    return res.status(500).json({ error: "NLP processing crashed backend" });
  }
};
