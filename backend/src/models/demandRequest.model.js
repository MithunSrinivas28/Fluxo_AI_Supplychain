import mongoose from "mongoose";

const demandRequestSchema = new mongoose.Schema(
  {
    product: {
      type: String,
      required: true
    },
    fromZone: {
      type: String,
      enum: ["north", "south", "east", "west"],
      required: true
    },
    toZone: {
      type: String,
      enum: ["north", "south", "east", "west"],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    predictedKPI: {
      type: Number
    },
    status: {
      type: String,
      enum: ["temporary", "saved"],
      default: "temporary"
    },
    retailer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    targetWarehouseZone: {
      type: String,
      enum: ["north", "south", "east", "west"],
      required: true
    }
  },
  { timestamps: true }
);

export const DemandRequest = mongoose.model("DemandRequest", demandRequestSchema);