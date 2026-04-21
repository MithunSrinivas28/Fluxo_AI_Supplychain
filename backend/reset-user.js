import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/fluxo").then(async () => {
    console.log("Connected to MongoDB for user reset...");
    let user = await User.findOne({ email: "admin@test.com" });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("test123", salt);
    
    if (user) {
        user.password = hashedPassword;
        await user.save();
        console.log("Updated existing admin@test.com password to test123");
    } else {
        await User.create({
            name: "Admin",
            email: "admin@test.com",
            password: hashedPassword,
            role: "admin"
        });
        console.log("Created new admin@test.com user with test123");
    }
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
