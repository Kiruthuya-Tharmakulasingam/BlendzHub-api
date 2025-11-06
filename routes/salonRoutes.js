import express from "express";
import {
  getAllSalons,
  getSalonById,
  createSalon,
  updateSalon,
  deleteSalon,
} from "../controllers/salonController.js";

const router = express.Router();

router.get("/", getAllSalons);
router.get("/:id", getSalonById);
router.post("/", createSalon);
router.put("/:id", updateSalon);
router.delete("/:id", deleteSalon);

export default router;
