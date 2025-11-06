import Staff from "../models/staff.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const getAllStaff = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  const staffs = await Staff.find().skip(skip).limit(limit);
  const totalStaff = await Staff.countDocuments();

  res.status(200).json({
    totalStaff,
    page,
    totalPages: Math.ceil(totalStaff / limit),
    count: staffs.length,
    staffs,
  });
});

export const getStaffById = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) return res.status(404).json({ error: "Staff not found" });
  res.status(200).json(staff);
});

export const createStaff = asyncHandler(async (req, res) => {
  const newStaff = new Staff(req.body);
  const saved = await newStaff.save();
  res.status(201).json({ message: "Staff created", staff: saved });
});

export const updateStaff = asyncHandler(async (req, res) => {
  const updated = await Staff.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updated) return res.status(404).json({ error: "Staff not found" });
  res.status(200).json({ message: "Staff updated", staff: updated });
});

export const deleteStaff = asyncHandler(async (req, res) => {
  const deleted = await Staff.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Staff not found" });
  res.status(200).json({ message: "Staff deleted", staff: deleted });
});
