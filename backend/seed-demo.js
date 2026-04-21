import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";
import { Product } from "./src/models/product.model.js";
import { Inventory } from "./src/models/inventory.model.js";

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Clear old data for demo consistency
    await Product.deleteMany({});
    await Inventory.deleteMany({});
    await User.deleteMany({ email: { $in: ["mithunsrinivas", "mithunsrinivas28@gmail.com"] } });

    // Create User
    const hashedPassword = await bcrypt.hash("123", 10);
    const demoUser = await User.create({
      name: "mithun s",
      email: "mithunsrinivas28@gmail.com",
      password: hashedPassword,
      role: "admin",
      zone: "Zone A" 
    });
    console.log("Demo user created.");

    // Create Products
    const products = [
      { product_id: 1, sku: "EGG-001", name: "Eggs", category: "Dairy & Poultry", base_price: 5.0 },
      { product_id: 2, sku: "MLK-001", name: "Whole Milk", category: "Dairy & Poultry", base_price: 3.5 },
      { product_id: 3, sku: "PNR-001", name: "Paneer", category: "Dairy & Poultry", base_price: 8.0 },
      { product_id: 4, sku: "BTR-001", name: "Butter", category: "Dairy & Poultry", base_price: 6.0 },
      { product_id: 5, sku: "CHK-001", name: "Chicken", category: "Meat & Poultry", base_price: 15.0 },
      { product_id: 6, sku: "RCE-001", name: "Rice", category: "Grains & Cereals", base_price: 2.0 },
      { product_id: 7, sku: "WHT-001", name: "Wheat", category: "Grains & Cereals", base_price: 1.5 },
      { product_id: 8, sku: "MZE-001", name: "Maize", category: "Grains & Cereals", base_price: 1.2 },
      { product_id: 9, sku: "BRL-001", name: "Barley", category: "Grains & Cereals", base_price: 1.8 },
      { product_id: 10, sku: "TMT-001", name: "Tomato", category: "Fruits & Vegetables", base_price: 3.0 },
      { product_id: 11, sku: "ONI-001", name: "Onion", category: "Fruits & Vegetables", base_price: 2.5 },
      { product_id: 12, sku: "PTT-001", name: "Potato", category: "Fruits & Vegetables", base_price: 2.0 },
      { product_id: 13, sku: "APL-001", name: "Apple", category: "Fruits & Vegetables", base_price: 4.0 },
      { product_id: 14, sku: "BNA-001", name: "Banana", category: "Fruits & Vegetables", base_price: 1.5 },
      { product_id: 15, sku: "ORG-001", name: "Orange", category: "Fruits & Vegetables", base_price: 3.5 },
      { product_id: 16, sku: "LTV-001", name: "LED TV", category: "Electronics", base_price: 300.0 },
      { product_id: 17, sku: "RFG-001", name: "Refrigerator", category: "Electronics", base_price: 600.0 },
      { product_id: 18, sku: "LPT-001", name: "Laptop", category: "Electronics", base_price: 1000.0 },
      { product_id: 19, sku: "CMT-001", name: "Cement", category: "Construction", base_price: 10.0 },
      { product_id: 20, sku: "STR-001", name: "Steel Rods", category: "Construction", base_price: 25.0 },
      { product_id: 21, sku: "OCH-001", name: "Office Chair", category: "Furniture", base_price: 150.0 },
      { product_id: 22, sku: "WTB-001", name: "Wooden Table", category: "Furniture", base_price: 250.0 }
    ];
    await Product.insertMany(products);
    console.log("Products created.");

    // Create Inventory
    const inventories = [];
    for (const p of products) {
      inventories.push({ warehouseZone: "Zone A", sku: p.sku, product: p.name, stockLevel: 10, updatedBy: demoUser._id });
      inventories.push({ warehouseZone: "Zone B", sku: p.sku, product: p.name, stockLevel: 500, updatedBy: demoUser._id });
      inventories.push({ warehouseZone: "Zone C", sku: p.sku, product: p.name, stockLevel: 1000, updatedBy: demoUser._id });
    }
    await Inventory.insertMany(inventories);
    console.log("Inventory seeded.");

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
