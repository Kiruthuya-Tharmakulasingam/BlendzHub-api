import Feedback from "../models/feedback.js";
import Appointment from "../models/appointment.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

export const getAllFeedbacks = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    rating,
    minRating,
    maxRating,
    salonId,
    customerId,
    appointmentId,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
    startDate,
    endDate,
  } = req.query;

  const filter = {};

  // Role-based filtering (only if user is authenticated)
  if (req.user) {
    if (req.user.role === "owner" && req.salon) {
      filter.salonId = req.salon._id;
    } else if (req.user.role === "customer" && !salonId) {
      // Only filter by customer if not viewing a specific salon's feedbacks
      filter.customerId = req.user._id;
    }
  }

  // Rating filtering
  if (rating) {
    filter.rating = Number(rating);
  } else {
    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) filter.rating.$gte = Number(minRating);
      if (maxRating) filter.rating.$lte = Number(maxRating);
    }
  }

  // ID-based filtering
  if (salonId) filter.salonId = salonId;
  if (customerId) filter.customerId = customerId;
  if (appointmentId) filter.appointmentId = appointmentId;

  // Date range filtering
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  // Text search in comments
  if (search) {
    const searchRegex = new RegExp(search, "i");
    if (Object.keys(filter).length > 0) {
      const combinedFilter = {
        $and: [{ ...filter }, { comments: searchRegex }],
      };
      Object.keys(filter).forEach((key) => delete filter[key]);
      Object.assign(filter, combinedFilter);
    } else {
      filter.comments = searchRegex;
    }
  }

  // Validate sortBy field
  const allowedSortFields = ["rating", "createdAt", "updatedAt"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
  const sort = { [sortField]: sortDirection };

  // Get total count with filters
  const total = await Feedback.countDocuments(filter);

  // Calculate pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const totalPages = Math.ceil(total / limitNum);

  // Fetch feedbacks with filters, sorting, and pagination
  const feedbacks = await Feedback.find(filter)
    .populate("customerId", "name email")
    .populate("salonId", "name location")
    .populate("appointmentId")
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    data: feedbacks,
  });
});

export const getFeedbackById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };

  // Role-based access
  if (req.user.role === "owner" && req.salon) {
    filter.salonId = req.salon._id;
  }
  const feedback = await Feedback.findOne(filter)
    .populate("customerId", "name email")
    .populate("salonId", "name location")
    .populate("appointmentId");

  if (!feedback) {
    throw new AppError("Feedback not found", 404);
  }

  res.json({ success: true, data: feedback });
});

// Create feedback (customer can leave feedback after completed appointment)
export const createFeedback = asyncHandler(async (req, res) => {
  const { appointmentId, salonId, rating, comments } = req.body;

  if (!rating || !salonId || !appointmentId) {
    throw new AppError("Please provide rating, salonId, and appointmentId", 400);
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }
  if (appointment.customerId.toString() !== req.user._id.toString()) {
    throw new AppError("This appointment does not belong to you", 403);
  }
  if (appointment.status !== "completed") {
    throw new AppError(
      "Feedback can only be given for completed appointments",
      400
    );
  }

  const feedback = await Feedback.create({
    customerId: req.user._id,
    salonId,
    appointmentId,
    rating,
    comments: comments || null,
  });

  const populatedFeedback = await Feedback.findById(feedback._id)
    .populate("customerId", "name email")
    .populate("salonId", "name location")
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

export const replyToFeedback = asyncHandler(async (req, res) => {
  const { reply } = req.body;
  const { id } = req.params;

  if (!reply) {
    throw new AppError("Reply content is required", 400);
  }

  const feedback = await Feedback.findById(id);

  if (!feedback) {
    throw new AppError("Feedback not found", 404);
  }

  // Verify that the salon belongs to the owner
  // req.salon is populated by the authenticate/requireRole middleware for owners usually,
  // but let's double check how it's set up.
  // Looking at other controllers might help, but assuming standard pattern:
  // If the user is an owner, they should only be able to reply to feedback for their salon.

  // Check if the feedback's salonId matches the owner's salon
  // We need to ensure req.salon is available or fetch it.
  // Based on previous context, req.salon seems to be available for owners.

  if (
    req.user.role !== "owner" ||
    feedback.salonId.toString() !== req.salon._id.toString()
  ) {
    throw new AppError("Not authorized to reply to this feedback", 403);
  }

  feedback.reply = reply;
  feedback.repliedAt = Date.now();

  await feedback.save();

  res.json({
    success: true,
    message: "Reply added successfully",
    data: feedback,
  });
});

// Get customer's own feedbacks
export const getMyFeedbacks = asyncHandler(async (req, res) => {
  const { customerId } = req.query;

  const filter = {};

  // Role-based filter - customers can only see their own feedbacks
  if (req.user.role === "customer") {
    filter.customerId = req.user._id;
  } else if (customerId && req.user.role !== "customer") {
    // Admin/owner can specify customerId
    filter.customerId = customerId;
  } else if (req.user.role === "customer") {
    // If customer but no customerId in query, use their own ID
    filter.customerId = req.user._id;
  }

  const feedbacks = await Feedback.find(filter)
    .populate("customerId", "name email")
    .populate("salonId", "name location")
    .populate("appointmentId")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: feedbacks,
  });
});
