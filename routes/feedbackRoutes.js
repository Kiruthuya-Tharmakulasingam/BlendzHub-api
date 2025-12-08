import express from "express";
import {
  getAllFeedbacks,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  replyToFeedback,
  getMyFeedbacks,
} from "../controllers/feedbackController.js";
import { authenticate, requireRole, authOptional } from "../middleware/auth.js";

const router = express.Router();

// Allow public access to view feedbacks (especially for salon detail pages)
// Authentication is optional - if authenticated, role-based filtering applies
router.get("/", authOptional, getAllFeedbacks);
router.get("/my-feedbacks", authenticate, getMyFeedbacks);
router.get("/:id", authOptional, getFeedbackById);

router.post("/", authenticate, requireRole("customer"), createFeedback);
router.post("/create", authenticate, requireRole("customer"), createFeedback);
router.put("/:id", authenticate, requireRole("customer"), updateFeedback);
router.put("/:id/reply", authenticate, requireRole("owner"), replyToFeedback);
router.delete("/:id", authenticate, requireRole("admin"), deleteFeedback);

export default router;
