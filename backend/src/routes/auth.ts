import { Router } from "express";
import * as authController from "../controllers/auth";
import { authenticate } from "../middleware/auth";

export const authRouter = Router();

// Register a new user
authRouter.post("/signup", authController.signup);

// Login existing user
authRouter.post("/login", authController.login);

// Get current session
authRouter.get("/me", authenticate, authController.getMe);
