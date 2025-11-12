import express from "express";
import {
  getAllSalons,
  getSalonById,
  createSalon,
  updateSalon,
  deleteSalon,
} from "../controllers/salonController.js";
import { verifyToken, verifyRole } from "../middleware/auth.js";

const router = express.Router();

// Public routes - anyone can view salons
router.get("/", getAllSalons);
router.get("/:id", getSalonById);

// Protected routes - only owner can create/update/delete salons
router.post("/", verifyToken, verifyRole(["owner"]), createSalon);
router.put("/:id", verifyToken, verifyRole(["owner"]), updateSalon);
router.delete("/:id", verifyToken, verifyRole(["owner"]), deleteSalon);

export default router;
