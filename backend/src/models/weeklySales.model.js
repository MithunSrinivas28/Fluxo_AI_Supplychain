// src/models/weeklySales.model.js

import mongoose from "mongoose";

const weeklySalesSchema = new mongoose.Schema(
  {
    product_id: {
      type: Number,
      required: true
    },

    zone: {
      type: String,
      enum: ["north", "south", "east", "west"],
      required: true
    },

    warehouse: {
      type: String,
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

    units_sold: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

export const WeeklySales = mongoose.model("WeeklySales", weeklySalesSchema);