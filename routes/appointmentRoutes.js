import express from "express";
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  markNoShow, // No-show controller
} from "../controllers/appointmentController.js";
import { verifyToken, verifyRole, verifyCustomer } from "../middleware/auth.js";

const router = express.Router();

// Get all appointments (role-based access)
router.get("/", verifyToken, getAllAppointments);

// Get single appointment
router.get("/:id", verifyToken, getAppointmentById);

// Customers can book appointments
router.post("/", verifyToken, verifyCustomer, createAppointment);

// Update appointment (full update / reschedule)
router.put(
  "/:id",
  verifyToken,
  verifyRole(["owner", "staff"]),
  updateAppointment
);

// Mark appointment as no-show (partial update)
router.patch(
  "/:id/no-show",
  verifyToken,
  verifyRole(["owner", "staff"]),
  markNoShow
);

// Delete appointment (owner/staff only)
router.delete(
  "/:id",
  verifyToken,
  verifyRole(["owner", "staff"]),
  deleteAppointment
);

export default router;
