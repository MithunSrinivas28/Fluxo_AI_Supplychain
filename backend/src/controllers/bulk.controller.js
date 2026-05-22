import { createRequest } from "../services/request.service.js";

export const bulkUpload = async (req, res, next) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: "No rows provided" });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const result = await createRequest(rows[i], req.user);
        results.push({ row: i + 1, status: "success", data: result });
      } catch (err) {
        errors.push({ row: i + 1, status: "error", message: err.message });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        processed: rows.length,
        succeeded: results.length,
        failed: errors.length,
        results,
        errors,
      },
    });
  } catch (error) {
    next(error);
  }
};
