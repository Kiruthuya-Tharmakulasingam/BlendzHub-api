import express from "express";
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../controllers/appointmentController.js";
import { verifyToken, verifyRole } from "../middleware/auth.js";

const router = express.Router();

// Read: authenticated users
router.get("/", verifyToken, getAllAppointments);
router.get("/:id", verifyToken, getAppointmentById);

// Write: admin/owner/staff can manage appointments
router.post("/", verifyToken, verifyRole(["owner", "admin", "staff"]), createAppointment);
router.put("/:id", verifyToken, verifyRole(["owner", "admin", "staff"]), updateAppointment);
router.delete("/:id", verifyToken, verifyRole(["owner", "admin", "staff"]), deleteAppointment);

export default router;
