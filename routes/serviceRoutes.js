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

router.get("/", verifyToken, getAllServices);
router.get("/:id", verifyToken, getServiceById);
router.post("/", verifyToken, verifyRole(["owner", "admin"]), createService);
router.put("/:id", verifyToken, verifyRole(["owner", "admin"]), updateService);
router.delete("/:id", verifyToken, verifyRole(["owner", "admin"]), deleteService);

export default router;