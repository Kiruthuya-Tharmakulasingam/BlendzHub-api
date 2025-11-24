import express from "express";
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  markNoShow,
} from "../controllers/appointmentController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticate, getAllAppointments);
router.get("/:id", authenticate, getAppointmentById);

router.post("/", authenticate, requireRole("customer"), createAppointment);

router.put(
  "/:id",
  authenticate,
  requireRole(["owner", "staff"]),
  updateAppointment
);

router.patch(
  "/:id/no-show",
  authenticate,
  requireRole(["owner", "staff"]),
  markNoShow
);

router.delete(
  "/:id",
  authenticate,
  requireRole(["owner", "staff"]),
  deleteAppointment
);

export default router;
