import express from "express";
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "../controllers/serviceController.js";
import { verifyToken, verifyRole } from "../middleware/auth.js";

const router = express.Router();

// Public routes - anyone can view services
router.get("/", getAllServices);
router.get("/:id", getServiceById);

// Protected routes - only admin/owner can create/update/delete services
router.post("/", verifyToken, verifyRole(["owner", "admin"]), createService);
router.put("/:id", verifyToken, verifyRole(["owner", "admin"]), updateService);
router.delete("/:id", verifyToken, verifyRole(["owner", "admin"]), deleteService);

export default router;