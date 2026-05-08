import mongoose from "mongoose";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export const connectDB = async () => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log(`✅ MongoDB connected (attempt ${attempt})`);
      return;
    } catch (error) {
      console.error(`❌ DB connection failed (attempt ${attempt}/${MAX_RETRIES}):`, error.message);
      if (attempt === MAX_RETRIES) {
        console.error("All DB connection attempts exhausted. Exiting.");
        process.exit(1);
      }
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    }
  }
};
