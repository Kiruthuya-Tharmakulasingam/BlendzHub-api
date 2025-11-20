import mongoose from "mongoose";
import User from "../models/user.js";
import Owner from "../models/owner.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";
import { generateToken } from "../utils/generateToken.js";
import { blacklistToken } from "../middleware/auth.js";

// @desc    Register a new user (requires admin approval to login)
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  // Check if database is connected
  if (mongoose.connection.readyState !== 1) {
    throw new AppError("Database connection not ready. Please try again.", 503);
  }

  const { name, email, password, role, salonId } = req.body;

  // Validate required fields
  if (!name || !email) {
    throw new AppError("Name and email are required", 400);
  }

  // Normalize role to lowercase for comparison
  const userRole = role ? role.toLowerCase().trim() : "user";

  // Staff cannot register - they must be added by salon owners
  if (userRole === "staff") {
    throw new AppError(
      "Staff registration is not allowed. Please contact your salon owner to be added as staff.",
      400
    );
  }

  // Handle owner registration differently - no password, create Owner record only
  // Check explicitly for owner role
  if (userRole === "owner") {
    // Validate that password is NOT provided for owner registration
    if (password) {
      throw new AppError(
        "Password should not be provided for owner registration. Admin will set credentials upon approval.",
        400
      );
    }
    // Check if owner already exists
    const ownerExists = await Owner.findOne({ email }).maxTimeMS(5000);
    if (ownerExists) {
      throw new AppError("Owner with this email already exists", 400);
    }

    // Check if user with this email exists
    const userExists = await User.findOne({ email }).maxTimeMS(5000);
    if (userExists) {
      throw new AppError("User already exists", 400);
    }

    // Create owner record with status "pending" (no password, no user record)
    const owner = await Owner.create({
      name,
      email,
      status: "pending",
      ...(req.body.phone && { phone: req.body.phone }),
      ...(req.body.businessName && { businessName: req.body.businessName }),
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful. Waiting for admin approval.",
      data: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        status: owner.status,
        createdAt: owner.createdAt,
      },
    });
  }

  // For customers and other roles: use existing flow with password
  // Validate password is provided for non-owner roles
  if (!password) {
    throw new AppError(
      "Password is required for registration. Note: If you're registering as an owner, make sure to include 'role: \"owner\"' in your request body and omit the password field.",
      400
    );
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new AppError("User already exists", 400);
  }

  // For customers: auto-approve
  const isCustomer = userRole === "customer";
  const user = await User.create({
    name,
    email,
    password,
    role: userRole,
    isApproved: isCustomer, // Customers are auto-approved
  });

  const message = isCustomer
    ? "Registration successful. You can now login."
    : "Registration successful. Please wait for admin approval to login.";

  res.status(201).json({
    success: true,
    message,
  });
});

// @desc    Login user (customers can login immediately, others need admin approval)
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

  // Special handling for owners: check Owner record status and userId
  let owner = null;
  let salon = null;
  if (user.role === "owner") {
    owner = await Owner.findOne({ userId: user._id });
    if (!owner) {
      throw new AppError(
        "Owner profile not found. Please contact admin.",
        404
      );
    }
    // Owners can only login if status is "approved" and userId exists
    if (owner.status !== "approved" || !owner.userId) {
      throw new AppError(
        "Your account is pending admin approval. Please wait for approval to login.",
        403
      );
    }
    // Get salon information if exists
    const Salon = (await import("../models/salon.js")).default;
    salon = await Salon.findOne({ ownerId: user._id });
  }
  // Check if user is approved by admin (skip check for customers and staff - they can log in immediately)
  // Also auto-approve existing customers/staff who might have been created before this change
  else if (user.role === "customer") {
    // Auto-approve customers if not already approved
    if (!user.isApproved) {
      user.isApproved = true;
      await user.save();
    }
  } else if (user.role === "staff") {
    // Staff can login without owner approval (they are added by owners)
    // Auto-approve staff if not already approved
    if (!user.isApproved) {
      user.isApproved = true;
      await user.save();
    }
    // Verify staff record exists
    const Staff = (await import("../models/staff.js")).default;
    const staff = await Staff.findOne({ userId: user._id });
    if (!staff) {
      throw new AppError(
        "Staff profile not found. Please contact your salon owner.",
        404
      );
    }
  } else if (!user.isApproved) {
    // For other roles, require admin approval
    throw new AppError(
      "Your account is pending admin approval. Please wait for approval to login.",
      403
    );
  }

  // Generate token
  let token;
  try {
    token = generateToken(user._id);
  } catch (error) {
    if (
      error.code === "JWT_SECRET_MISSING" ||
      error.code === "JWT_SECRET_INVALID"
    ) {
      throw new AppError(
        "Server configuration error: JWT_SECRET is not set in Vercel. Please add it in Vercel Dashboard → Settings → Environment Variables and redeploy.",
        500
      );
    }
    throw error;
  }

  // Prepare response data
  const responseData = {
    success: true,
    message: "Login successful",
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        createdAt: user.createdAt,
      },
    },
  };

  // Add owner-specific details if user is an owner
  if (user.role === "owner" && owner) {
    responseData.data.owner = {
      id: owner._id,
      name: owner.name,
      email: owner.email,
      status: owner.status,
      phone: owner.phone,
      businessName: owner.businessName,
      createdAt: owner.createdAt,
      updatedAt: owner.updatedAt,
    };

    // Add salon information if exists
    if (salon) {
      responseData.data.salon = {
        id: salon._id,
        name: salon.name,
        location: salon.location,
        type: salon.type,
        phone: salon.phone,
        email: salon.email,
        openingHours: salon.openingHours,
        createdAt: salon.createdAt,
        updatedAt: salon.updatedAt,
      };
    }
  }

  // Add staff details if user is staff
  if (user.role === "staff") {
    const Staff = (await import("../models/staff.js")).default;
    const staff = await Staff.findOne({ userId: user._id })
      .populate("salonId", "name location")
      .populate("specializations", "name price");
    if (staff) {
      responseData.data.staff = {
        id: staff._id,
        name: staff.name,
        role: staff.role,
        skillLevel: staff.skillLevel,
        specializations: staff.specializations,
        salon: staff.salonId,
        createdAt: staff.createdAt,
      };
    }
  }

  res.status(200).json(responseData);
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
  res
    .status(200)
    .json({ success: true, message: "Logged out. Token access denied." });
});
