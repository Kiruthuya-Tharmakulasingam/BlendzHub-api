import User from "../models/user.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    role,
    isApproved,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
    startDate,
    endDate,
  } = req.query;

  const filter = {};

  // Role filtering - supports single value or comma-separated values
  if (role) {
    const roleArray = role.split(",").map((r) => r.trim());
    if (roleArray.length === 1) {
      filter.role = roleArray[0];
    } else {
      filter.role = { $in: roleArray };
    }
  }

  // Approval status filtering
  if (isApproved !== undefined) {
    filter.isApproved = isApproved === "true";
  }

  // Date range filtering
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

  // Text search in name and email
  if (search) {
    const searchRegex = new RegExp(search, "i");
    const searchConditions = [{ name: searchRegex }, { email: searchRegex }];

    if (Object.keys(filter).length > 0) {
      const combinedFilter = {
        $and: [{ ...filter }, { $or: searchConditions }],
      };
      Object.keys(filter).forEach((key) => delete filter[key]);
      Object.assign(filter, combinedFilter);
    } else {
      filter.$or = searchConditions;
    }
  }

  // Validate sortBy field
  const allowedSortFields = [
    "name",
    "email",
    "role",
    "isApproved",
    "createdAt",
    "updatedAt",
  ];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
  const sort = { [sortField]: sortDirection };

  // Get total count with filters
  const total = await User.countDocuments(filter);

  // Calculate pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const totalPages = Math.ceil(total / limitNum);

  // Fetch users with filters, sorting, and pagination
  const users = await User.find(filter)
    .select("-password")
    .populate("approvedBy", "name email")
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    data: users,
  });
});

// @desc    Get pending users (awaiting approval) (admin only)
// @route   GET /api/admin/users/pending
// @access  Private/Admin
export const getPendingUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const filter = { isApproved: false };
  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select("-password")
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    total,
    message: `${total} user(s) pending approval`,
    data: users,
  });
});

// @desc    Get single user by ID (admin only)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("approvedBy", "name email");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({
    success: true,
    data: user,
  });
});

// @desc    Approve user login access (admin only)
// @route   PUT /api/admin/users/:id/approve
// @access  Private/Admin
export const approveUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isApproved) {
    throw new AppError("User is already approved", 400);
  }

  user.isApproved = true;
  user.approvedBy = req.user.id;
  user.approvedAt = new Date();
  await user.save();

  res.json({
    success: true,
    message: "User approved successfully",
    // data: {
    //   id: user._id,
    //   name: user.name,
    //   email: user.email,
    //   role: user.role,
    //   isApproved: user.isApproved,
    //   approvedBy: user.approvedBy,
    //   approvedAt: user.approvedAt,
    // },
  });
});

// @desc    Revoke user login access (admin only)
// @route   PUT /api/admin/users/:id/revoke
// @access  Private/Admin
export const revokeUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.isApproved) {
    throw new AppError("User is already not approved", 400);
  }

  // Prevent admin from revoking their own access
  if (user._id.toString() === req.user.id) {
    throw new AppError("You cannot revoke your own access", 400);
  }

  user.isApproved = false;
  user.approvedBy = null;
  user.approvedAt = null;
  await user.save();

  res.json({
    success: true,
    message: "User access revoked successfully",
    // data: {
    //   id: user._id,
    //   name: user.name,
    //   email: user.email,
    //   role: user.role,
    //   isApproved: user.isApproved,
    // },
  });
});

// @desc    Update user role (admin only)
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!["owner", "admin", "staff", "user", "customer"].includes(role)) {
    throw new AppError(
      "Invalid role. Must be owner, admin, staff, user, or customer",
      400
    );
  }

  // Prevent admin/owner from changing their own role
  if (user._id.toString() === req.user.id) {
    if (req.user.role === "admin" && role !== "admin") {
      throw new AppError("You cannot change your own role from admin", 400);
    }
    if (req.user.role === "owner" && role !== "owner") {
      throw new AppError("You cannot change your own role from owner", 400);
    }
  }

  user.role = role;
  await user.save();

  res.json({
    success: true,
    message: "User role updated successfully",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// @desc    Update user (admin only) - can update any user field
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Prevent updating password through this endpoint (use separate password update)
  const { password, ...updateData } = req.body;

  // If isApproved is being set to true, also set approvedBy and approvedAt
  if (updateData.isApproved === true && !user.isApproved) {
    updateData.approvedBy = req.user.id;
    updateData.approvedAt = new Date();
  }

  // If isApproved is being set to false, clear approval info
  if (updateData.isApproved === false && user.isApproved) {
    // Prevent admin from revoking their own access
    if (user._id.toString() === req.user.id) {
      throw new AppError("You cannot revoke your own access", 400);
    }
    updateData.approvedBy = null;
    updateData.approvedAt = null;
  }

  // Validate role if being updated
  if (
    updateData.role &&
    !["owner", "admin", "staff", "user", "customer"].includes(updateData.role)
  ) {
    throw new AppError(
      "Invalid role. Must be owner, admin, staff, user, or customer",
      400
    );
  }

  // Prevent admin/owner from changing their own role
  if (updateData.role && user._id.toString() === req.user.id) {
    if (req.user.role === "admin" && updateData.role !== "admin") {
      throw new AppError("You cannot change your own role from admin", 400);
    }
    if (req.user.role === "owner" && updateData.role !== "owner") {
      throw new AppError("You cannot change your own role from owner", 400);
    }
  }

  // Update user
  Object.assign(user, updateData);
  await user.save();

  const updatedUser = await User.findById(user._id)
    .select("-password")
    .populate("approvedBy", "name email");

  res.json({
    success: true,
    message: "User updated successfully",
    data: updatedUser,
  });
});

// @desc    Delete user (admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Prevent admin from deleting themselves
  if (user._id.toString() === req.user.id) {
    throw new AppError("You cannot delete your own account", 400);
  }

  await user.deleteOne();

  res.json({
    success: true,
    message: "User deleted successfully",
  });
});
