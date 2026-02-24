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
      enum: ["electronics", "groceries", "raw_material", "furniture", "apparel"],
      required: true
    },
    region: {
      type: String,
      enum: ["north", "south", "east", "west"],
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