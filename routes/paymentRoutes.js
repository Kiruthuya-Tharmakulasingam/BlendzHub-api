import express from "express";
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
} from "../controllers/paymentController.js";
import { verifyToken, verifyRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyToken, verifyRole(["owner", "admin", "staff"]), getAllPayments);
router.get("/:id", verifyToken, verifyRole(["owner", "admin", "staff"]), getPaymentById);
router.post("/", verifyToken, verifyRole(["owner", "admin"]), createPayment);
router.put("/:id", verifyToken, verifyRole(["owner", "admin"]), updatePayment);
router.delete("/:id", verifyToken, verifyRole(["owner", "admin"]), deletePayment);

export default router;
