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
  const { page = 1, limit = 10, status } = req.query;
  const filter = { staffId: req.staff._id };
  if (status) filter.status = status;

  const total = await Appointment.countDocuments(filter);
  const appointments = await Appointment.find(filter)
    .populate("customerId", "name email")
    .populate("serviceId", "name price")
    .populate("salonId", "name location")
    .sort({ date: 1, time: 1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    total,
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
  const customer = await import("../models/user.js").then(m => m.default.findById(appointment.customerId));
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
  const { page = 1, limit = 10 } = req.query;
  const filter = {
    salonId: req.staff.salonId,
    assignedToStaffId: req.staff._id,
  };

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    total,
    data: products,
  });
});

// @desc    Get equipment assigned to staff
// @route   GET /api/staff/equipment
// @access  Private/Staff
export const getMyEquipment = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const filter = {
    salonId: req.staff.salonId,
    assignedToStaffId: req.staff._id,
  };

  const total = await Equipment.countDocuments(filter);
  const equipment = await Equipment.find(filter)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    total,
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
  const { page = 1, limit = 10 } = req.query;
  const filter = { staffId: req.staff._id };

  const total = await Feedback.countDocuments(filter);
  const feedbacks = await Feedback.find(filter)
    .populate("customerId", "name email")
    .populate("salonId", "name")
    .populate("appointmentId")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    total,
    data: feedbacks,
  });
});
