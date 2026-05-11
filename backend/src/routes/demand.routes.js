import express from "express";
import { addDemand, fetchDemands,fetchZoneSummary } from "../controllers/demand.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/demand", protect, authorize("admin", "retailer"), addDemand);
router.get("/demand", protect, authorize("admin", "retailer", "warehouse"), fetchDemands);
router.get("/demand/zone-summary", protect, authorize("admin", "retailer", "warehouse"), fetchZoneSummary);

export default router;