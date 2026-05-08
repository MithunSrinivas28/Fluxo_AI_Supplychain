import os
import pandas as pd
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

df = pd.read_csv("data/synthetic_supplychain_data.csv")

def extract_context(query: str) -> str:
    query_lower = query.lower()
    
    unique_products = df["product_name"].dropna().unique().tolist()
    unique_zones = df["zone"].dropna().unique().tolist()
    
    matched_products = [p for p in unique_products if str(p).lower() in query_lower]
    matched_zones = [z for z in unique_zones if str(z).lower() in query_lower]
    
    filtered = df.copy()
    
    if matched_products:
        filtered = filtered[filtered["product_name"].isin(matched_products)]
    
    if matched_zones:
        filtered = filtered[filtered["zone"].isin(matched_zones)]
        
    if "festival" in query_lower or "festive" in query_lower:
        filtered = filtered[filtered["is_festival"] == 1]
        
    if len(filtered) < 10:
        filtered = df.copy()
        
    top_5_products = filtered.groupby("product_name")["units_sold_next_week"].mean().nlargest(5).to_dict()
    avg_demand_zone = filtered.groupby("zone")["units_sold_next_week"].mean().to_dict()
    avg_demand_month = filtered.groupby("month")["units_sold_next_week"].mean().nlargest(5).to_dict()
    
    festival_avg = df[df["is_festival"] == 1]["units_sold_next_week"].mean()
    non_festival_avg = df[df["is_festival"] == 0]["units_sold_next_week"].mean()
    
    yoy_demand = filtered.groupby("year")["units_sold_next_week"].mean().to_dict()

    top_5_str = "\n".join([f"  {k}: {v:.0f} units/week" for k, v in top_5_products.items()])
    zone_str = "\n".join([f"  {k}: {v:.0f} units/week" for k, v in avg_demand_zone.items()])
    month_str = "\n".join([f"  Month {k:.0f}: {v:.0f} units/week" for k, v in avg_demand_month.items()])
    yoy_str = "\n".join([f"  Year {k:.0f}: {v:.0f} units/week" for k, v in yoy_demand.items()])
    
    summary = f"""Total records used for this context: {len(filtered)}

Top 5 products by average units_sold_next_week:
{top_5_str}

Average demand per zone:
{zone_str}

Average demand per month (top 5 months):
{month_str}

Festival weeks avg vs non-festival weeks avg:
  Festival: {festival_avg:.0f} units/week
  Non-Festival: {non_festival_avg:.0f} units/week

Year over year avg demand:
{yoy_str}
"""
    return summary

@app.get("/data-check")
def data_check():
    return {
        "total_rows": len(df),
        "column_names": df.columns.tolist(),
        "unique_product_names": df["product_name"].unique().tolist() if "product_name" in df.columns else [],
        "unique_zones": df["zone"].unique().tolist() if "zone" in df.columns else [],
        "min_year": int(df["year"].min()) if "year" in df.columns else None,
        "max_year": int(df["year"].max()) if "year" in df.columns else None
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

class ChatRequest(BaseModel):
    message: str
    history: list = []
    backend_context: dict = None

@app.post("/chat")
def chat_endpoint(req: ChatRequest):
    context = extract_context(req.message)
    
    if req.backend_context:
        backend_str = f"\nRealtime System Context (Live Data):\nInventory:\n{req.backend_context.get('inventories', [])}\n\nRecent Requests:\n{req.backend_context.get('recentRequests', [])}\n"
        context += backend_str
    
    messages = [
        {"role": "system", "content": "You are Fluxo's AI supply chain analyst. Answer questions using the data provided. Be specific, reference actual numbers, keep answers concise."}
    ]
    
    messages.extend(req.history[-6:])
    
    user_prompt = f"Data:\n{context}\n\nQuestion: {req.message}"
    messages.append({"role": "user", "content": user_prompt})
    
    response = client.chat.completions.create(
        model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        messages=messages,
        max_tokens=1024,
        temperature=0.3
    )
    
    return {"response": response.choices[0].message.content}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)