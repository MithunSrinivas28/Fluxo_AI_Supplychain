import express from "express";
import { chatWithAI, parseNLPRequest } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/chat", chatWithAI);
router.post("/parse", parseNLPRequest);

export default router;
