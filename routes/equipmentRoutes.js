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

// Equipment is only accessible to authenticated owners
router.get("/", authenticate, requireRole(["owner"]), getAllEquipments);
router.get("/:id", authenticate, requireRole(["owner"]), getEquipmentById);

router.post("/", authenticate, requireRole(["owner"]), createEquipment);
router.put("/:id", authenticate, requireRole(["owner"]), updateEquipment);
router.delete("/:id", authenticate, requireRole(["owner"]), deleteEquipment);

export default router;
