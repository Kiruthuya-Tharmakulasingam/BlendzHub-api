import Payment from "../models/payment.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const getAllPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, method } = req.query;
  const filter = method ? { method } : {};
  const total = await Payment.countDocuments(filter);
  const payments = await Payment.find(filter)
    .skip((page - 1) * limit)
    .limit(Number(limit));
  res.json({ success: true, total, data: payments });
});

export const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new Error("Payment not found");
  res.json({ success: true, data: payment });
});

export const createPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.create(req.body);
  res.status(201).json({ success: true, data: payment });
});

export const updatePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!payment) throw new Error("Payment not found");
  res.json({ success: true, data: payment });
});

export const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findByIdAndDelete(req.params.id);
  if (!payment) throw new Error("Payment not found");
  res.json({ success: true, message: "Payment deleted successfully" });
});
