import mongoose from "mongoose";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { Inventory } from "../models/inventory.model.js";
import { WeeklySales } from "../models/weeklySales.model.js";
import { DemandRequest } from "../models/demandRequest.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SKU_MAP = {
  "Fertilizer": "FRT-001", "Pesticide": "PST-002", "Seeds": "SED-003",
  "Milk": "MLK-004", "Curd": "CRD-005", "Butter": "BTR-006",
  "Eggs": "EGG-007", "Chicken": "CHK-008", "Rice": "RCE-009",
  "Wheat Flour": "WHF-010", "Corn": "CRN-011", "Onion": "ONI-012",
  "Tomato": "TMT-013", "Potato": "PTT-014", "Apple": "APL-015",
  "Banana": "BNA-016", "Mobile Phone": "MPH-017", "LED Bulb": "LDB-018",
  "Extension Cord": "EXC-019", "Steel Rod": "STR-020", "Cement Bag": "CMB-021",
  "Plastic Granules": "PLG-022", "Office Chair": "OCH-023", "Study Table": "STB-024",
};
const YEAR_MAP = { 1: 2022, 2: 2023, 3: 2024 };

function parseCSV(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split("\n").filter(l => l.trim().length > 0);
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    if (values.length !== headers.length) continue;
    const row = {};
    for (let j = 0; j < headers.length; j++) row[headers[j]] = values[j].trim();
    rows.push(row);
  }
  return rows;
}

