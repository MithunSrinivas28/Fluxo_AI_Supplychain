export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Server Error";

  // Log full error server-side
  console.error(`[ERROR] ${req.method} ${req.path}:`, message);

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error" : message
  });
};