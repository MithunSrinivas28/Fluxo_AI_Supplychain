import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import numpy as np

app = FastAPI(title="Fluxo ML Service", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models and feature columns
try:
    model_median = joblib.load("models/xgb_median.pkl")
    model_lower = joblib.load("models/xgb_lower.pkl")
    model_upper = joblib.load("models/xgb_upper.pkl")
    feature_columns = list(joblib.load("models/feature_columns.pkl"))
    print(f"✅ Models loaded. Feature columns ({len(feature_columns)}): {feature_columns}")
except Exception as e:
    print(f"❌ Model loading failed: {e}")
    raise


class PredictRequest(BaseModel):
    current_price: float
    base_price: float
    discount_percent: float = 0.0
    year_growth: float = 1.05
    month: int = Field(ge=1, le=12)
    is_festival: int = Field(ge=0, le=1)
    product_id: int
    lag_1: float = 0.0
    lag_2: float = 0.0
    zone: str = "North"
    warehouse: str = "A"
    category: str = "agriculture"


def build_feature_vector(data: PredictRequest) -> np.ndarray:
    """Build feature vector matching exact training column order from feature_columns.pkl."""
    # Numerical features
    values = {
        "current_price": data.current_price,
        "base_price": data.base_price,
        "discount_percent": data.discount_percent,
        "year_growth": data.year_growth,
        "month": float(data.month),
        "is_festival": float(data.is_festival),
        "product_id": float(data.product_id),
        "lag_1": data.lag_1,
        "lag_2": data.lag_2,
    }

    # Zone one-hot encoding
    zone = data.zone.lower() if isinstance(data.zone, str) else "north"
    for col in feature_columns:
        if col.startswith("zone_"):
            zone_name = col.replace("zone_", "").lower()
            values[col] = 1.0 if zone == zone_name else 0.0

    # Warehouse one-hot encoding
    warehouse = data.warehouse.upper() if isinstance(data.warehouse, str) else "A"
    for col in feature_columns:
        if col.startswith("warehouse_"):
            wh_name = col.replace("warehouse_", "").upper()
            values[col] = 1.0 if warehouse == wh_name else 0.0

    # Category one-hot encoding
    category = data.category.lower() if isinstance(data.category, str) else "agriculture"
    for col in feature_columns:
        if col.startswith("category_"):
            cat_name = col.replace("category_", "").lower()
            values[col] = 1.0 if category == cat_name else 0.0

    # Build final vector in exact training column order
    features = [values.get(col, 0.0) for col in feature_columns]
    return np.array([features])


@app.get("/health")
def health():
    return {"status": "ok", "service": "ml-predict", "features": len(feature_columns)}


@app.get("/info")
def info():
    return {
        "service": "fluxo-ml",
        "version": "3.0",
        "feature_count": len(feature_columns),
        "feature_columns": feature_columns,
        "zones": ["North", "South", "East", "West"],
        "warehouses": ["A", "B", "C"],
        "categories": ["agriculture", "dairy", "poultry", "grains", "vegetables",
                       "fruits", "electronics", "raw_materials", "furniture"]
    }


@app.post("/predict")
def predict(data: PredictRequest):
    try:
        features_array = build_feature_vector(data)

        forecast = float(model_median.predict(features_array)[0])
        lower_bound = float(model_lower.predict(features_array)[0])
        upper_bound = float(model_upper.predict(features_array)[0])

        # Monotonicity enforcement
        lower_bound = min(lower_bound, forecast)
        upper_bound = max(upper_bound, forecast)

        return {
            "forecast": round(forecast, 2),
            "lower_bound": round(lower_bound, 2),
            "upper_bound": round(upper_bound, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)