import express from "express";
import { getAvailableSlots } from "../controllers/slotController.js";
import { authOptional } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authOptional, getAvailableSlots);

export default router;
