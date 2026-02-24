import express from "express";
import { getReorderSuggestion } from "../controllers/decision.controller.js";

const router = express.Router();

router.get("/decision/reorder", getReorderSuggestion);

export default router;