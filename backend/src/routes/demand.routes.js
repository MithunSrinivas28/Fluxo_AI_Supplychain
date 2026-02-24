import express from "express";
import { addDemand, fetchDemands,fetchZoneSummary } from "../controllers/demand.controller.js";

const router = express.Router();

router.post("/demand", addDemand);
router.get("/demand", fetchDemands);
router.get("/demand/zone-summary", fetchZoneSummary);

export default router;