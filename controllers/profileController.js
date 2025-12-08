import User from "../models/user.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

// @desc    Get current user profile
// @route   GET /api/profile
// @access  Private (all authenticated users)
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  
  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update current user profile
// @route   PUT /api/profile
// @access  Private (all authenticated users)
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, image } = req.body;
  
  // Don't allow password update through this route
  // Also exclude phone as it's not in User model (it's in Customer/Owner models)
  const { password, phone, ...updateData } = req.body;
  
  // Only allow updating fields that exist in User model
  const allowedFields = {};
  if (name !== undefined) allowedFields.name = name;
  if (email !== undefined) allowedFields.email = email;
  if (image !== undefined) allowedFields.image = image;
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    allowedFields,
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});

