import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Staff from "../models/staff.js";
import Owner from "../models/owner.js";
import Salon from "../models/salon.js";
import { AppError, asyncHandler } from "./errorhandler.js";

// Simple in-memory blacklist for revoked tokens
// For production, prefer a shared store like Redis with token IDs (jti)
export const tokenBlacklist = new Set();

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
    return next(
      new AppError(
        "Not authorized to access this route. Please provide a valid token in the Authorization header (Bearer token).",
        401
      )
    );
  }

  // Check if JWT_SECRET is set
  if (!process.env.JWT_SECRET) {
    return next(
      new AppError(
        "Server configuration error: JWT_SECRET is not set. Please check your environment variables.",
        500
      )
    );
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Deny access if token is blacklisted (logged out)
    if (tokenBlacklist.has(token)) {
      return next(
        new AppError("Token access denied. Please login again.", 401)
      );
    }

    // Get user from token
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return next(
        new AppError(
          "User not found. The token is valid but the user no longer exists.",
          404
        )
      );
    }

    // Check if user is approved by admin (skip check for customers and staff - they can access immediately)
    if (req.user.role === "customer" || req.user.role === "staff") {
      // Auto-approve customers and staff if not already approved
      if (!req.user.isApproved) {
        req.user.isApproved = true;
        await req.user.save();
      }
    } else if (req.user.role === "owner") {
      // For owners: check Owner record status and userId
      const owner = await Owner.findOne({ userId: req.user._id });
      if (!owner) {
        return next(
          new AppError(
            "Owner profile not found. Please contact admin.",
            404
          )
        );
      }
      // Owners can only access if status is "approved" and userId exists
      if (owner.status !== "approved" || !owner.userId) {
        return next(
          new AppError(
            "Your account is pending admin approval. Please wait for approval to access this route.",
            403
          )
        );
      }
      // Attach salon info if exists
      const salon = await Salon.findOne({ ownerId: req.user._id });
      if (salon) {
        req.salon = salon;
      }
    } else if (!req.user.isApproved) {
      // For other roles, require admin approval
      return next(
        new AppError(
          "Your account is pending admin approval. Please wait for approval to access this route.",
          403
        )
      );
    }

    // For staff: attach staff info to request (no approval check needed)
    if (req.user.role === "staff") {
      const staff = await Staff.findOne({ userId: req.user._id });
      if (!staff) {
        return next(
          new AppError(
            "Staff profile not found. Please contact your salon owner.",
            404
          )
        );
      }
      // Attach staff info to request
      req.staff = staff;
    }

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token. Please login again.", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Token has expired. Please login again.", 401));
    }
    return next(
      new AppError(
        `Not authorized to access this route. ${
          error.message || "Authentication failed."
        }`,
        401
      )
    );
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

// Aliases matching requested naming
export const verifyToken = protect;
export const verifyRole = (allowedRoles) => {
  const rolesArray = Array.isArray(allowedRoles)
    ? allowedRoles
    : [allowedRoles];
  return authorize(...rolesArray);
};

// Utility to blacklist a token (for logout)
export const blacklistToken = (token) => {
  if (token) tokenBlacklist.add(token);
};

// Owner authorization - can only manage their own salon
// allowCreate: if true, allows access even if salon doesn't exist (for creation routes)
export const verifyOwner = (allowCreate = false) => {
  return asyncHandler(async (req, res, next) => {
    if (req.user.role !== "owner") {
      return next(new AppError("Only salon owners can access this route", 403));
    }

    const salon = await Salon.findOne({ ownerId: req.user._id });
    
    // If allowCreate is true and no salon exists, allow access (for creation)
    if (!salon && !allowCreate) {
      return next(
        new AppError("You don't have a salon associated with your account", 404)
      );
    }

    // Attach salon if it exists
    if (salon) {
      req.salon = salon;
    }
    
    next();
  });
};

// Staff authorization - can only manage their own data
export const verifyStaff = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "staff") {
    return next(new AppError("Only staff members can access this route", 403));
  }

  const staff = await Staff.findOne({ userId: req.user._id });
  if (!staff) {
    return next(new AppError("Staff profile not found", 404));
  }

  // No approval check needed - staff added by owners can access immediately
  req.staff = staff;
  next();
});

// Customer authorization - can only manage their own data
export const verifyCustomer = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "customer") {
    return next(new AppError("Only customers can access this route", 403));
  }
  next();
});
