import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { AppError, asyncHandler } from "./errorhandler.js";

// Protect routes - verify JWT token
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Make sure token exists
  if (!token) {
    return next(new AppError("Not authorized to access this route", 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return next(new AppError("User not found", 404));
    }

    // Check if user is approved (unless they're already an admin accessing admin routes)
    if (!req.user.isApproved) {
      return next(
        new AppError(
          "Your account is pending admin approval. Please wait for approval to access this route.",
          403
        )
      );
    }

    next();
  } catch (error) {
    return next(new AppError("Not authorized to access this route", 401));
  }
});

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

