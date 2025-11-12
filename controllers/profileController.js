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
  const { name, email } = req.body;
  
  // Don't allow password update through this route
  const { password, ...updateData } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  ).select("-password");

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});

