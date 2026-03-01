// src/models/product.model.js

import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    product_id: {
      type: Number,
      required: true,
      unique: true
    },

    sku: {
      type: String,
      required: true,
      unique: true
    },

    name: {
      type: String,
      required: true
    },

    category: {
      type: String,
      required: true
    },

    base_price: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);