export const runSeed = async (req, res) => {
  try {
    // Check for existing data first
    const existingProducts = await Product.countDocuments();
    const existingUsers = await User.countDocuments();
    const existingSales = await WeeklySales.countDocuments();

    if (existingProducts > 0 && existingSales > 0 && existingUsers >= 3) {
      const counts = {
        products: existingProducts,
        weeklySales: existingSales,
        inventory: await Inventory.countDocuments(),
        demandRequests: await DemandRequest.countDocuments(),
        users: existingUsers,
      };
      return res.json({ status: "already_seeded", counts });
    }

    // Parse CSV
    const csvPath = path.resolve(__dirname, "../../data/synthetic_supplychain_data.csv");
    if (!fs.existsSync(csvPath)) {
      return res.status(500).json({ error: "CSV dataset not found", path: csvPath });
    }
    const rows = parseCSV(csvPath);

    // Extract products
    const productMap = new Map();
    for (const row of rows) {
      const pid = parseInt(row.product_id);
      if (!productMap.has(pid)) {
        productMap.set(pid, {
          product_id: pid, name: row.product_name, category: row.category,
          base_price: parseFloat(row.base_price),
          sku: SKU_MAP[row.product_name] || `PRD-${String(pid).padStart(3, "0")}`,
        });
      }
    }

    // Drop database
    await mongoose.connection.db.dropDatabase();

    // Seed products
    const products = Array.from(productMap.values());
    await Product.insertMany(products);

    // Seed WeeklySales
    const BATCH_SIZE = 5000;
    let salesBatch = [];
    let totalInserted = 0;
    for (const row of rows) {
      const rawYear = Math.round(parseFloat(row.year));
      salesBatch.push({
        product_id: parseInt(row.product_id), product_name: row.product_name,
        category: row.category, zone: row.zone, warehouse: row.warehouse,
        year: YEAR_MAP[rawYear] || (2021 + rawYear),
        week: Math.round(parseFloat(row.week)), month: Math.round(parseFloat(row.month)),
        is_festival: Math.round(parseFloat(row.is_festival)),
        base_demand: parseInt(row.base_demand), base_price: parseFloat(row.base_price),
        current_price: parseFloat(row.current_price), discount_percent: parseFloat(row.discount_percent),
        zone_multiplier: parseFloat(row.zone_multiplier), warehouse_multiplier: parseFloat(row.warehouse_multiplier),
        year_growth: parseFloat(row.year_growth), units_sold: parseInt(row.units_sold_next_week),
      });
      if (salesBatch.length >= BATCH_SIZE) {
        await WeeklySales.insertMany(salesBatch, { ordered: false });
        totalInserted += salesBatch.length;
        salesBatch = [];
      }
    }
    if (salesBatch.length > 0) {
      await WeeklySales.insertMany(salesBatch, { ordered: false });
      totalInserted += salesBatch.length;
    }

    // Seed users
    const usersToSeed = [
      { name: "Admin User", email: "admin@fluxo.ai", password: "Admin123", role: "admin" },
      { name: "Retailer User", email: "retailer@fluxo.ai", password: "Retail123", role: "retailer" },
      { name: "Warehouse Manager", email: "warehouse@fluxo.ai", password: "Warehouse123", role: "warehouse" }
    ];
    let adminUser;
    for (const u of usersToSeed) {
      const hashed = await bcrypt.hash(u.password, 10);
      const user = await User.create({ name: u.name, email: u.email.toLowerCase(), password: hashed, role: u.role });
      if (u.role === "admin") adminUser = user;
    }

    // Seed Inventory
    const latestYear = Math.max(...Object.values(YEAR_MAP));
    const inventoryAgg = await WeeklySales.aggregate([
      { $match: { year: latestYear } },
      { $group: { _id: { product_id: "$product_id", product_name: "$product_name", category: "$category", zone: "$zone", warehouse: "$warehouse" }, avgWeeklySales: { $avg: "$units_sold" } } },
    ]);
    const inventories = inventoryAgg.map(item => ({
      zone: item._id.zone, warehouse: item._id.warehouse,
      sku: SKU_MAP[item._id.product_name] || `PRD-${String(item._id.product_id).padStart(3, "0")}`,
      product: item._id.product_name, product_id: item._id.product_id,
      category: item._id.category, stockLevel: Math.round(item.avgWeeklySales * 3),
      updatedBy: adminUser._id,
    }));
    await Inventory.insertMany(inventories);

    // Seed DemandRequests
    const demoProducts = products.slice(0, 10);
    const zonesList = ["North", "South", "East", "West"];
    const warehousesList = ["A", "B", "C"];
    const statusList = ["FULFILLED", "PARTIAL", "PENDING"];
    const retailerUser = await User.findOne({ email: "retailer@fluxo.ai" });
    const demoRequests = [];
    for (let i = 0; i < 20; i++) {
      const prod = demoProducts[i % demoProducts.length];
      const zone = zonesList[i % zonesList.length];
      const wh = warehousesList[i % warehousesList.length];
      const qty = Math.floor(Math.random() * 200) + 50;
      const forecast = qty * (0.8 + Math.random() * 0.4);
      const lower = forecast * 0.85;
      const upper = forecast * 1.15;
      let risk = "Balanced";
      if (qty > upper) risk = "High Overstock Risk";
      else if (qty < lower) risk = "Understock Risk";
      demoRequests.push({
        product_id: prod.product_id, sku: prod.sku, category: prod.category,
        zone, warehouse: wh, requested_quantity: qty,
        discount_percent: Math.floor(Math.random() * 15),
        is_festival: Math.random() > 0.8 ? 1 : 0,
        order_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        forecast: Math.round(forecast), lower_bound: Math.round(lower), upper_bound: Math.round(upper),
        risk_level: risk, status: statusList[i % statusList.length],
        fulfilledQuantity: Math.floor(qty * 0.8), createdBy: retailerUser?._id || adminUser._id
      });
    }
    await DemandRequest.insertMany(demoRequests);

    const counts = {
      products: await Product.countDocuments(),
      weeklySales: await WeeklySales.countDocuments(),
      inventory: await Inventory.countDocuments(),
      demandRequests: await DemandRequest.countDocuments(),
      users: await User.countDocuments(),
    };

    res.json({ status: "seeded", counts });
  } catch (error) {
    console.error("Seed error:", error);
    res.status(500).json({ error: error.message });
  }
};
