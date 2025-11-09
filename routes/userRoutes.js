import express from "express";
import {
  getAllUsers,
  getUserById,
  getPendingUsers,
  approveUser,
  revokeUser,
  updateUserRole,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication and owner/admin role
router.use(protect);
router.use(authorize("owner", "admin"));

router.get("/", getAllUsers);
router.get("/pending", getPendingUsers);
router.get("/:id", getUserById);
// Specific routes must come before general routes
router.put("/:id/approve", approveUser);
router.put("/:id/revoke", revokeUser);
router.put("/:id/role", updateUserRole);
router.put("/:id", updateUser); // General update endpoint
router.delete("/:id", deleteUser);

export default router;

