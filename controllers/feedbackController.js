import Feedback from "../models/feedback.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const getAllFeedback = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  const feedbacks = await Feedback.find().skip(skip).limit(limit);
  const totalFeedback = await Feedback.countDocuments();

  res.status(200).json({
    totalFeedback,
    page,
    totalPages: Math.ceil(totalFeedback / limit),
    count: feedbacks.length,
    feedbacks,
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
