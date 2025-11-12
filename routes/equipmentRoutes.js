import express from "express";
import {
  getAllEquipments,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from "../controllers/equipmentController.js";
import { verifyToken, verifyRole } from "../middleware/auth.js";

const router = express.Router();

// Public routes - anyone can view equipment
router.get("/", getAllEquipments);
router.get("/:id", getEquipmentById);

// Protected routes - only owner can create/update/delete equipment
router.post("/", verifyToken, verifyRole(["owner"]), createEquipment);
router.put("/:id", verifyToken, verifyRole(["owner"]), updateEquipment);
router.delete("/:id", verifyToken, verifyRole(["owner"]), deleteEquipment);

export default router;
