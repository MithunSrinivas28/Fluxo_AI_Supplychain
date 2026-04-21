import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "./src/models/product.model.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/fluxo").then(async () => {
    let prods = await Product.find({});
    console.log("PRODUCTS IN DB:", prods.length);
    if(prods.length > 0) {
        console.log("First product SKU:", prods[0].sku);
    } else {
        await Product.create({
            product_id: 123,
            sku: "PROD-123",
            name: "Test Product",
            category: "Test",
            base_price: 10
        });
        console.log("Created PROD-123");
    }
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
