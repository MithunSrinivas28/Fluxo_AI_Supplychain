import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Fluxo backend running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  });
};

start().catch(err => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
