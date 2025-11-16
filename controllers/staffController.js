import Staff from "../models/staff.js";
import Appointment from "../models/appointment.js";
import Product from "../models/product.js";
import Equipment from "../models/equipment.js";
import Feedback from "../models/feedback.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

// ==================== APPOINTMENT MANAGEMENT ====================

// @desc    Get staff's appointments
// @route   GET /api/staff/appointments
// @access  Private/Staff
export const getMyAppointments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    serviceId,
    sortBy = "date",
    sortOrder = "asc",
    startDate,
    endDate,
  } = req.query;

  const filter = { staffId: req.staff._id };

  // Status filtering - supports single value or comma-separated values
  if (status) {
    const statusArray = status.split(",").map((s) => s.trim());
    if (statusArray.length === 1) {
      filter.status = statusArray[0];
    } else {
      filter.status = { $in: statusArray };
    }
  }

  // ID-based filtering
  if (serviceId) filter.serviceId = serviceId;

  // Date range filtering
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      filter.date.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  // Text search in notes
  if (search) {
    const searchRegex = new RegExp(search, "i");
    if (Object.keys(filter).length > 0) {
      const combinedFilter = {
        $and: [{ ...filter }, { notes: searchRegex }],
      };
      Object.keys(filter).forEach((key) => delete filter[key]);
      Object.assign(filter, combinedFilter);
    } else {
      filter.notes = searchRegex;
    }
  }

  // Validate sortBy field
  const allowedSortFields = [
    "date",
    "time",
    "status",
    "createdAt",
    "updatedAt",
  ];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "date";
  const sortDirection = sortOrder.toLowerCase() === "desc" ? -1 : 1;
  const sort = { [sortField]: sortDirection };
  if (sortField === "date") {
    sort.time = sortDirection;
  }

  // Get total count with filters
  const total = await Appointment.countDocuments(filter);

  // Calculate pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const totalPages = Math.ceil(total / limitNum);

  // Fetch appointments with filters, sorting, and pagination
  const appointments = await Appointment.find(filter)
    .populate("customerId", "name email")
    .populate("serviceId", "name price")
    .populate("salonId", "name location")
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    data: appointments,
  });
});

// @desc    Accept appointment
// @route   PUT /api/staff/appointments/:id/accept
// @access  Private/Staff
export const acceptAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findOne({
    _id: req.params.id,
    staffId: req.staff._id,
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  if (appointment.status !== "pending") {
    throw new AppError(`Appointment is already ${appointment.status}`, 400);
  }

  appointment.status = "accepted";
  appointment.acceptedAt = new Date();
  await appointment.save();

  // Create notification for customer
  const Notification = (await import("../models/notification.js")).default;
  const customer = await import("../models/user.js").then((m) =>
    m.default.findById(appointment.customerId)
  );
  if (customer) {
    await Notification.create({
      userId: customer._id,
      staffId: req.staff._id,
      type: "appointment_accepted",
      title: "Appointment Accepted",
      message: `Your appointment has been accepted by ${req.staff.name}`,
      appointmentId: appointment._id,
    });
  }

  res.json({
    success: true,
    message: "Appointment accepted successfully",
    data: appointment,
  });
});

// @desc    Start service (begin timeline)
// @route   PUT /api/staff/appointments/:id/start
// @access  Private/Staff
export const startAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findOne({
    _id: req.params.id,
    staffId: req.staff._id,
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  if (appointment.status !== "accepted") {
    throw new AppError("Appointment must be accepted before starting", 400);
  }

  appointment.status = "in-progress";
  appointment.startedAt = new Date();
  await appointment.save();

  res.json({
    success: true,
    message: "Service started. Timeline tracking began.",
    data: appointment,
  });
});

// @desc    Complete service (stop timeline)
// @route   PUT /api/staff/appointments/:id/complete
// @access  Private/Staff
export const completeAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findOne({
    _id: req.params.id,
    staffId: req.staff._id,
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  if (appointment.status !== "in-progress") {
    throw new AppError("Service must be in progress to complete", 400);
  }

  appointment.status = "completed";
  appointment.completedAt = new Date();
  await appointment.save();

  res.json({
    success: true,
    message: "Service completed. Timeline stopped.",
    data: appointment,
  });
});

// ==================== PRODUCT & EQUIPMENT MANAGEMENT ====================

