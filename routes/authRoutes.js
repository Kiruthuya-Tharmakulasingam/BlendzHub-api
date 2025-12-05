import express from "express";
import {
  registerCustomer,
  registerOwner,
  login,
  getMe,
  logout,
  updateProfile,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/register/customer", registerCustomer);
router.post("/register/owner", registerOwner);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.put("/profile", authenticate, updateProfile);
router.post("/logout", authenticate, logout);

export default router;

