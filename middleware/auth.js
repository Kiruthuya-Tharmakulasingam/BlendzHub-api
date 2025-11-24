import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Owner from "../models/owner.js";
import Customer from "../models/customer.js";
import Staff from "../models/staff.js";
import Salon from "../models/salon.js";
import { AppError, asyncHandler } from "./errorhandler.js";

export const tokenBlacklist = new Set();

const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return null;
};

const ensureEnvSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new AppError(
      "Server configuration error: JWT_SECRET is not set.",
      500
    );
  }
};

const attachRoleContext = async (req) => {
  if (!req.user) return;

  if (req.user.role === "owner") {
    const ownerProfile = await Owner.findOne({ userId: req.user._id });
    if (!ownerProfile) {
      throw new AppError(
        "Owner profile not found. Please contact support.",
        403
      );
    }
    if (ownerProfile.status !== "approved") {
      throw new AppError(
        "Your owner account is not approved yet.",
        403
      );
    }
    req.ownerProfile = ownerProfile;

    const salon = await Salon.findOne({ ownerId: req.user._id });
    if (salon) {
      req.salon = salon;
    }
  }

  if (req.user.role === "customer") {
    const customerProfile = await Customer.findOne({
      userId: req.user._id,
    });
    if (!customerProfile) {
      throw new AppError(
        "Customer profile not found. Please contact support.",
        400
      );
    }
    req.customerProfile = customerProfile;
  }

  if (req.user.role === "staff") {
    const staffProfile = await Staff.findOne({ userId: req.user._id });
    if (!staffProfile) {
      throw new AppError(
        "Staff profile not found. Please contact your owner.",
        404
      );
    }
    req.staff = staffProfile;
  }
};

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = getTokenFromHeader(req);

  if (!token) {
    throw new AppError("Authentication required", 401);
  }

  ensureEnvSecret();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (tokenBlacklist.has(token)) {
      throw new AppError("Token has been revoked. Please login again.", 401);
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!user.isActive) {
      throw new AppError(
        "Your account is disabled. Contact support for assistance.",
        403
      );
    }

    req.user = user;

    await attachRoleContext(req);

    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error.name === "TokenExpiredError") {
      throw new AppError("Token expired. Please login again.", 401);
    }

    throw new AppError("Invalid token. Please login again.", 401);
  }
});

export const authOptional = asyncHandler(async (req, res, next) => {
  const token = getTokenFromHeader(req);
  if (!token) {
    return next();
  }

  ensureEnvSecret();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (tokenBlacklist.has(token)) {
      return next();
    }
    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.isActive) {
      return next();
    }
    req.user = user;
    await attachRoleContext(req);
  } catch (error) {
    // Ignore token errors for optional auth
  }

  next();
});

export const requireRole = (roles) => {
  const roleList = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!roleList.includes(req.user.role)) {
      return next(
        new AppError(
          `Role '${req.user.role}' is not authorized for this resource`,
          403
        )
      );
    }

    next();
  };
};

export const blacklistToken = (token) => {
  if (token) {
    tokenBlacklist.add(token);
  }
};
