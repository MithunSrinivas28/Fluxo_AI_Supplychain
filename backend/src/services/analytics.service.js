import { WeeklySales } from "../models/weeklySales.model.js";
import { Inventory } from "../models/inventory.model.js";
import { DemandRequest } from "../models/demandRequest.model.js";
import { Product } from "../models/product.model.js";
import axios from "axios";

// ─── Demand Trends ───
export const getDemandTrends = async (period = "30d") => {
  const limitMap = { "7d": 7, "30d": 30, "90d": 156 };
  const limit = limitMap[period] || 30;

  const pipeline = [
    { $group: {
      _id: { year: "$year", week: "$week" },
      orders: { $sum: "$units_sold" },
      avgPrice: { $avg: "$current_price" },
    }},
    { $sort: { "_id.year": 1, "_id.week": 1 } },
    { $project: {
      _id: 0,
      date: { $concat: ["W", { $toString: "$_id.week" }, " ", { $toString: "$_id.year" }] },
      year: "$_id.year",
      week: "$_id.week",
      orders: 1,
      avgPrice: { $round: ["$avgPrice", 2] },
    }},
  ];

  const all = await WeeklySales.aggregate(pipeline);
  return all.slice(-limit);
};

// ─── Seasonal Analysis ───
export const getSeasonalAnalysis = async () => {
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const result = await WeeklySales.aggregate([
    { $group: {
      _id: "$month",
      demand: { $avg: "$units_sold" },
    }},
    { $sort: { _id: 1 } },
    { $project: {
      _id: 0,
      month: "$_id",
      monthName: { $arrayElemAt: [monthNames, { $subtract: ["$_id", 1] }] },
      demand: { $round: ["$demand", 0] },
    }},
  ]);

  return result;
};

// ─── Category Demand ───
export const getCategoryDemand = async () => {
  const totalDoc = await WeeklySales.aggregate([
    { $group: { _id: null, total: { $sum: "$units_sold" } } }
  ]);
  const total = totalDoc[0]?.total || 1;

  const result = await WeeklySales.aggregate([
    { $group: {
      _id: "$category",
      totalDemand: { $sum: "$units_sold" },
    }},
    { $sort: { totalDemand: -1 } },
    { $project: {
      _id: 0,
      category: "$_id",
      totalDemand: 1,
      percentage: { $round: [{ $multiply: [{ $divide: ["$totalDemand", total] }, 100] }, 1] },
    }},
  ]);

  return result;
};

// ─── Zone Performance ───
export const getZonePerformance = async () => {
  const salesByZone = await WeeklySales.aggregate([
    { $group: {
      _id: "$zone",
      avgDemand: { $avg: "$units_sold" },
      totalDemand: { $sum: "$units_sold" },
    }},
    { $sort: { _id: 1 } },
  ]);

  const invByZone = await Inventory.aggregate([
    { $group: {
      _id: "$zone",
      totalStock: { $sum: "$stockLevel" },
      productCount: { $sum: 1 },
    }},
  ]);

  const invMap = {};
  for (const z of invByZone) {
    invMap[z._id] = z;
  }

  return salesByZone.map(z => ({
    zone: z._id,
    avgDemand: Math.round(z.avgDemand),
    totalDemand: z.totalDemand,
    totalStock: invMap[z._id]?.totalStock || 0,
    productCount: invMap[z._id]?.productCount || 0,
  }));
};

// ─── Warehouse Utilization ───
export const getWarehouseUtilization = async () => {
  const inv = await Inventory.aggregate([
    { $group: {
      _id: { zone: "$zone", warehouse: "$warehouse" },
      totalStock: { $sum: "$stockLevel" },
      productCount: { $sum: 1 },
    }},
    { $sort: { "_id.zone": 1, "_id.warehouse": 1 } },
  ]);

  // Get latest year average demand per zone+warehouse
  const latestYear = await WeeklySales.aggregate([
    { $sort: { year: -1 } },
    { $limit: 1 },
    { $project: { year: 1 } },
  ]);
  const maxYear = latestYear[0]?.year || 2024;

  const demand = await WeeklySales.aggregate([
    { $match: { year: maxYear } },
    { $group: {
      _id: { zone: "$zone", warehouse: "$warehouse" },
      avgWeeklyDemand: { $avg: "$units_sold" },
    }},
  ]);

  const demandMap = {};
  for (const d of demand) {
    demandMap[`${d._id.zone}-${d._id.warehouse}`] = d.avgWeeklyDemand;
  }

  return inv.map(i => {
    const key = `${i._id.zone}-${i._id.warehouse}`;
    const avgDemand = demandMap[key] || 1;
    const weeksOfStock = Math.round(i.totalStock / avgDemand * 10) / 10;
    return {
      zone: i._id.zone,
      warehouse: i._id.warehouse,
      totalStock: i.totalStock,
      avgWeeklyDemand: Math.round(avgDemand),
      weeksOfStock,
      productCount: i.productCount,
    };
  });
};

