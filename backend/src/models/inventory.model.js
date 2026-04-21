import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    warehouseZone: {
      type: String,
      required: true
    },
    sku: {
      type: String,
      required: true
    },
    product: {
      type: String,
      required: true
    },
    stockLevel: {
      type: Number,
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

export const Inventory = mongoose.model("Inventory", inventorySchema);