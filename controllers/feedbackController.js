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
    staffId,
    customerId,
    appointmentId,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
    startDate,
    endDate,
  } = req.query;

  const filter = {};

  // Role-based filtering
  if (req.user.role === "owner" && req.salon) {
    filter.salonId = req.salon._id;
  } else if (req.user.role === "staff" && req.staff) {
    filter.staffId = req.staff._id;
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
  if (staffId) filter.staffId = staffId;
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
        $and: [
          { ...filter },
          { comments: searchRegex },
        ],
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
    .populate("staffId", "name role")
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
