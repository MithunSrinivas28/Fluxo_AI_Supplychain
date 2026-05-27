import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import demandRoutes from "./routes/demand.routes.js";
import healthRoutes from "./routes/health.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import decisionRoutes from "./routes/decision.routes.js";
import authRoutes from "./routes/auth.routes.js";
import requestRoutes from "./routes/request.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import productsRoutes from "./routes/products.routes.js";
import bulkRoutes from "./routes/bulk.routes.js";
import { runSeed } from "./controllers/seed.controller.js";

const app = express();

// CORS — env-driven origins (must be before helmet so preflight OPTIONS succeeds)
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174,https://fluxoai-lovat.vercel.app")
  .split(",")
  .map(o => o.trim());

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// Security headers
app.use(helmet());

// Body parser
app.use(express.json({ limit: "1mb" }));

// Rate limiting on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: "Too many auth attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use("/api", healthRoutes);
app.use("/api", demandRoutes);
app.use("/api", decisionRoutes);
app.use("/api/auth", authLimiter);
app.use("/api", authRoutes);
app.use("/api", requestRoutes);
app.use("/api", inventoryRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", productsRoutes);
app.use("/api", bulkRoutes);

// Root health check for Render
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Seed endpoint (for initial production setup)
app.post("/api/seed", runSeed);

// Error handler — LAST
app.use(errorHandler);

export default app;