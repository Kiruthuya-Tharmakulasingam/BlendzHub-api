import Salon from "../models/salon.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

export const getAllSalons = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type } = req.query;
  const filter = type ? { type } : {};
  const total = await Salon.countDocuments(filter);
  const salons = await Salon.find(filter)
    .skip((page - 1) * limit)
    .limit(Number(limit));
  res.json({ success: true, total, data: salons });
});

export const getSalonById = asyncHandler(async (req, res) => {
  const salon = await Salon.findById(req.params.id);
  if (!salon) throw new AppError("Salon not found", 404);
  res.json({ success: true, data: salon });
});

export const createSalon = asyncHandler(async (req, res) => {
  const salon = await Salon.create(req.body);
  res.status(201).json({ success: true, data: salon });
});

export const updateSalon = asyncHandler(async (req, res) => {
  const salon = await Salon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!salon) throw new AppError("Salon not found", 404);
  res.json({ success: true, data: salon });
});

export const deleteSalon = asyncHandler(async (req, res) => {
  const salon = await Salon.findByIdAndDelete(req.params.id);
  if (!salon) throw new AppError("Salon not found", 404);
  res.json({ success: true, message: "Salon deleted successfully" });
});
