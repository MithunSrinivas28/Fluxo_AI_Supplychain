import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fluxo").then(async () => {
    console.log("Connected to MongoDB. Resetting users...");
    
    // Delete all users
    await User.deleteMany({});
    console.log("All users deleted.");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123", salt);
    
    await User.create({
        name: "Mithun Srinivas",
        email: "mithunsrinivas28@gmail.com",
        password: hashedPassword,
        role: "admin"
    });
    console.log("Admin user created.");
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
