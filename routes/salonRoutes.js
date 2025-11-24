import express from "express";
import {
  getAllSalons,
  getSalonById,
  createSalon,
  updateSalon,
  deleteSalon,
} from "../controllers/salonController.js";
import { authOptional, authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authOptional, getAllSalons);
router.get("/:id", authOptional, getSalonById);

router.post("/", authenticate, requireRole("owner"), createSalon);
router.put("/:id", authenticate, requireRole("owner"), updateSalon);
router.delete("/:id", authenticate, requireRole("owner"), deleteSalon);

export default router;
