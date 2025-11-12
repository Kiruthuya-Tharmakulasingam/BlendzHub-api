import express from "express";
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../controllers/appointmentController.js";
import { verifyToken, verifyRole, verifyCustomer } from "../middleware/auth.js";

const router = express.Router();

// Read: role-based (customers see their own, staff see their own, etc.)
router.get("/", verifyToken, getAllAppointments);
router.get("/:id", verifyToken, getAppointmentById);

// Create: customers can book appointments
router.post("/", verifyToken, verifyCustomer, createAppointment);

// Update/Delete: owner/staff can manage
router.put(
  "/:id",
  verifyToken,
  verifyRole(["owner", "staff"]),
  updateAppointment
);
router.delete(
  "/:id",
  verifyToken,
  verifyRole(["owner", "staff"]),
  deleteAppointment
);

export default router;
