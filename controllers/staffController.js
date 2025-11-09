import Staff from "../models/staff.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

export const getAllStaff = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role } = req.query;
  const filter = role ? { role } : {};
  const total = await Staff.countDocuments(filter);
  const staff = await Staff.find(filter)
    .skip((page - 1) * limit)
    .limit(Number(limit));
  res.json({ success: true, total, data: staff });
});

export const getStaffById = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) throw new AppError("Staff not found", 404);
  res.json({ success: true, data: staff });
});

export const createStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.create(req.body);
  res.status(201).json({ success: true, data: staff });
});

export const updateStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!staff) throw new AppError("Staff not found", 404);
  res.json({ success: true, data: staff });
});

export const deleteStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findByIdAndDelete(req.params.id);
  if (!staff) throw new AppError("Staff not found", 404);
  res.json({ success: true, message: "Staff deleted successfully" });
});
