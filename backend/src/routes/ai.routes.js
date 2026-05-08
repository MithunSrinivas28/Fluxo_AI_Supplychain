import express from "express";
import { chatWithAI, parseNLPRequest } from "../controllers/ai.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/chat", protect, chatWithAI);
router.post("/parse", protect, parseNLPRequest);

export default router;

