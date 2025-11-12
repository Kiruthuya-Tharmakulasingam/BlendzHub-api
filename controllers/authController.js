import User from "../models/user.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";
import { generateToken } from "../utils/generateToken.js";
import { blacklistToken } from "../middleware/auth.js";

// @desc    Register a new user (requires admin approval to login)
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, salonId } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new AppError("User already exists", 400);
  }

  const userRole = role || "user";

  // For staff registration, salonId is required
  if (userRole === "staff") {
    if (!salonId) {
      throw new AppError("Staff registration requires salonId", 400);
    }

    // Verify salon exists
    const Salon = (await import("../models/salon.js")).default;
    const salon = await Salon.findById(salonId);
    if (!salon) {
      throw new AppError("Salon not found", 404);
    }

    // Create user (approved by admin, but not by owner yet)
    const user = await User.create({
      name,
      email,
      password,
      role: "staff",
      isApproved: true, // Admin approval not needed for staff (owner approves)
      staffSalonId: salonId,
    });

    // Create staff record (not approved by owner yet)
    const Staff = (await import("../models/staff.js")).default;
    const staff = await Staff.create({
      userId: user._id,
      salonId,
      name,
      role: "stylist", // Default role, can be updated by owner
      isApprovedByOwner: false,
    });

    res.status(201).json({
      success: true,
      message: "Staff registration successful. Please wait for salon owner approval to login.",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        salonId: salonId,
        isApproved: false, // Not approved by owner yet
      },
    });
  } else {
    // For customers and owners, create user (not approved by admin)
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      isApproved: false,
    });

    // If owner, link to salon if provided
    if (userRole === "owner" && salonId) {
      const Salon = (await import("../models/salon.js")).default;
      const salon = await Salon.findById(salonId);
      if (salon && salon.ownerId.toString() === user._id.toString()) {
        await User.findByIdAndUpdate(user._id, { salonId });
      }
    }

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
  }
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

  // Check if user is approved by admin (for customers and owners)
  if (!user.isApproved) {
    throw new AppError(
      "Your account is pending admin approval. Please wait for approval to login.",
      403
    );
  }

  // For staff: also check if approved by owner
  if (user.role === "staff") {
    const Staff = (await import("../models/staff.js")).default;
    const staff = await Staff.findOne({ userId: user._id });
    if (!staff || !staff.isApprovedByOwner) {
      throw new AppError(
        "Your staff account is pending owner approval. Please wait for the salon owner to approve your registration.",
        403
      );
    }
  }

  // Generate token
  let token;
  try {
    token = generateToken(user._id);
  } catch (error) {
    if (error.code === "JWT_SECRET_MISSING" || error.code === "JWT_SECRET_INVALID") {
      throw new AppError(
        "Server configuration error: JWT_SECRET is not set in Vercel. Please add it in Vercel Dashboard → Settings → Environment Variables and redeploy.",
        500
      );
    }
    throw error;
  }

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

// @desc    Logout user (blacklist current token for this server run)
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const parts = authHeader.split(" ");
  const token = parts.length === 2 && parts[0] === "Bearer" ? parts[1] : null;

  if (!token) {
    throw new AppError("No token provided for logout", 400);
  }

  blacklistToken(token);
  res.status(200).json({ success: true, message: "Logged out. Token access denied." });
});
 
