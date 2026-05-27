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

try:
    df = pd.read_csv("data/synthetic_supplychain_data.csv")
    print(f"✅ Loaded {len(df)} rows from supply chain dataset")
except Exception as e:
    print(f"❌ Failed to load dataset: {e}")
    df = pd.DataFrame()

def extract_context(query: str) -> str:
    query_lower = query.lower()
    
    unique_products = df["product_name"].dropna().unique().tolist()
    unique_zones = df["zone"].dropna().unique().tolist()
    unique_categories = df["category"].dropna().unique().tolist()
    
    matched_products = [p for p in unique_products if str(p).lower() in query_lower]
    matched_zones = [z for z in unique_zones if str(z).lower() in query_lower]
    matched_categories = [c for c in unique_categories if str(c).lower() in query_lower]
    
    filtered = df.copy()
    
    if matched_products:
        filtered = filtered[filtered["product_name"].isin(matched_products)]
    if matched_zones:
        filtered = filtered[filtered["zone"].isin(matched_zones)]
    if matched_categories:
        filtered = filtered[filtered["category"].isin(matched_categories)]
    if "festival" in query_lower or "festive" in query_lower:
        filtered = filtered[filtered["is_festival"] == 1]
        
    if len(filtered) < 10:
        filtered = df.copy()
        
    # ─── Core Metrics ───
    top_products = filtered.groupby("product_name")["units_sold_next_week"].mean().nlargest(10).to_dict()
    bottom_products = filtered.groupby("product_name")["units_sold_next_week"].mean().nsmallest(5).to_dict()
    avg_demand_zone = filtered.groupby("zone")["units_sold_next_week"].mean().to_dict()
    avg_demand_month = filtered.groupby("month")["units_sold_next_week"].mean().to_dict()
    
    # ─── Festival Impact ───
    festival_avg = df[df["is_festival"] == 1]["units_sold_next_week"].mean()
    non_festival_avg = df[df["is_festival"] == 0]["units_sold_next_week"].mean()
    
    # ─── Year-over-Year ───
    yoy_demand = filtered.groupby("year")["units_sold_next_week"].mean().to_dict()
    
    # ─── Warehouse Analysis ───
    wh_demand = filtered.groupby(["zone", "warehouse"])["units_sold_next_week"].mean().to_dict()
    
    # ─── Category Breakdown ───
    cat_demand = filtered.groupby("category")["units_sold_next_week"].agg(["mean", "sum", "count"]).to_dict("index")
    
    # ─── Product Trends (YoY) ───
    product_yoy = filtered.groupby(["product_name", "year"])["units_sold_next_week"].mean().unstack(fill_value=0)
    trending_up = []
    trending_down = []
    if len(product_yoy.columns) >= 2:
        last_two = product_yoy.columns[-2:]
        for prod in product_yoy.index:
            prev = product_yoy.loc[prod, last_two[0]]
            curr = product_yoy.loc[prod, last_two[1]]
            if prev > 0:
                change = ((curr - prev) / prev) * 100
                if change > 5:
                    trending_up.append(f"  {prod}: +{change:.1f}%")
                elif change < -5:
                    trending_down.append(f"  {prod}: {change:.1f}%")
    
    # ─── Discount Analysis ───
    discount_impact = filtered.groupby("discount_percent")["units_sold_next_week"].mean().to_dict()

    # ─── Build Summary ───
    top_str = "\n".join([f"  {k}: {v:.0f} units/week" for k, v in top_products.items()])
    bottom_str = "\n".join([f"  {k}: {v:.0f} units/week" for k, v in bottom_products.items()])
    zone_str = "\n".join([f"  {k}: {v:.0f} units/week" for k, v in avg_demand_zone.items()])
    month_str = "\n".join([f"  Month {int(k)}: {v:.0f} units/week" for k, v in sorted(avg_demand_month.items())])
    yoy_str = "\n".join([f"  Year {int(k)}: {v:.0f} units/week" for k, v in yoy_demand.items()])
    wh_str = "\n".join([f"  {z}-{w}: {v:.0f} units/week" for (z, w), v in wh_demand.items()])
    cat_str = "\n".join([f"  {cat}: avg={d['mean']:.0f}, total={d['sum']:.0f}, records={d['count']}" for cat, d in cat_demand.items()])
    disc_str = "\n".join([f"  {int(k)}% discount: {v:.0f} units/week avg" for k, v in sorted(discount_impact.items())])
    
    summary = f"""Dataset: {len(filtered)} records analyzed (from {len(df)} total)
Products: {len(unique_products)} | Zones: {', '.join(unique_zones)} | Warehouses: A, B, C

Top 10 products by avg weekly demand:
{top_str}

Bottom 5 products (underperforming):
{bottom_str}

Avg demand per zone:
{zone_str}

Avg demand per month:
{month_str}

Warehouse-level demand:
{wh_str}

Category breakdown:
{cat_str}

Festival vs non-festival:
  Festival weeks: {festival_avg:.0f} units/week
  Non-festival weeks: {non_festival_avg:.0f} units/week
  Uplift: {((festival_avg - non_festival_avg) / max(non_festival_avg, 1) * 100):.1f}%

Year over year trend:
{yoy_str}

Discount impact on demand:
{disc_str}
"""
    
    if trending_up:
        summary += f"\nProducts trending UP (year-over-year):\n" + "\n".join(trending_up[:5])
    if trending_down:
        summary += f"\nProducts trending DOWN:\n" + "\n".join(trending_down[:5])
    
    return summary

