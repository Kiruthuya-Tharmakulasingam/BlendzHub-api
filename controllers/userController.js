import User from "../models/user.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

export const getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    role,
    isActive,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
    startDate,
    endDate,
  } = req.query;

  const filter = {};

  if (role) {
    const roles = role.split(",").map((r) => r.trim());
    filter.role = roles.length === 1 ? roles[0] : { $in: roles };
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const allowedSort = ["name", "email", "role", "isActive", "createdAt"];
  const sortField = allowedSort.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;

  const total = await User.countDocuments(filter);
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));

  const users = await User.find(filter)
    .select("-password")
    .sort({ [sortField]: sortDirection })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
    data: users,
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({
    success: true,
    data: user,
  });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const allowedRoles = ["customer", "owner", "admin", "staff"];

  if (!allowedRoles.includes(role)) {
    throw new AppError("Invalid role provided.", 400);
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user._id.equals(req.user._id) && user.role !== role) {
    throw new AppError("You cannot change your own role.", 400);
  }

  user.role = role;
  await user.save();

  res.json({
    success: true,
    message: "Role updated successfully.",
    data: { id: user._id, email: user.email, role: user.role },
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { password, ...updates } = req.body;

  if (password) {
    throw new AppError("Use the password reset flow to change passwords.", 400);
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (updates.role) {
    const allowedRoles = ["customer", "owner", "admin", "staff"];
    if (!allowedRoles.includes(updates.role)) {
      throw new AppError("Invalid role provided.", 400);
    }
    if (user._id.equals(req.user._id) && user.role !== updates.role) {
      throw new AppError("You cannot change your own role.", 400);
    }
  }

  if (typeof updates.isActive === "boolean" && user._id.equals(req.user._id)) {
    throw new AppError("You cannot change your own active status.", 400);
  }

  Object.assign(user, updates);
  await user.save();

  res.json({
    success: true,
    message: "User updated successfully.",
    data: await User.findById(user._id).select("-password"),
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user._id.equals(req.user._id)) {
    throw new AppError("You cannot delete your own account.", 400);
  }

  await user.deleteOne();

  res.json({
    success: true,
    message: "User deleted successfully.",
  });
});
