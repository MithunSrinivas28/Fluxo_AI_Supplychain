import express from "express";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import {
  demandTrends,
  seasonal,
  categoryDemand,
  zonePerformance,
  warehouseUtilization,
  topProducts,
  festivalImpact,
  forecastHistory,
  featureImportance,
  mlPreview,
} from "../controllers/analytics.controller.js";

const router = express.Router();

const allRoles = authorize("admin", "retailer", "warehouse");

router.get("/analytics/demand-trends", protect, allRoles, demandTrends);
router.get("/analytics/seasonal", protect, allRoles, seasonal);
router.get("/analytics/category-demand", protect, allRoles, categoryDemand);
router.get("/analytics/zone-performance", protect, allRoles, zonePerformance);
router.get("/analytics/warehouse-utilization", protect, allRoles, warehouseUtilization);
router.get("/analytics/top-products", protect, allRoles, topProducts);
router.get("/analytics/festival-impact", protect, allRoles, festivalImpact);
router.get("/analytics/forecast-history", protect, allRoles, forecastHistory);
router.get("/analytics/feature-importance", protect, allRoles, featureImportance);
router.post("/analytics/ml-preview", protect, allRoles, mlPreview);

export default router;
