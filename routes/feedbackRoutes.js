import express from "express";
import {
  getAllFeedbacks,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
} from "../controllers/feedbackController.js";
import { verifyToken, verifyRole } from "../middleware/auth.js";

const router = express.Router();

// Read: any authenticated user/customer
router.get("/", verifyToken, getAllFeedbacks);
router.get("/:id", verifyToken, getFeedbackById);

// Create: authenticated customers/users can post feedback
router.post("/", verifyToken, verifyRole(["owner", "admin", "staff", "user", "customer"]), createFeedback);

// Update: owner/admin/staff can moderate
router.put("/:id", verifyToken, verifyRole(["owner", "admin", "staff"]), updateFeedback);

// Delete: admin/owner can remove inappropriate content
router.delete("/:id", verifyToken, verifyRole(["owner", "admin"]), deleteFeedback);

export default router;
