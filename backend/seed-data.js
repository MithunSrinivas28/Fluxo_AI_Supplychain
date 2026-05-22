/**
 * seed-data.js — Fluxo Real Data Seeder
 * 
 * Parses the 44,928-row synthetic supply chain dataset and seeds:
 *   - Products (24 items)
 *   - WeeklySales (~44,928 records)
 *   - Inventory (24 products × 4 zones × 3 warehouses = 288 records)
 *   - Admin user
 *
 * Usage: node seed-data.js
 */

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { User } from "./src/models/user.model.js";
import { Product } from "./src/models/product.model.js";
import { Inventory } from "./src/models/inventory.model.js";
import { WeeklySales } from "./src/models/weeklySales.model.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── SKU Map ───
const SKU_MAP = {
  "Fertilizer": "FRT-001",
  "Pesticide": "PST-002",
  "Seeds": "SED-003",
  "Milk": "MLK-004",
  "Curd": "CRD-005",
  "Butter": "BTR-006",
  "Eggs": "EGG-007",
  "Chicken": "CHK-008",
  "Rice": "RCE-009",
  "Wheat Flour": "WHF-010",
  "Corn": "CRN-011",
  "Onion": "ONI-012",
  "Tomato": "TMT-013",
  "Potato": "PTT-014",
  "Apple": "APL-015",
  "Banana": "BNA-016",
  "Mobile Phone": "MPH-017",
  "LED Bulb": "LDB-018",
  "Extension Cord": "EXC-019",
  "Steel Rod": "STR-020",
  "Cement Bag": "CMB-021",
  "Plastic Granules": "PLG-022",
  "Office Chair": "OCH-023",
  "Study Table": "STB-024",
};

// Map dataset years (1.0, 2.0, 3.0) to real years for display
const YEAR_MAP = { 1: 2022, 2: 2023, 3: 2024 };

// ─── CSV Parser ───
function parseCSV(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split("\n").filter(l => l.trim().length > 0);
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    if (values.length !== headers.length) continue;

    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j].trim();
    }
    rows.push(row);
  }

  return rows;
}

