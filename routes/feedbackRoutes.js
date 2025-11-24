import express from "express";
import {
  getAllFeedbacks,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
} from "../controllers/feedbackController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticate, getAllFeedbacks);
router.get("/:id", authenticate, getFeedbackById);

router.post("/", authenticate, requireRole("customer"), createFeedback);
router.put("/:id", authenticate, requireRole("customer"), updateFeedback);
router.delete("/:id", authenticate, requireRole("admin"), deleteFeedback);

export default router;
