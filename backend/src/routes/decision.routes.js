import express from "express";
import { getReorderSuggestion } from "../controllers/decision.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/decision/reorder", protect, getReorderSuggestion);

export default router;