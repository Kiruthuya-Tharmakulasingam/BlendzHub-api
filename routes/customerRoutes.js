import express from "express";
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";
import { verifyToken, verifyRole } from "../middleware/auth.js";

const router = express.Router();

// Protected routes - only owner/staff can view customers
router.get("/", verifyToken, verifyRole(["owner", "staff"]), getAllCustomers);
router.get(
  "/:id",
  verifyToken,
  verifyRole(["owner", "staff"]),
  getCustomerById
);

// Protected routes - only owner can create/update/delete customers
router.post("/", verifyToken, verifyRole(["owner"]), createCustomer);
router.put("/:id", verifyToken, verifyRole(["owner"]), updateCustomer);
router.delete("/:id", verifyToken, verifyRole(["owner"]), deleteCustomer);

export default router;
