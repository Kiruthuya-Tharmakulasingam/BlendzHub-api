import express from "express";
import {
  getMySalon,
  createSalon,
  updateMySalon,
  deleteMySalon,
  getMyStaff,
  getPendingStaff,
  approveStaff,
  rejectStaff,
  addStaff,
  updateStaff,
  deleteStaff,
} from "../controllers/ownerController.js";
import { verifyToken, verifyOwner } from "../middleware/auth.js";

const router = express.Router();

// All routes require owner authentication
router.use(verifyToken);
router.use(verifyOwner);

// Salon management
router.get("/salon", getMySalon);
router.post("/salon", createSalon);
router.put("/salon", updateMySalon);
router.delete("/salon", deleteMySalon);

// Staff management
router.get("/staff", getMyStaff);
router.get("/staff/pending", getPendingStaff);
router.post("/staff", addStaff);
router.put("/staff/:id/approve", approveStaff);
router.put("/staff/:id/reject", rejectStaff);
router.put("/staff/:id", updateStaff);
router.delete("/staff/:id", deleteStaff);

export default router;

