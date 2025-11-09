import User from "../models/user.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";
import { generateToken } from "../utils/generateToken.js";

// @desc    Register a new user (requires admin approval to login)
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new AppError("User already exists", 400);
  }

  // Create user (not approved by default)
  const user = await User.create({
    name,
    email,
    password,
    role: role || "user",
    isApproved: false,
  });

  res.status(201).json({
    success: true,
    message: "Registration successful. Please wait for admin approval to login.",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
    },
  });
});

// @desc    Login user (only if approved by admin)
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    throw new AppError("Please provide email and password", 400);
  }

  // Check for user and include password field
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  // Check if user is approved by admin
  if (!user.isApproved) {
    throw new AppError(
      "Your account is pending admin approval. Please wait for approval to login.",
      403
    );
  }

  // Generate token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
    },
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

