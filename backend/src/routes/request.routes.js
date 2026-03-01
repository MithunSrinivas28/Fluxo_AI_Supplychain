import express from "express";
import { submitRequest } from "../controllers/request.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import { fetchRequests } from "../controllers/request.controller.js";

const router = express.Router();

router.post(
  "/requests",
  protect,
  authorize("retailer"),
  submitRequest
);

router.get(
  "/requests",
  protect,
  authorize("retailer", "warehouse", "admin"),
  fetchRequests
);
export default router;


import { createRequest } from "../services/request.service.js";

// Controller to handle request creation (prediction call)
export const addRequest = async (req, res, next) => {
  try {
    const request = await createRequest(req.body, req.user);

    res.status(201).json({
      success: true,
      data: request
    });

  } catch (error) {
    next(error);
  }
};