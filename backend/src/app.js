import express from "express";
import demandRoutes from "./routes/demand.routes.js";
import healthRoutes from "./routes/health.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

// MUST be here
app.use(express.json());

// THEN routes
app.use(healthRoutes);
app.use(demandRoutes);

// LAST
app.use(errorHandler);

export default app;