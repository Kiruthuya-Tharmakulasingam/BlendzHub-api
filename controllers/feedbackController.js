import Feedback from "../models/feedback.js";
import Appointment from "../models/appointment.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

export const getAllFeedbacks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, rating, salonId, staffId } = req.query;
  const filter = {};
  
  if (rating) filter.rating = Number(rating);
  if (salonId) filter.salonId = salonId;
  if (staffId) filter.staffId = staffId;

  // Role-based filtering
  if (req.user.role === "owner" && req.salon) {
    filter.salonId = req.salon._id;
  } else if (req.user.role === "staff" && req.staff) {
    filter.staffId = req.staff._id;
  }

  const total = await Feedback.countDocuments(filter);
  const feedbacks = await Feedback.find(filter)
    .populate("customerId", "name email")
    .populate("salonId", "name location")
    .populate("staffId", "name role")
    .populate("appointmentId")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  
  res.json({ success: true, total, data: feedbacks });
});

export const getFeedbackById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };

  // Role-based access
  if (req.user.role === "owner" && req.salon) {
    filter.salonId = req.salon._id;
  } else if (req.user.role === "staff" && req.staff) {
    filter.staffId = req.staff._id;
  }

  const feedback = await Feedback.findOne(filter)
    .populate("customerId", "name email")
    .populate("salonId", "name location")
    .populate("staffId", "name role")
    .populate("appointmentId");

  if (!feedback) {
    throw new AppError("Feedback not found", 404);
  }

  res.json({ success: true, data: feedback });
});

// Create feedback (customer can leave feedback after completed appointment)
export const createFeedback = asyncHandler(async (req, res) => {
  const { appointmentId, salonId, staffId, rating, comments } = req.body;

  if (!rating || !salonId) {
    throw new AppError("Please provide rating and salonId", 400);
  }

  // If appointmentId is provided, verify it belongs to customer and is completed
  if (appointmentId) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new AppError("Appointment not found", 404);
    }
    if (appointment.customerId.toString() !== req.user._id.toString()) {
      throw new AppError("This appointment does not belong to you", 403);
    }
    if (appointment.status !== "completed") {
      throw new AppError("Feedback can only be given for completed appointments", 400);
    }
  }

  const feedback = await Feedback.create({
    customerId: req.user._id,
    salonId,
    staffId: staffId || null,
    appointmentId: appointmentId || null,
    rating,
    comments: comments || null,
  });

  const populatedFeedback = await Feedback.findById(feedback._id)
    .populate("customerId", "name email")
    .populate("salonId", "name location")
    .populate("staffId", "name role")
    .populate("appointmentId");

  res.status(201).json({
    success: true,
    message: "Feedback submitted successfully",
    data: populatedFeedback,
  });
});

export const updateFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!feedback) throw new AppError("Feedback not found", 404);
  res.json({ success: true, data: feedback });
});

export const deleteFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findByIdAndDelete(req.params.id);
  if (!feedback) throw new AppError("Feedback not found", 404);
  res.json({ success: true, message: "Feedback deleted successfully" });
});
