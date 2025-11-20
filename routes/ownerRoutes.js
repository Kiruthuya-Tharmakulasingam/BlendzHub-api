import express from "express";
import {
  getMySalon,
  createSalon,
  updateMySalon,
  deleteMySalon,
  getMyStaff,
  addStaff,
  updateStaff,
  deleteStaff,
} from "../controllers/ownerController.js";
import { verifyToken, verifyOwner } from "../middleware/auth.js";

const router = express.Router();

// All routes require owner authentication
router.use(verifyToken);

// Salon management
router.get("/salon", verifyOwner(), getMySalon); // Requires salon to exist
router.post("/salon", verifyOwner(true), createSalon); // Allows creation (no salon required)
router.put("/salon", verifyOwner(), updateMySalon); // Requires salon to exist
router.delete("/salon", verifyOwner(), deleteMySalon); // Requires salon to exist

// Staff management (all require salon to exist)
router.get("/staff", verifyOwner(), getMyStaff);
router.post("/staff", verifyOwner(), addStaff);
router.put("/staff/:id", verifyOwner(), updateStaff);
router.delete("/staff/:id", verifyOwner(), deleteStaff);

export default router;
