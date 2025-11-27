import express from "express";
import {
  getMySalon,
  createSalon,
  updateMySalon,
  deleteMySalon,
  approveOwner,
  rejectOwner,
  deleteOwner,
  listOwners,
  listPendingOwners,
} from "../controllers/ownerController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Admin routes for owner management
router.get("/", authenticate, requireRole("admin"), listOwners);
router.get("/pending", authenticate, requireRole("admin"), listPendingOwners);
router.patch("/:id/approve", authenticate, requireRole("admin"), approveOwner);
router.patch("/:id/reject", authenticate, requireRole("admin"), rejectOwner);
router.delete("/:id", authenticate, requireRole("admin"), deleteOwner);

// Owner self-service routes
router.use(authenticate);
router.use(requireRole("owner"));

router.get("/salon", getMySalon);
router.post("/salon", createSalon);
router.put("/salon", updateMySalon);
router.delete("/salon", deleteMySalon);

export default router;
