import axios from "axios";
import { DemandRequest } from "../models/demandRequest.model.js";
import { Product } from "../models/product.model.js";
import { WeeklySales } from "../models/weeklySales.model.js";

export const createRequest = async (data, user) => {

  const {
    sku,
    zone,
    warehouse,
    requested_quantity,
    discount_percent,
    is_festival,
    order_date
  } = data;

  // STEP 1 — Fetch Product
  const product = await Product.findOne({ sku });

  if (!product) {
    throw new Error("Product not found");
  }

  // STEP 2 — Fetch Last 2 Weeks Sales
  const sales = await WeeklySales.find({
    product_id: product.product_id,
    zone,
    warehouse
  })
    .sort({ year: -1, week: -1 })
    .limit(2);

  const lag_1 = sales[0]?.units_sold || 0;
  const lag_2 = sales[1]?.units_sold || 0;

  // STEP 3 — Construct ML Payload
  const current_price =
    product.base_price * (1 - discount_percent / 100);

  const month = new Date(order_date).getMonth() + 1;

  const mlPayload = {
    product_id: product.product_id,
    category: product.category,
    zone,
    warehouse,
    base_price: product.base_price,
    current_price,
    discount_percent,
    month,
    is_festival,
    lag_1,
    lag_2
  };
  // STEP 4 — Call ML Service
let forecast = 0;
let lower_bound = 0;
let upper_bound = 0;

try {
  const response = await axios.post(
    "http://localhost:8000/predict",
    mlPayload
  );

  forecast = response.data.forecast;
  lower_bound = response.data.lower_bound;
  upper_bound = response.data.upper_bound;

} catch (error) {

  console.log("ML Service Error:", error.message);

  // Fallback logic (temporary safe fallback)
  forecast = requested_quantity;
  lower_bound = requested_quantity * 0.9;
  upper_bound = requested_quantity * 1.1;
}

  // STEP 5 — Risk Evaluation
  let risk_level = "Balanced";

  if (requested_quantity > upper_bound) {
    risk_level = "High Overstock Risk";
  }

  if (requested_quantity < lower_bound) {
    risk_level = "Understock Risk";
  }

  // STEP 6 — Save Request
  const savedRequest = await DemandRequest.create({
    product_id: product.product_id,
    sku,
    category: product.category,
    zone,
    warehouse,
    requested_quantity,
    discount_percent,
    is_festival,
    order_date,
    forecast,
    lower_bound,
    upper_bound,
    risk_level,
    createdBy: user._id
  });

  return savedRequest;
};
export const getRequests = async (user) => {

  let filter = {};

  if (user.role === "retailer") {
    filter = { createdBy: user._id };
  }

  if (user.role === "warehouse") {
    filter = { warehouse: user.zone };
  }

  // Admin sees all
  const requests = await DemandRequest.find(filter);

  return requests;
};