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

// Public routes - anyone can view customers and salons
router.get("/", getAllCustomers);
router.get("/:id", getCustomerById);

// Protected routes - only admin/owner can create/update/delete customers
router.post("/", verifyToken, verifyRole(["owner", "admin"]), createCustomer);
router.put("/:id", verifyToken, verifyRole(["owner", "admin"]), updateCustomer);
router.delete("/:id", verifyToken, verifyRole(["owner", "admin"]), deleteCustomer);

export default router;
