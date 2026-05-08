import { Inventory } from "../models/inventory.model.js";
import { DemandRequest } from "../models/demandRequest.model.js";

export const chatWithAI = async (req, res) => {
  try {
    const { message, history } = req.body;

    const inventories = await Inventory.find().sort({ stockLevel: 1 }).limit(10).lean();
    const recentRequests = await DemandRequest.find().sort({ createdAt: -1 }).limit(10).lean();
    
    const backend_context = {
      lowStock: inventories,
      recentRequests
    };

    const ragUrl = process.env.RAG_SERVICE_URL || "http://localhost:8000";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${ragUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, backend_context }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      const data = await response.json();
      return res.json(data);
    } catch (fetchErr) {
      clearTimeout(timeout);
      console.error("RAG Service unreachable:", fetchErr.message);
      return res.status(503).json({ error: "AI service unavailable" });
    }
  } catch (error) {
    console.error("AI Service Error:", error);
    return res.status(500).json({ error: "AI service failed" });
  }
};

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
        model: "llama3-70b-8192",
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
