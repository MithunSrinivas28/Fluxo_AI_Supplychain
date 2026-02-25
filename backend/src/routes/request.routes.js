import express from "express";
import { submitRequest } from "../controllers/request.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import { fetchRequests } from "../controllers/request.controller.js";

const router = express.Router();

router.post(
  "/requests",
  protect,
  authorize("retailer"),
  submitRequest
);

router.get(
  "/requests",
  protect,
  authorize("retailer", "warehouse", "admin"),
  fetchRequests
);
export default router;