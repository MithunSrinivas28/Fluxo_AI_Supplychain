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

const app = express();

// Security headers
app.use(helmet());

// CORS — env-driven origins
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174,https://fluxo.vercel.app")
  .split(",")
  .map(o => o.trim());

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

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
app.use(healthRoutes);
app.use(demandRoutes);
app.use(decisionRoutes);
app.use("/auth", authLimiter);
app.use(authRoutes);
app.use(requestRoutes);
app.use(inventoryRoutes);
app.use("/api/ai", aiRoutes);

// Error handler — LAST
app.use(errorHandler);

export default app;