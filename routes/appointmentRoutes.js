import express from "express";
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  markNoShow,
  updateAppointmentStatus,
  rescheduleAppointment,
} from "../controllers/appointmentController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticate, getAllAppointments);
router.get("/:id", authenticate, getAppointmentById);

router.post("/", authenticate, requireRole("customer"), createAppointment);

router.put("/:id", authenticate, requireRole(["owner"]), updateAppointment);
router.put("/:id/reschedule", authenticate, rescheduleAppointment);

router.patch("/:id/status", authenticate, requireRole(["owner"]), updateAppointmentStatus);

router.patch("/:id/no-show", authenticate, requireRole(["owner"]), markNoShow);

router.delete("/:id", authenticate, requireRole(["customer", "owner"]), deleteAppointment);

export default router;
