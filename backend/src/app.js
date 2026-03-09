import express from "express";
import demandRoutes from "./routes/demand.routes.js";
import healthRoutes from "./routes/health.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import decisionRoutes from "./routes/decision.routes.js";
import authRoutes from "./routes/auth.routes.js";
import requestRoutes from "./routes/request.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import cors from "cors";


const app = express();

// MUST be here
app.use(express.json());

// THEN routes
app.use(healthRoutes);
app.use(demandRoutes);
app.use(decisionRoutes);
app.use(authRoutes);
app.use(requestRoutes);
app.use(inventoryRoutes);

// LAST
app.use(errorHandler);
app.use(cors({
  origin: "http://localhost:5173"
}));

export default app;