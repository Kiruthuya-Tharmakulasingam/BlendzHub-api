import Salon from "../models/salon.js";
import Staff from "../models/staff.js";
import User from "../models/user.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

// ==================== SALON MANAGEMENT ====================

// @desc    Get owner's salon
// @route   GET /api/owner/salon
// @access  Private/Owner
export const getMySalon = asyncHandler(async (req, res) => {
  const salon = await Salon.findOne({ ownerId: req.user._id }).populate(
    "ownerId",
    "name email"
  );

  if (!salon) {
    throw new AppError("You don't have a salon. Please create one first.", 404);
  }

  res.json({
    success: true,
    data: salon,
  });
});

// @desc    Create salon (for owner)
// @route   POST /api/owner/salon
// @access  Private/Owner
export const createSalon = asyncHandler(async (req, res) => {
  // Check if owner already has a salon
  const existingSalon = await Salon.findOne({ ownerId: req.user._id });
  if (existingSalon) {
    throw new AppError(
      "You already have a salon. Use update endpoint to modify it.",
      400
    );
  }

  const salon = await Salon.create({
    ...req.body,
    ownerId: req.user._id,
  });

  // Update user's salonId
  await User.findByIdAndUpdate(req.user._id, { salonId: salon._id });

  res.status(201).json({
    success: true,
    message: "Salon created successfully",
    data: salon,
  });
});

// @desc    Update owner's salon
// @route   PUT /api/owner/salon
// @access  Private/Owner
export const updateMySalon = asyncHandler(async (req, res) => {
  const salon = await Salon.findOneAndUpdate(
    { ownerId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!salon) {
    throw new AppError("Salon not found", 404);
  }

  res.json({
    success: true,
    message: "Salon updated successfully",
    data: salon,
  });
});

// @desc    Delete owner's salon
// @route   DELETE /api/owner/salon
// @access  Private/Owner
export const deleteMySalon = asyncHandler(async (req, res) => {
  const salon = await Salon.findOne({ ownerId: req.user._id });

  if (!salon) {
    throw new AppError("Salon not found", 404);
  }

  await Salon.findByIdAndDelete(salon._id);

  // Update user's salonId
  await User.findByIdAndUpdate(req.user._id, { salonId: null });

  res.json({
    success: true,
    message: "Salon deleted successfully",
  });
});

// ==================== STAFF MANAGEMENT ====================

// @desc    Get all staff in owner's salon
// @route   GET /api/owner/staff
// @access  Private/Owner
export const getMyStaff = asyncHandler(async (req, res) => {
  const salon = await Salon.findOne({ ownerId: req.user._id });
  if (!salon) {
    throw new AppError("You don't have a salon", 404);
  }

  const { page = 1, limit = 10, isApproved } = req.query;
  const filter = { salonId: salon._id };
  if (isApproved !== undefined) {
    filter.isApprovedByOwner = isApproved === "true";
  }

  const total = await Staff.countDocuments(filter);
  const staff = await Staff.find(filter)
    .populate("userId", "name email")
    .populate("specializations", "name price")
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    total,
    data: staff,
  });
});

// @desc    Add new staff member (owner creates staff account)
// @route   POST /api/owner/staff
// @access  Private/Owner
export const addStaff = asyncHandler(async (req, res) => {
  const salon = await Salon.findOne({ ownerId: req.user._id });
  if (!salon) {
    throw new AppError("You don't have a salon", 404);
  }

  const { name, email, password, role, skillLevel, specializations } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("User with this email already exists", 400);
  }

  // Create user account for staff
  const user = await User.create({
    name,
    email,
    password,
    role: "staff",
    isApproved: true, // Auto-approved by admin (owner is creating them)
    approvedBy: req.user._id,
    approvedAt: new Date(),
    staffSalonId: salon._id,
  });

  // Create staff profile
  const staff = await Staff.create({
    userId: user._id,
    salonId: salon._id,
    name,
    role: role || "stylist",
    skillLevel,
    specializations: specializations || [],
    isApprovedByOwner: true, // Auto-approved since owner created them
    approvedByOwner: req.user._id,
    approvedAt: new Date(),
  });

  res.status(201).json({
    success: true,
    message: "Staff member added successfully",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      staff,
    },
  });
});

// @desc    Update staff member
// @route   PUT /api/owner/staff/:id
// @access  Private/Owner
export const updateStaff = asyncHandler(async (req, res) => {
  const salon = await Salon.findOne({ ownerId: req.user._id });
  if (!salon) {
    throw new AppError("You don't have a salon", 404);
  }

  const staff = await Staff.findOneAndUpdate(
    {
      _id: req.params.id,
      salonId: salon._id,
    },
    req.body,
    { new: true, runValidators: true }
  )
    .populate("userId", "name email")
    .populate("specializations", "name price");

  if (!staff) {
    throw new AppError("Staff member not found in your salon", 404);
  }

  res.json({
    success: true,
    message: "Staff member updated successfully",
    data: staff,
  });
});

// @desc    Delete staff member
// @route   DELETE /api/owner/staff/:id
// @access  Private/Owner
export const deleteStaff = asyncHandler(async (req, res) => {
  const salon = await Salon.findOne({ ownerId: req.user._id });
  if (!salon) {
    throw new AppError("You don't have a salon", 404);
  }

  const staff = await Staff.findOne({
    _id: req.params.id,
    salonId: salon._id,
  });

  if (!staff) {
    throw new AppError("Staff member not found in your salon", 404);
  }

  // Delete staff and user account
  await Staff.findByIdAndDelete(staff._id);
  await User.findByIdAndDelete(staff.userId);

  res.json({
    success: true,
    message: "Staff member deleted successfully",
  });
});
