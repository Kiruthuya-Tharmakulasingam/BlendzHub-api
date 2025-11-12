import express from "express";
import {
  getStaffByService,
  getAllSpecializations,
} from "../controllers/staffSpecializationController.js";

const router = express.Router();

// Public routes - anyone can view staff specializations
router.get("/", getAllSpecializations);
router.get("/:serviceId", getStaffByService);

export default router;

