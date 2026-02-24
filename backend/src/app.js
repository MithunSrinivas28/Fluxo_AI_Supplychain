import express from "express";
import demandRoutes from "./routes/demand.routes.js";
import healthRoutes from "./routes/health.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import decisionRoutes from "./routes/decision.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

// MUST be here
app.use(express.json());

// THEN routes
app.use(healthRoutes);
app.use(demandRoutes);
app.use(decisionRoutes);
app.use(authRoutes);

// LAST
app.use(errorHandler);

export default app;