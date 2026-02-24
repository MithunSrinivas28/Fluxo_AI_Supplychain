import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";

export const registerUser = async (data) => {

  const existingUser = await User.findOne({ email: data.email });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await User.create({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    role: data.role || "retailer"
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
};


import jwt from "jsonwebtoken";

export const loginUser = async (data) => {

  const user = await User.findOne({ email: data.email });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(data.password, user.password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN
    }
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};