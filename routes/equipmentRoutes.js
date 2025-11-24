import express from "express";
import {
  getAllEquipments,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from "../controllers/equipmentController.js";
import { authOptional, authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authOptional, getAllEquipments);
router.get("/:id", authOptional, getEquipmentById);

router.post("/", authenticate, requireRole(["owner"]), createEquipment);
router.put("/:id", authenticate, requireRole(["owner"]), updateEquipment);
router.delete("/:id", authenticate, requireRole(["owner"]), deleteEquipment);

export default router;
