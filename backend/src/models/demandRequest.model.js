// src/models/demandRequest.model.js

import mongoose from "mongoose";

const demandRequestSchema = new mongoose.Schema(
  {
    product_id: Number,
    sku: String,
    category: String,

    zone: {
      type: String
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

    status: {
      type: String,
      enum: ["PENDING", "PARTIAL", "FULFILLED"],
      default: "PENDING"
    },
    fulfilledQuantity: {
      type: Number,
      default: 0
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

export const DemandRequest = mongoose.model("DemandRequest", demandRequestSchema);