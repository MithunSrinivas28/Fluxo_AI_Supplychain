import { calculateReorder } from "../services/decision/reorder.service.js";

export const getReorderSuggestion = async (req, res, next) => {
  try {
    const region = req.query.region || "global";
    const category = req.query.category || "all";

    const suggestions = await calculateReorder(region, category);

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
};