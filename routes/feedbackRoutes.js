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

// Create: customers can post feedback
router.post("/", verifyToken, verifyRole(["customer"]), createFeedback);

// Update: staff can moderate
router.put("/:id", verifyToken, verifyRole(["customer"]), updateFeedback);

// Delete: admin can remove inappropriate content
router.delete("/:id", verifyToken, verifyRole(["admin"]), deleteFeedback);

export default router;
