import express from "express";
import {
  getAllSalons,
  getSalonById,
  createSalon,
  updateSalon,
  deleteSalon,
} from "../controllers/salonController.js";
import { verifyToken, verifyRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyToken, getAllSalons);
router.get("/:id", verifyToken, getSalonById);
router.post("/", verifyToken, verifyRole(["owner", "admin"]), createSalon);
router.put("/:id", verifyToken, verifyRole(["owner", "admin"]), updateSalon);
router.delete("/:id", verifyToken, verifyRole(["owner", "admin"]), deleteSalon);

export default router;
