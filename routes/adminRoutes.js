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
import {
  getSalonsWithAppointments,
  getSalonStatistics,
} from "../controllers/adminAnalyticsController.js";
import { verifyToken, verifyRole } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication and owner/admin role
router.use(verifyToken);
router.use(verifyRole(["owner", "admin"]));

// User management routes
router.get("/users", getAllUsers);
router.get("/users/pending", getPendingUsers);
router.get("/users/:id", getUserById);
// Specific routes must come before general routes
router.put("/users/:id/approve", approveUser);
router.put("/users/:id/revoke", revokeUser);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id", updateUser); // General update endpoint
router.delete("/users/:id", deleteUser);

// Analytics routes (admin only)
router.get("/analytics/salons", verifyRole("admin"), getSalonsWithAppointments);
router.get(
  "/analytics/salons/:salonId",
  verifyRole("admin"),
  getSalonStatistics
);

export default router;
