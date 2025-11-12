import express from "express";
import { getProfile, updateProfile } from "../controllers/profileController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

router.get("/", getProfile);
router.put("/", updateProfile);

export default router;

