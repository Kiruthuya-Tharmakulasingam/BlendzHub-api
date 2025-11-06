import Feedback from "../models/feedback.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const getAllFeedbacks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, rating } = req.query;
  const filter = rating ? { rating: Number(rating) } : {};
  const total = await Feedback.countDocuments(filter);
  const feedbacks = await Feedback.find(filter)
    .populate("customerId salonId")
    .skip((page - 1) * limit)
    .limit(Number(limit));
  res.json({ success: true, total, data: feedbacks });
});

export const getFeedbackById = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) throw new Error("Feedback not found");
  res.json({ success: true, data: feedback });
});

export const createFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.create(req.body);
  res.status(201).json({ success: true, data: feedback });
});

export const updateFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!feedback) throw new Error("Feedback not found");
  res.json({ success: true, data: feedback });
});

export const deleteFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findByIdAndDelete(req.params.id);
  if (!feedback) throw new Error("Feedback not found");
  res.json({ success: true, message: "Feedback deleted successfully" });
});