// ─── Main Seed Function ───
async function seed() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fluxo";
  console.log(`\n🔌 Connecting to MongoDB: ${mongoUri.replace(/\/\/[^@]+@/, "//***@")}...`);
  await mongoose.connect(mongoUri);
  console.log("✅ Connected.\n");

  // ──────────────────────────────────────────────
  // STEP 1: Parse CSV
  // ──────────────────────────────────────────────
  const csvPath = path.resolve(__dirname, "../fluxo-rag/data/synthetic_supplychain_data.csv");
  if (!fs.existsSync(csvPath)) {
    console.error("❌ CSV not found at:", csvPath);
    process.exit(1);
  }

  console.log("📄 Parsing CSV...");
  const rows = parseCSV(csvPath);
  console.log(`   ${rows.length} rows parsed.\n`);

  // ──────────────────────────────────────────────
  // STEP 2: Extract unique products
  // ──────────────────────────────────────────────
  const productMap = new Map();
  for (const row of rows) {
    const pid = parseInt(row.product_id);
    if (!productMap.has(pid)) {
      productMap.set(pid, {
        product_id: pid,
        name: row.product_name,
        category: row.category,
        base_price: parseFloat(row.base_price),
        sku: SKU_MAP[row.product_name] || `PRD-${String(pid).padStart(3, "0")}`,
      });
    }
  }

  // ──────────────────────────────────────────────
  // STEP 3: Clear old data
  // ──────────────────────────────────────────────
  console.log("🗑️  Clearing old data...");
  await mongoose.connection.db.dropDatabase();
  console.log("   Collections cleared.\n");

  // ──────────────────────────────────────────────
  // STEP 4: Seed Products
  // ──────────────────────────────────────────────
  const products = Array.from(productMap.values());
  await Product.insertMany(products);
  console.log(`✅ Seeded ${products.length} products.`);

  // ──────────────────────────────────────────────
  // STEP 5: Seed WeeklySales in batches
  // ──────────────────────────────────────────────
  console.log("📊 Seeding WeeklySales (this may take a moment)...");
  const BATCH_SIZE = 5000;
  let salesBatch = [];
  let totalInserted = 0;

  for (const row of rows) {
    const rawYear = Math.round(parseFloat(row.year));
    const mappedYear = YEAR_MAP[rawYear] || (2021 + rawYear);

    salesBatch.push({
      product_id: parseInt(row.product_id),
      product_name: row.product_name,
      category: row.category,
      zone: row.zone,               // "North", "South", "East", "West"
      warehouse: row.warehouse,     // "A", "B", "C"
      year: mappedYear,
      week: Math.round(parseFloat(row.week)),
      month: Math.round(parseFloat(row.month)),
      is_festival: Math.round(parseFloat(row.is_festival)),
      base_demand: parseInt(row.base_demand),
      base_price: parseFloat(row.base_price),
      current_price: parseFloat(row.current_price),
      discount_percent: parseFloat(row.discount_percent),
      zone_multiplier: parseFloat(row.zone_multiplier),
      warehouse_multiplier: parseFloat(row.warehouse_multiplier),
      year_growth: parseFloat(row.year_growth),
      units_sold: parseInt(row.units_sold_next_week),
    });

    if (salesBatch.length >= BATCH_SIZE) {
      await WeeklySales.insertMany(salesBatch, { ordered: false });
      totalInserted += salesBatch.length;
      process.stdout.write(`   ${totalInserted} / ${rows.length} inserted\r`);
      salesBatch = [];
    }
  }

  // Insert remaining
  if (salesBatch.length > 0) {
    await WeeklySales.insertMany(salesBatch, { ordered: false });
    totalInserted += salesBatch.length;
  }
  console.log(`\n✅ Seeded ${totalInserted} WeeklySales records.`);

  // ──────────────────────────────────────────────
  // STEP 6: Seed Inventory
  // ──────────────────────────────────────────────
  // Compute realistic stock levels from latest year's average demand
  console.log("📦 Computing inventory levels from latest year data...");
  const latestYear = Math.max(...Object.values(YEAR_MAP));

  const inventoryAgg = await WeeklySales.aggregate([
    { $match: { year: latestYear } },
    {
      $group: {
        _id: {
          product_id: "$product_id",
          product_name: "$product_name",
          category: "$category",
          zone: "$zone",
          warehouse: "$warehouse",
        },
        avgWeeklySales: { $avg: "$units_sold" },
        latestPrice: { $last: "$base_price" },
      },
    },
  ]);

  // Seed Demo Users
  const usersToSeed = [
    { name: "Admin User", email: "admin@fluxo.ai", password: "Admin123", role: "admin" },
    { name: "Retailer User", email: "retailer@fluxo.ai", password: "Retail123", role: "retailer" },
    { name: "Warehouse Manager", email: "warehouse@fluxo.ai", password: "Warehouse123", role: "warehouse" }
  ];

  let adminUser;

  for (const u of usersToSeed) {
    let existing = await User.findOne({ email: u.email.toLowerCase() });
    if (!existing) {
      const hashed = await bcrypt.hash(u.password, 10);
      existing = await User.create({
        name: u.name,
        email: u.email.toLowerCase(),
        password: hashed,
        role: u.role,
      });
      console.log(`   Created user: ${u.email} / ${u.password} (${u.role})`);
    } else {
      // Ensure password is correct if running over existing db
      const hashed = await bcrypt.hash(u.password, 10);
      existing.password = hashed;
      existing.role = u.role;
      await existing.save();
    }
    if (u.role === "admin") adminUser = existing;
  }

  const inventories = inventoryAgg.map((item) => {
    const productName = item._id.product_name;
    const sku = SKU_MAP[productName] || `PRD-${String(item._id.product_id).padStart(3, "0")}`;
    // Stock = ~3 weeks of average demand (realistic buffer)
    const stockLevel = Math.round(item.avgWeeklySales * 3);

    return {
      zone: item._id.zone,
      warehouse: item._id.warehouse,
      sku,
      product: productName,
      product_id: item._id.product_id,
      category: item._id.category,
      stockLevel,
      updatedBy: adminUser._id,
    };
  });

  await Inventory.insertMany(inventories);
  console.log(`✅ Seeded ${inventories.length} inventory records.`);

  // ──────────────────────────────────────────────
  // STEP 7: Verify
  // ──────────────────────────────────────────────
  const counts = {
    products: await Product.countDocuments(),
    weeklySales: await WeeklySales.countDocuments(),
    inventory: await Inventory.countDocuments(),
    users: await User.countDocuments(),
  };

  console.log("\n═══════════════════════════════════════");
  console.log("  SEED COMPLETE — Collection Summary");
  console.log("═══════════════════════════════════════");
  console.log(`  Products:     ${counts.products}`);
  console.log(`  WeeklySales:  ${counts.weeklySales}`);
  console.log(`  Inventory:    ${counts.inventory}`);
  console.log(`  Users:        ${counts.users}`);
  console.log("═══════════════════════════════════════\n");

  // Quick data integrity check
  const sampleSale = await WeeklySales.findOne({ product_id: 1 }).sort({ year: -1, week: -1 });
  if (sampleSale) {
    console.log("  Sample WeeklySales record:");
    console.log(`    Product: ${sampleSale.product_name} (ID: ${sampleSale.product_id})`);
    console.log(`    Zone: ${sampleSale.zone}, Warehouse: ${sampleSale.warehouse}`);
    console.log(`    Year: ${sampleSale.year}, Week: ${sampleSale.week}, Month: ${sampleSale.month}`);
    console.log(`    Units Sold: ${sampleSale.units_sold}`);
    console.log(`    Price: ${sampleSale.current_price.toFixed(2)} (base: ${sampleSale.base_price})`);
    console.log(`    Festival: ${sampleSale.is_festival ? "Yes" : "No"}`);
  }

  const sampleInv = await Inventory.findOne({ product_id: 1 });
  if (sampleInv) {
    console.log(`\n  Sample Inventory record:`);
    console.log(`    ${sampleInv.product} (${sampleInv.sku})`);
    console.log(`    Zone: ${sampleInv.zone}, Warehouse: ${sampleInv.warehouse}`);
    console.log(`    Stock: ${sampleInv.stockLevel} units`);
  }

  console.log("\n🎉 Fluxo database seeded successfully!\n");
  process.exit(0);
}

seed().catch((err) => {
  console.error("\n❌ Seed failed:", err);
  process.exit(1);
});
