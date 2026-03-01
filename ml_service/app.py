from fastapi import FastAPI
import joblib
import numpy as np
import os

app = FastAPI()

# Load models (adjust filenames if needed)
model_median = joblib.load("models/xgb_median.pkl")
model_lower = joblib.load("models/xgb_lower.pkl")
model_upper = joblib.load("models/xgb_upper.pkl")
@app.post("/predict")
def predict(data: dict):

    # --------- Numerical Features ---------
    current_price = data["current_price"]
    base_price = data["base_price"]
    discount_percent = data["discount_percent"]
    year_growth = 1.05  # static for now
    month = data["month"]
    is_festival = data["is_festival"]
    product_id = data["product_id"]
    lag_1 = data["lag_1"]
    lag_2 = data["lag_2"]

    # --------- Zone One-Hot Encoding ---------
    zone = data["zone"]

    zone_South = 1 if zone == "south" else 0
    zone_West = 1 if zone == "west" else 0
    zone_East = 1 if zone == "east" else 0
    # north = baseline (all zeros)

    # --------- Warehouse One-Hot Encoding ---------
    warehouse = data["warehouse"]

    warehouse_B = 1 if warehouse == "B" else 0
    warehouse_C = 1 if warehouse == "C" else 0
    # A = baseline

    # --------- Category One-Hot Encoding ---------
    category = data["category"]

    category_dairy = 1 if category == "dairy" else 0
    category_poultry = 1 if category == "poultry" else 0
    category_grains = 1 if category == "grains" else 0
    category_vegetables = 1 if category == "vegetables" else 0
    category_fruits = 1 if category == "fruits" else 0
    category_electronics = 1 if category == "electronics" else 0
    category_raw_materials = 1 if category == "raw_materials" else 0
    category_furniture = 1 if category == "furniture" else 0

    # --------- Final Feature Vector (ORDER MATTERS) ---------
    features = [
        current_price,
        base_price,
        discount_percent,
        year_growth,
        month,
        is_festival,
        product_id,
        lag_1,
        lag_2,

        zone_South,
        zone_West,
        zone_East,

        warehouse_B,
        warehouse_C,

        category_dairy,
        category_poultry,
        category_grains,
        category_vegetables,
        category_fruits,
        category_electronics,
        category_raw_materials,
        category_furniture
    ]

    features_array = np.array([features])

    forecast = model_median.predict(features_array)[0]
    lower_bound = model_lower.predict(features_array)[0]
    upper_bound = model_upper.predict(features_array)[0]

    return {
        "forecast": float(forecast),
        "lower_bound": float(lower_bound),
        "upper_bound": float(upper_bound)
    }