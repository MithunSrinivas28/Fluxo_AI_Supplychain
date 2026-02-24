import { calculateReorder } from "../services/decision/reorder.service.js";

export const getReorderSuggestion = async (req, res, next) => {
  try {
    const { region, category } = req.query;

    if (!region || !category) {
      return res.status(400).json({
        success: false,
        message: "region and category are required"
      });
    }

    const decision = await calculateReorder(region, category);

    if (!decision) {
      return res.status(404).json({
        success: false,
        message: "No demand data found"
      });
    }

    res.status(200).json({
      success: true,
      data: decision
    });

  } catch (error) {
    next(error);
  }
};