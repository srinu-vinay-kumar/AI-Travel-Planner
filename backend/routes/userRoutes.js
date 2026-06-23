import express from "express";
import {
  getProfile,
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/userController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

// * register route
router.post("/register", registerUser);

// * login route
router.post("/login", loginUser);

// * get user profile
router.get("/profile", protectedRoute, getProfile);

// * logout route
router.post("/logout", logoutUser);

export default router;