// ─── Top Products ───
export const getTopProducts = async (limit = 10) => {
  const latestYear = await WeeklySales.aggregate([
    { $sort: { year: -1 } },
    { $limit: 1 },
    { $project: { year: 1 } },
  ]);
  const maxYear = latestYear[0]?.year || 2024;

  const result = await WeeklySales.aggregate([
    { $match: { year: maxYear } },
    { $group: {
      _id: { product_id: "$product_id", product_name: "$product_name", category: "$category" },
      avgDemand: { $avg: "$units_sold" },
      totalDemand: { $sum: "$units_sold" },
    }},
    { $sort: { avgDemand: -1 } },
    { $limit: limit },
    { $project: {
      _id: 0,
      product_id: "$_id.product_id",
      product_name: "$_id.product_name",
      category: "$_id.category",
      avgDemand: { $round: ["$avgDemand", 0] },
      totalDemand: 1,
    }},
  ]);

  return result;
};

// ─── Festival Impact ───
export const getFestivalImpact = async () => {
  const result = await WeeklySales.aggregate([
    { $group: {
      _id: { category: "$category", is_festival: "$is_festival" },
      avgDemand: { $avg: "$units_sold" },
    }},
    { $sort: { "_id.category": 1, "_id.is_festival": 1 } },
  ]);

  // Pivot into { category, festivalAvg, nonFestivalAvg, uplift_percent }
  const map = {};
  for (const r of result) {
    const cat = r._id.category;
    if (!map[cat]) map[cat] = { category: cat, festivalAvg: 0, nonFestivalAvg: 0 };
    if (r._id.is_festival === 1) {
      map[cat].festivalAvg = Math.round(r.avgDemand);
    } else {
      map[cat].nonFestivalAvg = Math.round(r.avgDemand);
    }
  }

  return Object.values(map).map(m => ({
    ...m,
    uplift_percent: m.nonFestivalAvg > 0
      ? Math.round(((m.festivalAvg - m.nonFestivalAvg) / m.nonFestivalAvg) * 100)
      : 0,
  }));
};

// ─── Forecast History ───
export const getForecastHistory = async () => {
  const requests = await DemandRequest.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return requests.map(r => ({
    id: r._id,
    sku: r.sku,
    category: r.category,
    zone: r.zone,
    warehouse: r.warehouse,
    requested_quantity: r.requested_quantity,
    forecast: r.forecast,
    lower_bound: r.lower_bound,
    upper_bound: r.upper_bound,
    risk_level: r.risk_level,
    status: r.status,
    fulfilledQuantity: r.fulfilledQuantity,
    createdAt: r.createdAt,
  }));
};

