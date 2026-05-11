import express from "express";
import { getReorderSuggestion } from "../controllers/decision.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/decision/reorder", protect, authorize("admin", "retailer", "warehouse"), getReorderSuggestion);

export default router;