@app.get("/data-check")
def data_check():
    return {
        "total_rows": len(df),
        "column_names": df.columns.tolist(),
        "unique_product_names": df["product_name"].unique().tolist() if "product_name" in df.columns else [],
        "unique_zones": df["zone"].unique().tolist() if "zone" in df.columns else [],
        "unique_categories": df["category"].unique().tolist() if "category" in df.columns else [],
        "min_year": int(df["year"].min()) if "year" in df.columns else None,
        "max_year": int(df["year"].max()) if "year" in df.columns else None,
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
        bc = req.backend_context
        backend_str = "\n--- Live System Context ---\n"
        if bc.get("inventorySummary"):
            backend_str += f"Inventory Summary:\n{bc['inventorySummary']}\n"
        if bc.get("lowStockAlerts"):
            backend_str += f"Low Stock Alerts:\n{bc['lowStockAlerts']}\n"
        if bc.get("recentRequests"):
            backend_str += f"Recent Requests:\n{bc['recentRequests']}\n"
        if bc.get("zoneSummary"):
            backend_str += f"Zone Summary:\n{bc['zoneSummary']}\n"
        context += backend_str
    
    messages = [
        {"role": "system", "content": (
            "You are Fluxo's AI supply chain analyst. You have access to 3 years of historical "
            "supply chain data covering 24 products across 4 zones (North, South, East, West) and "
            "3 warehouses (A, B, C). Categories include agriculture, dairy, poultry, grains, "
            "vegetables, fruits, electronics, raw_materials, and furniture. "
            "Answer questions using specific numbers from the data provided. Be concise, "
            "reference actual figures, and provide actionable insights. "
            "When asked about risk, consider stock levels vs demand rates. "
            "When asked about trends, reference year-over-year changes."
        )}
    ]
    
    messages.extend(req.history[-6:])
    
    user_prompt = f"Data Context:\n{context}\n\nQuestion: {req.message}"
    messages.append({"role": "user", "content": user_prompt})
    
    try:
        response = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            messages=messages,
            max_tokens=1024,
            temperature=0.3
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        print(f"Groq API error: {e}")
        return {"response": "I'm having trouble connecting to the AI service right now. Please try again in a moment."}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)