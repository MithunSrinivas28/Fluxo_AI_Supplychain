import express from "express";
import { setInventory, fetchInventory } from "../controllers/inventory.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/inventory",
  protect,
  authorize("warehouse"),
  setInventory
);

router.get(
  "/inventory",
  protect,
  authorize("warehouse", "admin"),
  fetchInventory
);

export default router;