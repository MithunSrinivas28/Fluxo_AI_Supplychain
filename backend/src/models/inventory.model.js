import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    zone: {
      type: String,
      enum: ["North", "South", "East", "West"],
      required: true
    },
    warehouse: {
      type: String,
      enum: ["A", "B", "C"],
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
    product_id: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    stockLevel: {
      type: Number,
      required: true,
      default: 0
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

// Compound index for lookups during request fulfillment
inventorySchema.index({ sku: 1, zone: 1, warehouse: 1 });
inventorySchema.index({ zone: 1, warehouse: 1 });

export const Inventory = mongoose.model("Inventory", inventorySchema);