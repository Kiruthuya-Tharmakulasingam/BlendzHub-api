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
import { authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.use(requireRole("staff"));

router.get("/appointments", getMyAppointments);
router.put("/appointments/:id/accept", acceptAppointment);
router.put("/appointments/:id/start", startAppointment);
router.put("/appointments/:id/complete", completeAppointment);

router.get("/products", getMyProducts);
router.get("/equipment", getMyEquipment);
router.put("/products/:id", updateMyProduct);
router.put("/equipment/:id", updateMyEquipment);

router.get("/feedback", getMyFeedback);

export default router;
