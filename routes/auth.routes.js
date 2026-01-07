import express from "express";
import { register, login, logout, me } from "../controllers/auth.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", protect, me);
router.post("/logout", protect, logout);

export default router;