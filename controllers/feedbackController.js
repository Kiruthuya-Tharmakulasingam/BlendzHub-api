import Feedback from "../models/feedback.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { paginate } from "../utils/paginate.js";

export const getAllFeedback = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await paginate(Feedback, page, limit, [
    { path: "customerId", model: "Customer" },
    { path: "appointmentId", model: "Appointment" },
  ]);

  res.status(200).json({
    success: true,
    message: "Feedback fetched successfully",
    ...result,
  });
});

export const getFeedbackById = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id).populate(
    "customerId appointmentId"
  );
  if (!feedback) return res.status(404).json({ error: "Feedback not found" });
  res.status(200).json(feedback);
});

export const createFeedback = asyncHandler(async (req, res) => {
  const newFeedback = new Feedback(req.body);
  const saved = await newFeedback.save();
  res.status(201).json({ message: "Feedback created", feedback: saved });
});

export const updateFeedback = asyncHandler(async (req, res) => {
  const updated = await Feedback.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updated) return res.status(404).json({ error: "Feedback not found" });
  res.status(200).json({ message: "Feedback updated", feedback: updated });
});

export const deleteFeedback = asyncHandler(async (req, res) => {
  const deleted = await Feedback.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Feedback not found" });
  res.status(200).json({ message: "Feedback deleted", feedback: deleted });
});
