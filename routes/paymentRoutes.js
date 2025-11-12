import express from "express";
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
} from "../controllers/paymentController.js";
import { verifyToken, verifyRole, verifyCustomer } from "../middleware/auth.js";

const router = express.Router();

// Read: customers see their own, staff/owner/admin see based on role
router.get("/", verifyToken, getAllPayments);
router.get("/:id", verifyToken, getPaymentById);

// Create: customers can pay for their completed appointments
router.post("/", verifyToken, verifyCustomer, createPayment);

// Update/Delete: only owner/staff
router.put("/:id", verifyToken, verifyRole(["owner", "staff"]), updatePayment);
router.delete(
  "/:id",
  verifyToken,
  verifyRole(["owner", "staff"]),
  deletePayment
);

export default router;