// @desc    Get products assigned to staff
// @route   GET /api/staff/products
// @access  Private/Staff
export const getMyProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    supplier,
    minQualityRating,
    maxQualityRating,
    sortBy = "createdAt",
    sortOrder = "desc",
    startDate,
    endDate,
  } = req.query;

  const filter = {
    salonId: req.staff.salonId,
    assignedToStaffId: req.staff._id,
  };

  // Supplier filtering
  if (supplier) {
    filter.supplier = new RegExp(supplier, "i");
  }

  // Quality rating filtering
  if (minQualityRating || maxQualityRating) {
    filter.qualityRating = {};
    if (minQualityRating) filter.qualityRating.$gte = Number(minQualityRating);
    if (maxQualityRating) filter.qualityRating.$lte = Number(maxQualityRating);
  }

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

  // Text search in name and supplier
  if (search) {
    const searchRegex = new RegExp(search, "i");
    const searchConditions = [{ name: searchRegex }, { supplier: searchRegex }];

    const combinedFilter = {
      $and: [{ ...filter }, { $or: searchConditions }],
    };
    Object.keys(filter).forEach((key) => delete filter[key]);
    Object.assign(filter, combinedFilter);
  }

  // Validate sortBy field
  const allowedSortFields = [
    "name",
    "supplier",
    "qualityRating",
    "createdAt",
    "updatedAt",
  ];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
  const sort = { [sortField]: sortDirection };

  // Get total count with filters
  const total = await Product.countDocuments(filter);

  // Calculate pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const totalPages = Math.ceil(total / limitNum);

  // Fetch products with filters, sorting, and pagination
  const products = await Product.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    data: products,
  });
});

// @desc    Get equipment assigned to staff
// @route   GET /api/staff/equipment
// @access  Private/Staff
export const getMyEquipment = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
    startDate,
    endDate,
  } = req.query;

  const filter = {
    salonId: req.staff.salonId,
    assignedToStaffId: req.staff._id,
  };

  // Status filtering - supports single value or comma-separated values
  if (status) {
    const statusArray = status.split(",").map((s) => s.trim());
    if (statusArray.length === 1) {
      filter.status = statusArray[0];
    } else {
      filter.status = { $in: statusArray };
    }
  }

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

  // Text search in name
  if (search) {
    const searchRegex = new RegExp(search, "i");
    const combinedFilter = {
      $and: [{ ...filter }, { name: searchRegex }],
    };
    Object.keys(filter).forEach((key) => delete filter[key]);
    Object.assign(filter, combinedFilter);
  }

  // Validate sortBy field
  const allowedSortFields = ["name", "status", "createdAt", "updatedAt"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
  const sort = { [sortField]: sortDirection };

  // Get total count with filters
  const total = await Equipment.countDocuments(filter);

  // Calculate pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const totalPages = Math.ceil(total / limitNum);

  // Fetch equipment with filters, sorting, and pagination
  const equipment = await Equipment.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    data: equipment,
  });
});

// @desc    Update product assigned to staff
// @route   PUT /api/staff/products/:id
// @access  Private/Staff
export const updateMyProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    salonId: req.staff.salonId,
    assignedToStaffId: req.staff._id,
  });

  if (!product) {
    throw new AppError("Product not found or not assigned to you", 404);
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: "Product updated successfully",
    data: updatedProduct,
  });
});

// @desc    Update equipment assigned to staff
// @route   PUT /api/staff/equipment/:id
// @access  Private/Staff
export const updateMyEquipment = asyncHandler(async (req, res) => {
  const equipment = await Equipment.findOne({
    _id: req.params.id,
    salonId: req.staff.salonId,
    assignedToStaffId: req.staff._id,
  });

  if (!equipment) {
    throw new AppError("Equipment not found or not assigned to you", 404);
  }

  const updatedEquipment = await Equipment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: "Equipment updated successfully",
    data: updatedEquipment,
  });
});

// ==================== FEEDBACK ====================

// @desc    Get feedback for staff
// @route   GET /api/staff/feedback
// @access  Private/Staff
export const getMyFeedback = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    rating,
    minRating,
    maxRating,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
    startDate,
    endDate,
  } = req.query;

  const filter = { staffId: req.staff._id };

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
    const combinedFilter = {
      $and: [{ ...filter }, { comments: searchRegex }],
    };
    Object.keys(filter).forEach((key) => delete filter[key]);
    Object.assign(filter, combinedFilter);
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
    .populate("salonId", "name")
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