// ─── Feature Importance ───
export const getFeatureImportance = async () => {
  // Compute actual impact metrics from the data
  const [discountImpact] = await WeeklySales.aggregate([
    { $group: {
      _id: null,
      withDiscount: { $avg: { $cond: [{ $gt: ["$discount_percent", 0] }, "$units_sold", null] } },
      noDiscount: { $avg: { $cond: [{ $eq: ["$discount_percent", 0] }, "$units_sold", null] } },
    }},
  ]);

  const monthlyVariance = await WeeklySales.aggregate([
    { $group: { _id: "$month", avg: { $avg: "$units_sold" } } },
    { $group: { _id: null, stddev: { $stdDevPop: "$avg" }, mean: { $avg: "$avg" } } },
  ]);

  const zoneVariance = await WeeklySales.aggregate([
    { $group: { _id: "$zone", avg: { $avg: "$units_sold" } } },
    { $group: { _id: null, stddev: { $stdDevPop: "$avg" }, mean: { $avg: "$avg" } } },
  ]);

  const festivalData = await WeeklySales.aggregate([
    { $group: {
      _id: "$is_festival",
      avgDemand: { $avg: "$units_sold" },
    }},
  ]);

  // Compute raw importance scores
  const discountEffect = discountImpact
    ? Math.abs((discountImpact.withDiscount - discountImpact.noDiscount) / (discountImpact.noDiscount || 1)) * 100
    : 10;

  const seasonalEffect = monthlyVariance[0]
    ? (monthlyVariance[0].stddev / (monthlyVariance[0].mean || 1)) * 100
    : 10;

  const zoneEffect = zoneVariance[0]
    ? (zoneVariance[0].stddev / (zoneVariance[0].mean || 1)) * 100
    : 10;

  const festMap = {};
  for (const f of festivalData) festMap[f._id] = f.avgDemand;
  const festivalEffect = festMap[0] > 0
    ? ((festMap[1] - festMap[0]) / festMap[0]) * 100
    : 5;

  const priceEffect = 15; // Baseline from model training

  // Normalize to sum to 100
  const raw = [
    { feature: "Discount Impact", score: Math.abs(discountEffect) },
    { feature: "Seasonal Effect", score: Math.abs(seasonalEffect) },
    { feature: "Zone Effect", score: Math.abs(zoneEffect) },
    { feature: "Festival Impact", score: Math.abs(festivalEffect) },
    { feature: "Price Elasticity", score: priceEffect },
  ];

  const totalRaw = raw.reduce((s, r) => s + r.score, 0) || 1;

  return raw
    .map(r => ({ feature: r.feature, pct: Math.round((r.score / totalRaw) * 100) }))
    .sort((a, b) => b.pct - a.pct);
};

// ─── ML Preview ───
export const getMLPreview = async (payload) => {
  const { sku, zone, warehouse, discount_percent = 0, is_festival = 0, order_date } = payload;

  const product = await Product.findOne({ sku });
  if (!product) throw new Error("Product not found");

  // Fetch lag features
  const sales = await WeeklySales.find({
    product_id: product.product_id,
    zone,
    warehouse,
  }).sort({ year: -1, week: -1 }).limit(2);

  const lag_1 = sales[0]?.units_sold || 0;
  const lag_2 = sales[1]?.units_sold || 0;
  const year_growth = sales[0]?.year_growth || 1.05;

  const current_price = product.base_price * (1 - discount_percent / 100);
  const month = order_date ? new Date(order_date).getMonth() + 1 : new Date().getMonth() + 1;

  const mlPayload = {
    product_id: product.product_id,
    category: product.category.toLowerCase(),
    zone: zone.toLowerCase(),
    warehouse,
    base_price: product.base_price,
    current_price,
    discount_percent,
    month,
    is_festival,
    lag_1,
    lag_2,
    year_growth,
  };

  const mlUrl = process.env.ML_SERVICE_URL || "http://localhost:8001";

  try {
    const response = await axios.post(`${mlUrl}/predict`, mlPayload, { timeout: 10000 });
    const { forecast, lower_bound, upper_bound } = response.data;

    // Get inventory stock
    const inv = await Inventory.findOne({ sku, zone, warehouse });
    const currentStock = inv?.stockLevel || 0;

    return {
      forecast: Math.round(forecast),
      lower_bound: Math.round(lower_bound),
      upper_bound: Math.round(upper_bound),
      currentStock,
      lag_1,
      lag_2,
      product_name: product.name,
      category: product.category,
    };
  } catch (err) {
    // Fallback using historical average
    const avgDemand = lag_1 > 0 ? Math.round((lag_1 + lag_2) / 2) : 100;
    return {
      forecast: avgDemand,
      lower_bound: Math.round(avgDemand * 0.85),
      upper_bound: Math.round(avgDemand * 1.15),
      currentStock: 0,
      lag_1,
      lag_2,
      product_name: product.name,
      category: product.category,
      fallback: true,
    };
  }
};
