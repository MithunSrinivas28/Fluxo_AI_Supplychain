import express from "express";
import { bulkUpload } from "../controllers/bulk.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/bulk/requests", protect, authorize("admin", "retailer"), bulkUpload);

export default router;
