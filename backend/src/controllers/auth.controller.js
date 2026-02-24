import { registerUser } from "../services/auth.service.js";

export const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user
    });

  } catch (error) {
    next(error);
  }
};

import { loginUser } from "../services/auth.service.js";

export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });

  } catch (error) {
    next(error);
  }
};