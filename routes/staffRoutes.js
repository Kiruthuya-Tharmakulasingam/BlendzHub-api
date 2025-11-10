import express from "express";
import {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
} from "../controllers/staffController.js";
import { verifyToken, verifyRole } from "../middleware/auth.js";

const router = express.Router();

// Read: authenticated staff/admin/owner
router.get("/", verifyToken, verifyRole(["owner", "admin", "staff"]), getAllStaff);
router.get("/:id", verifyToken, verifyRole(["owner", "admin", "staff"]), getStaffById);

// Write: admin/owner only
router.post("/", verifyToken, verifyRole(["owner", "admin"]), createStaff);
router.put("/:id", verifyToken, verifyRole(["owner", "admin"]), updateStaff);
router.delete("/:id", verifyToken, verifyRole(["owner", "admin"]), deleteStaff);

export default router;