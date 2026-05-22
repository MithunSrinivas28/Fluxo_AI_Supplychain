// src/models/weeklySales.model.js

import mongoose from "mongoose";

const weeklySalesSchema = new mongoose.Schema(
  {
    product_id: {
      type: Number,
      required: true,
      index: true
    },

    product_name: {
      type: String,
      required: true
    },

    category: {
      type: String,
      required: true
    },

    zone: {
      type: String,
      enum: ["North", "South", "East", "West"],
      required: true,
      index: true
    },

    warehouse: {
      type: String,
      enum: ["A", "B", "C"],
      required: true
    },

    year: {
      type: Number,
      required: true
    },

    week: {
      type: Number,
      required: true
    },

    month: {
      type: Number,
      required: true
    },

    is_festival: {
      type: Number,
      default: 0
    },

    base_demand: {
      type: Number
    },

    base_price: {
      type: Number,
      required: true
    },

    current_price: {
      type: Number,
      required: true
    },

    discount_percent: {
      type: Number,
      default: 0
    },

    zone_multiplier: {
      type: Number,
      default: 1.0
    },

    warehouse_multiplier: {
      type: Number,
      default: 1.0
    },

    year_growth: {
      type: Number,
      default: 1.0
    },

    units_sold: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

// Compound index for efficient lag lookups
weeklySalesSchema.index({ product_id: 1, zone: 1, warehouse: 1, year: -1, week: -1 });

// Index for analytics aggregations
weeklySalesSchema.index({ category: 1, month: 1 });
weeklySalesSchema.index({ year: 1, week: 1 });

export const WeeklySales = mongoose.model("WeeklySales", weeklySalesSchema);