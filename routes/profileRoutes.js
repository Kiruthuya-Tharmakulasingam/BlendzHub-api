import express from "express";
import {
  getProfile,
  updateProfile,
} from "../controllers/profileController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getProfile);
router.put("/", updateProfile);

export default router;
