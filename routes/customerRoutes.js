import express from "express";
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticate, requireRole(["owner", "admin"]), getAllCustomers);
router.get(
  "/:id",
  authenticate,
  requireRole(["owner", "admin"]),
  getCustomerById
);

router.post("/", authenticate, requireRole("customer"), createCustomer);
router.put("/:id", authenticate, requireRole("customer"), updateCustomer);
router.delete("/:id", authenticate, requireRole("customer"), deleteCustomer);

export default router;
