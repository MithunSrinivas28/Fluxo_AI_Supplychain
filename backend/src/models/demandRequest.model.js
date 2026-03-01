// src/models/demandRequest.model.js

import mongoose from "mongoose";

const demandRequestSchema = new mongoose.Schema(
  {
    product_id: Number,
    sku: String,
    category: String,

    zone: {
      type: String,
      enum: ["north", "south", "east", "west"]
    },

    warehouse: String,

    requested_quantity: Number,
    discount_percent: Number,
    is_festival: Number,
    order_date: Date,

    forecast: Number,
    lower_bound: Number,
    upper_bound: Number,
    risk_level: String,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

export const DemandRequest = mongoose.model("DemandRequest", demandRequestSchema);