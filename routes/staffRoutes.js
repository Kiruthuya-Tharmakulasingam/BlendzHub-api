import express from "express";
import {
  getMyAppointments,
  acceptAppointment,
  startAppointment,
  completeAppointment,
  getMyProducts,
  getMyEquipment,
  updateMyProduct,
  updateMyEquipment,
  getMyFeedback,
} from "../controllers/staffController.js";
import { verifyToken, verifyStaff } from "../middleware/auth.js";

const router = express.Router();

// All routes require staff authentication
router.use(verifyToken);
router.use(verifyStaff);

// Appointment management
router.get("/appointments", getMyAppointments);
router.put("/appointments/:id/accept", acceptAppointment);
router.put("/appointments/:id/start", startAppointment);
router.put("/appointments/:id/complete", completeAppointment);

// Product & Equipment management
router.get("/products", getMyProducts);
router.get("/equipment", getMyEquipment);
router.put("/products/:id", updateMyProduct);
router.put("/equipment/:id", updateMyEquipment);

// Feedback
router.get("/feedback", getMyFeedback);

export default router;
