import Salon from "../models/salon.js";
import User from "../models/user.js";
import Owner from "../models/owner.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

// ==================== OWNER APPROVAL (ADMIN) ====================

export const approveOwner = asyncHandler(async (req, res) => {
  const owner = await Owner.findById(req.params.id);

  if (!owner) {
    throw new AppError("Owner not found", 404);
  }

  if (owner.status === "approved") {
    throw new AppError("Owner is already approved.", 400);
  }

  const user = await User.findById(owner.userId);
  if (!user) {
    throw new AppError("Associated user record missing", 404);
  }

  owner.status = "approved";
  owner.reason = undefined;
  owner.verifiedAt = new Date();
  await owner.save();

  user.isActive = true;
  await user.save();

  res.json({
    success: true,
    message: "Owner approved successfully.",
    data: owner,
  });
});

export const rejectOwner = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const owner = await Owner.findById(req.params.id);

  if (!owner) {
    throw new AppError("Owner not found", 404);
  }

  const user = await User.findById(owner.userId);

  owner.status = "rejected";
  owner.reason = reason || "Rejected by admin";
  owner.verifiedAt = null;
  await owner.save();

  if (user) {
    user.isActive = false;
    await user.save();
  }

  res.json({
    success: true,
    message: "Owner rejected.",
    data: owner,
  });
});

export const listOwners = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const filter = {};
  if (status) {
    const statuses = status.split(",").map((s) => s.trim());
    filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
  }
  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ name: regex }, { email: regex }, { businessName: regex }];
  }

  const allowedSortFields = ["name", "email", "status", "createdAt"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
  const sort = { [sortField]: sortDirection };

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));

  const total = await Owner.countDocuments(filter);
  const owners = await Owner.find(filter)
    .populate("userId", "name email")
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .sort(sort);

  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    data: owners,
  });
});

export const listPendingOwners = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));

  const filter = { status: "pending" };
  const total = await Owner.countDocuments(filter);
  const owners = await Owner.find(filter)
    .populate("userId", "name email")
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    data: owners,
  });
});

// ==================== SALON MANAGEMENT ====================

// @desc    Get owner's salon
// @route   GET /api/owners/salon
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
// @route   POST /api/owners/salon
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

  res.status(201).json({
    success: true,
    message: "Salon created successfully",
    data: salon,
  });
});

// @desc    Update owner's salon
// @route   PUT /api/owners/salon
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
// @route   DELETE /api/owners/salon
// @access  Private/Owner
export const deleteMySalon = asyncHandler(async (req, res) => {
  const salon = await Salon.findOne({ ownerId: req.user._id });

  if (!salon) {
    throw new AppError("Salon not found", 404);
  }

  await Salon.findByIdAndDelete(salon._id);

  res.json({
    success: true,
    message: "Salon deleted successfully",
  });
});
