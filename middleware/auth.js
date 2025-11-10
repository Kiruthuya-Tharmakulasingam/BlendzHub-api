import jwt from "jsonwebtoken";
import User from "../models/user.js";
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
      return next(new AppError("Token access denied. Please login again.", 401));
    }

    // Get user from token
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return next(
        new AppError("User not found. The token is valid but the user no longer exists.", 404)
      );
    }

    // Check if user is approved
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
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token. Please login again.", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Token has expired. Please login again.", 401));
    }
    return next(
      new AppError(
        `Not authorized to access this route. ${error.message || "Authentication failed."}`,
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
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return authorize(...rolesArray);
};

// Utility to blacklist a token (for logout)
export const blacklistToken = (token) => {
  if (token) tokenBlacklist.add(token);
};

