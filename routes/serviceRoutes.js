import express from "express";
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "../controllers/serviceController.js";
import { authOptional, authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authOptional, getAllServices);
router.get("/:id", authOptional, getServiceById);

router.post("/", authenticate, requireRole("owner"), createService);
router.put("/:id", authenticate, requireRole("owner"), updateService);
router.delete("/:id", authenticate, requireRole("owner"), deleteService);

export default router;
