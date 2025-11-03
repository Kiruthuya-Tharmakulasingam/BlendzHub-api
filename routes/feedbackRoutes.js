import express from "express";
import {
  getAllFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
} from "../controllers/feedbackController.js";

const router = express.Router();

router.get("/", getAllFeedback);
router.get("/:id", getFeedbackById);
router.post("/", createFeedback);
router.put("/:id", updateFeedback);
router.delete("/:id", deleteFeedback);

export default router;