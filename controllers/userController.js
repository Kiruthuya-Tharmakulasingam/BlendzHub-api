import User from "../models/user.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  const users = await User.find().skip(skip).limit(limit);
  const totalUser = await User.countDocuments();

  res.status(200).json({
    totalUser,
    page,
    totalPages: Math.ceil(totalUser / limit),
    count: users.length,
    users,
  });
});

// Get user by ID
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.status(200).json(user);
});

// Create user
export const createUser = asyncHandler(async (req, res) => {
  const newUser = new User(req.body);
  const savedUser = await newUser.save();
  res
    .status(201)
    .json({ message: "User created successfully", user: savedUser });
});

// Update user
export const updateUser = asyncHandler(async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updatedUser) return res.status(404).json({ error: "User not found" });
  res
    .status(200)
    .json({ message: "User updated successfully", user: updatedUser });
});

// Delete user
export const deleteUser = asyncHandler(async (req, res) => {
  const deletedUser = await User.findByIdAndDelete(req.params.id);
  if (!deletedUser) return res.status(404).json({ error: "User not found" });
  res
    .status(200)
    .json({ message: "User deleted successfully", user: deletedUser });
});
