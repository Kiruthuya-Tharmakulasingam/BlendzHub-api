import User from "../models/user.js";
import Customer from "../models/customer.js";
import Owner from "../models/owner.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";
import { generateToken } from "../utils/generateToken.js";
import { blacklistToken } from "../middleware/auth.js";

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const issueToken = (userId) => {
  try {
    return generateToken(userId);
  } catch (error) {
    if (
      error.code === "JWT_SECRET_MISSING" ||
      error.code === "JWT_SECRET_INVALID"
    ) {
      throw new AppError(
        "Server configuration error: JWT secret is missing.",
        500
      );
    }
    throw error;
  }
};

export const registerCustomer = asyncHandler(async (req, res) => {
  const { name, email, password, contact } = req.body;

  if (!name || !email || !password || !contact) {
    throw new AppError("Name, email, contact, and password are required.", 400);
  }

  const normalizedContact = String(contact).trim();
  if (!normalizedContact) {
    throw new AppError("Contact number is required.", 400);
  }

  const normalizedEmail = normalizeEmail(email);

  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists) {
    throw new AppError("Email already in use.", 400);
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role: "customer",
    isActive: true,
  });

  const profile = await Customer.create({
    userId: user._id,
    name,
    email: normalizedEmail,
    contact: normalizedContact,
  });

  const token = issueToken(user._id);

  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // true in production (HTTPS), false in development
    sameSite: isProduction ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/",
  };

  // Log cookie configuration for debugging
  console.log("Setting cookie with options:", cookieOptions);
  console.log("Environment:", process.env.NODE_ENV);

  res
    .status(201)
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      message: "Customer registered successfully.",
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
        },
        profile,
      },
    });
});

export const registerOwner = asyncHandler(async (req, res) => {
  const { name, email, password, phone, businessName } = req.body;

  if (!name || !email || !password) {
    throw new AppError("Name, email, and password are required.", 400);
  }

  const normalizedEmail = normalizeEmail(email);
  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists) {
    throw new AppError("Email already in use.", 400);
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role: "owner",
    isActive: false,
  });

  const ownerProfile = await Owner.create({
    userId: user._id,
    name,
    email: normalizedEmail,
    phone,
    businessName,
    status: "pending",
  });

  res.status(201).json({
    success: true,
    message: "Owner registered. Waiting for admin approval.",
    data: {
      owner: ownerProfile,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Please provide email and password.", 400);
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password"
  );

  if (!user) {
    throw new AppError("Invalid credentials.", 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError("Invalid credentials.", 401);
  }

  if (!user.isActive) {
    throw new AppError("Your account is disabled or pending approval.", 403);
  }

  let ownerProfile = null;
  let customerProfile = null;

  if (user.role === "owner") {
    ownerProfile = await Owner.findOne({ userId: user._id });
    if (!ownerProfile || ownerProfile.status !== "approved") {
      throw new AppError("Your owner account has not been approved yet.", 403);
    }
  }

  if (user.role === "customer") {
    customerProfile = await Customer.findOne({ userId: user._id });
    if (!customerProfile) {
      throw new AppError(
        "Customer profile not found. Please contact support.",
        400
      );
    }
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = issueToken(user._id);

  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // true in production (HTTPS), false in development
    sameSite: isProduction ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/",
  };

  // Log cookie configuration for debugging
  console.log("Setting cookie with options:", cookieOptions);
  console.log("Environment:", process.env.NODE_ENV);

  // Get full user object without password
  const fullUser = await User.findById(user._id).select("-password");

  res.cookie("token", token, cookieOptions).json({
    success: true,
    message: "Login successful.",
    data: {
      user: fullUser,
      owner: ownerProfile || undefined,
      customer: customerProfile || undefined,
    },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const response = {
    user: req.user,
  };

  if (req.user.role === "owner" && req.ownerProfile) {
    response.owner = req.ownerProfile;
  }

  if (req.user.role === "customer" && req.customerProfile) {
    response.customer = req.customerProfile;
  }

  res.json({
    success: true,
    data: response,
  });
});

export const logout = asyncHandler(async (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// Update user profile
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { name, email, contact, phone, image } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Update user fields
  if (name) user.name = name;
  if (email) user.email = normalizeEmail(email);
  if (image) user.image = image;

  await user.save();

  // Update role-specific profile
  if (user.role === "customer") {
    const customer = await Customer.findOne({ userId: user._id });
    if (customer) {
      if (name) customer.name = name;
      if (email) customer.email = normalizeEmail(email);
      if (contact) customer.contact = contact;
      if (phone) customer.phone = phone;
      await customer.save();
    }
  } else if (user.role === "owner") {
    const owner = await Owner.findOne({ userId: user._id });
    if (owner) {
      if (name) owner.name = name;
      if (email) owner.email = normalizeEmail(email);
      if (contact) owner.contact = contact;
      if (phone) owner.phone = phone;
      await owner.save();
    }
  }

  // Return updated user without password
  const updatedUser = await User.findById(userId).select("-password");

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: { user: updatedUser },
  });
});
