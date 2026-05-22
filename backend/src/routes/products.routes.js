import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { Product } from "../models/product.model.js";

const router = express.Router();

router.get("/products", protect, async (req, res, next) => {
  try {
    const products = await Product.find().sort({ product_id: 1 });
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

export default router;
