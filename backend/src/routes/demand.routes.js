import express from "express";
import { addDemand, fetchDemands,fetchZoneSummary } from "../controllers/demand.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/demand", protect, addDemand);
router.get("/demand", protect, fetchDemands);
router.get("/demand/zone-summary", protect, fetchZoneSummary);

export default router;