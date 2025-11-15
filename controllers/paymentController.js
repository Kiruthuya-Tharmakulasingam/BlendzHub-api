import Payment from "../models/payment.js";
import Appointment from "../models/appointment.js";
import Staff from "../models/staff.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

export const getAllPayments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    method,
    status,
    salonId,
    staffId,
    customerId,
    appointmentId,
    minAmount,
    maxAmount,
    amount,
    sortBy = "createdAt",
    sortOrder = "desc",
    startDate,
    endDate,
    paymentStartDate,
    paymentEndDate,
  } = req.query;

  const filter = {};

  // Role-based filtering
  if (req.user.role === "customer") {
    filter.customerId = req.user._id;
  } else if (req.user.role === "staff" && req.staff) {
    filter.staffId = req.staff._id;
  } else if (req.user.role === "owner" && req.salon) {
    filter.salonId = req.salon._id;
  }
  // Admin sees all

  // Method filtering - supports single value or comma-separated values
  if (method) {
    const methodArray = method.split(",").map((m) => m.trim());
    if (methodArray.length === 1) {
      filter.method = methodArray[0];
    } else {
      filter.method = { $in: methodArray };
    }
  }

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
  if (salonId) filter.salonId = salonId;
  if (staffId) filter.staffId = staffId;
  if (customerId && req.user.role !== "customer") filter.customerId = customerId;
  if (appointmentId) filter.appointmentId = appointmentId;

  // Amount filtering
  if (amount) {
    filter.amount = Number(amount);
  } else {
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }
  }

  // Date range filtering (createdAt)
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

  // Payment date range filtering (date field)
  if (paymentStartDate || paymentEndDate) {
    filter.date = {};
    if (paymentStartDate) {
      filter.date.$gte = new Date(paymentStartDate);
    }
    if (paymentEndDate) {
      const end = new Date(paymentEndDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  // Validate sortBy field
  const allowedSortFields = ["date", "amount", "method", "status", "createdAt", "updatedAt"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
  const sort = { [sortField]: sortDirection };

  // Get total count with filters
  const total = await Payment.countDocuments(filter);

  // Calculate pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const totalPages = Math.ceil(total / limitNum);

  // Fetch payments with filters, sorting, and pagination
  const payments = await Payment.find(filter)
    .populate("appointmentId")
    .populate("customerId", "name email")
    .populate("staffId", "name")
    .populate("salonId", "name")
    .sort(sort)
    .skip(skip)
    .limit(limitNum);
  
  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    data: payments,
  });
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
