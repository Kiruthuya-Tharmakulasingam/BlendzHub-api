import Payment from "../models/payment.js";
import Appointment from "../models/appointment.js";
import Staff from "../models/staff.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

export const getAllPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, method, status } = req.query;
  const filter = {};
  
  if (method) filter.method = method;
  if (status) filter.status = status;

  // Role-based filtering
  if (req.user.role === "customer") {
    filter.customerId = req.user._id;
  } else if (req.user.role === "staff" && req.staff) {
    filter.staffId = req.staff._id;
  } else if (req.user.role === "owner" && req.salon) {
    filter.salonId = req.salon._id;
  }
  // Admin sees all

  const total = await Payment.countDocuments(filter);
  const payments = await Payment.find(filter)
    .populate("appointmentId")
    .populate("customerId", "name email")
    .populate("staffId", "name")
    .populate("salonId", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  
  res.json({ success: true, total, data: payments });
});

export const getPaymentById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };

  // Role-based access
  if (req.user.role === "customer") {
    filter.customerId = req.user._id;
  } else if (req.user.role === "staff" && req.staff) {
    filter.staffId = req.staff._id;
  } else if (req.user.role === "owner" && req.salon) {
    filter.salonId = req.salon._id;
  }

  const payment = await Payment.findOne(filter)
    .populate("appointmentId")
    .populate("customerId", "name email")
    .populate("staffId", "name")
    .populate("salonId", "name");

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  res.json({ success: true, data: payment });
});

// Create payment (customer pays for completed appointment)
export const createPayment = asyncHandler(async (req, res) => {
  const { appointmentId, method } = req.body;

  if (!appointmentId || !method) {
    throw new AppError("Please provide appointmentId and payment method", 400);
  }

  // Get appointment
  const appointment = await Appointment.findById(appointmentId)
    .populate("staffId")
    .populate("serviceId");

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  // Verify appointment belongs to customer
  if (appointment.customerId.toString() !== req.user._id.toString()) {
    throw new AppError("This appointment does not belong to you", 403);
  }

  // Verify appointment is completed
  if (appointment.status !== "completed") {
    throw new AppError("Payment can only be made for completed appointments", 400);
  }

  // Check if payment already exists
  const existingPayment = await Payment.findOne({ appointmentId });
  if (existingPayment) {
    throw new AppError("Payment already exists for this appointment", 400);
  }

  // Create payment
  const payment = await Payment.create({
    appointmentId: appointment._id,
    customerId: req.user._id,
    staffId: appointment.staffId._id,
    salonId: appointment.salonId,
    amount: appointment.amount,
    method,
    status: "completed",
    date: new Date(),
  });

  // Create notification for staff
  const Notification = (await import("../models/notification.js")).default;
  const staffUser = await import("../models/user.js").then(m => m.default.findById(appointment.staffId.userId));
  if (staffUser) {
    await Notification.create({
      userId: staffUser._id,
      staffId: appointment.staffId._id,
      type: "payment_received",
      title: "Payment Received",
      message: `Payment of $${appointment.amount} received from ${req.user.name}`,
      paymentId: payment._id,
      appointmentId: appointment._id,
    });
  }

  const populatedPayment = await Payment.findById(payment._id)
    .populate("appointmentId")
    .populate("customerId", "name email")
    .populate("staffId", "name")
    .populate("salonId", "name");

  res.status(201).json({
    success: true,
    message: "Payment completed. Staff has been notified.",
    data: populatedPayment,
  });
});

export const updatePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!payment) throw new AppError("Payment not found", 404);
  res.json({ success: true, data: payment });
});

export const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findByIdAndDelete(req.params.id);
  if (!payment) throw new AppError("Payment not found", 404);
  res.json({ success: true, message: "Payment deleted successfully" });
});
