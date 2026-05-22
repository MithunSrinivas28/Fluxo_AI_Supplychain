import mongoose from "mongoose";

const demandSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ["agriculture", "dairy", "poultry", "grains", "vegetables", "fruits", "electronics", "raw_materials", "furniture"],
      required: true
    },
    region: {
      type: String,
      enum: ["North", "South", "East", "West"],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export const Demand = mongoose.model("Demand", demandSchema);