import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/fluxo");
    console.log("MongoDB connected");
  } catch (error) {
    console.error("DB connection failed");
    process.exit(1);
  }
};
