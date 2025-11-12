import Salon from "../models/salon.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

export const getAllSalons = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type } = req.query;
  const filter = type ? { type } : {};
  const total = await Salon.countDocuments(filter);
  const salons = await Salon.find(filter)
    .populate("ownerId", "name email")
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });
  res.json({ success: true, total, data: salons });
});

export const getSalonById = asyncHandler(async (req, res) => {
  const salon = await Salon.findById(req.params.id)
    .populate("ownerId", "name email");
  if (!salon) throw new AppError("Salon not found", 404);
  res.json({ success: true, data: salon });
});

export const createSalon = asyncHandler(async (req, res) => {
  // If owner is creating, set ownerId automatically
  let ownerId = req.body.ownerId;
  if (req.user && req.user.role === "owner") {
    ownerId = req.user._id;
  }

  if (!ownerId) {
    throw new AppError("ownerId is required", 400);
  }

  const salon = await Salon.create({
    ...req.body,
    ownerId,
  });

  // Update user's salonId if owner
  if (req.user && req.user.role === "owner") {
    const User = (await import("../models/user.js")).default;
    await User.findByIdAndUpdate(req.user._id, { salonId: salon._id });
  }

  const populatedSalon = await Salon.findById(salon._id)
    .populate("ownerId", "name email");

  res.status(201).json({
    success: true,
    message: "Salon created successfully",
    data: populatedSalon,
  });
});

export const updateSalon = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };

  // Owners can only update their own salon
  if (req.user && req.user.role === "owner") {
    filter.ownerId = req.user._id;
  }

  const salon = await Salon.findOneAndUpdate(filter, req.body, {
    new: true,
    runValidators: true,
  })
    .populate("ownerId", "name email");

  if (!salon) {
    throw new AppError("Salon not found or you don't have permission to update it", 404);
  }

  res.json({
    success: true,
    message: "Salon updated successfully",
    data: salon,
  });
});

export const deleteSalon = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };

  // Owners can only delete their own salon
  if (req.user && req.user.role === "owner") {
    filter.ownerId = req.user._id;
  }

  const salon = await Salon.findOneAndDelete(filter);

  if (!salon) {
    throw new AppError("Salon not found or you don't have permission to delete it", 404);
  }

  // Update user's salonId if owner
  if (req.user && req.user.role === "owner") {
    const User = (await import("../models/user.js")).default;
    await User.findByIdAndUpdate(req.user._id, { salonId: null });
  }

  res.json({ success: true, message: "Salon deleted successfully" });
});
