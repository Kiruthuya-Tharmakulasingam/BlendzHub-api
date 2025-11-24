import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import {
  getSalonsWithAppointments,
  getSalonStatistics,
} from "../controllers/adminAnalyticsController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.use(requireRole("admin"));

router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

router.get("/analytics/salons", getSalonsWithAppointments);
router.get("/analytics/salons/:salonId", getSalonStatistics);

export default router;
