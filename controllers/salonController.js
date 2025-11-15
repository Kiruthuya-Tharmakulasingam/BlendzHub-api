import Salon from "../models/salon.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

export const getAllSalons = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    type,
    ownerId,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
    startDate,
    endDate,
  } = req.query;

  const filter = {};

  // Type filtering - supports single value or comma-separated values
  if (type) {
    const typeArray = type.split(",").map((t) => t.trim());
    if (typeArray.length === 1) {
      filter.type = typeArray[0];
    } else {
      filter.type = { $in: typeArray };
    }
  }

  // ID-based filtering
  if (ownerId) filter.ownerId = ownerId;

  // Date range filtering
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  // Text search in name, location, phone, email
  if (search) {
    const searchRegex = new RegExp(search, "i");
    const searchConditions = [
      { name: searchRegex },
      { location: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
    ];

    if (Object.keys(filter).length > 0) {
      const combinedFilter = {
        $and: [
          { ...filter },
          { $or: searchConditions },
        ],
      };
      Object.keys(filter).forEach((key) => delete filter[key]);
      Object.assign(filter, combinedFilter);
    } else {
      filter.$or = searchConditions;
    }
  }

  // Validate sortBy field
  const allowedSortFields = ["name", "location", "type", "createdAt", "updatedAt"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
  const sort = { [sortField]: sortDirection };

  // Get total count with filters
  const total = await Salon.countDocuments(filter);

  // Calculate pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const totalPages = Math.ceil(total / limitNum);

  // Fetch salons with filters, sorting, and pagination
  const salons = await Salon.find(filter)
    .populate("ownerId", "name email")
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    data: salons,
  });
});

export const getSalonById = asyncHandler(async (req, res) => {
  const salon = await Salon.findById(req.params.id)
    .populate("ownerId", "name email");
  if (!salon) throw new AppError("Salon not found", 404);
  res.json({ success: true, data: salon });
});

export const createSalon = asyncHandler(async (req, res) => {
  // If owner is creating, set ownerId automatically
  let ownerId = req.body.ownerId;
  if (req.user && req.user.role === "owner") {
    ownerId = req.user._id;
  }

  if (!ownerId) {
    throw new AppError("ownerId is required", 400);
  }

  const salon = await Salon.create({
    ...req.body,
    ownerId,
  });

  // Update user's salonId if owner
  if (req.user && req.user.role === "owner") {
    const User = (await import("../models/user.js")).default;
    await User.findByIdAndUpdate(req.user._id, { salonId: salon._id });
  }

  const populatedSalon = await Salon.findById(salon._id)
    .populate("ownerId", "name email");

  res.status(201).json({
    success: true,
    message: "Salon created successfully",
    data: populatedSalon,
  });
});

export const updateSalon = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };

  // Owners can only update their own salon
  if (req.user && req.user.role === "owner") {
    filter.ownerId = req.user._id;
  }

  const salon = await Salon.findOneAndUpdate(filter, req.body, {
    new: true,
    runValidators: true,
  })
    .populate("ownerId", "name email");

  if (!salon) {
    throw new AppError("Salon not found or you don't have permission to update it", 404);
  }

  res.json({
    success: true,
    message: "Salon updated successfully",
    data: salon,
  });
});

export const deleteSalon = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };

  // Owners can only delete their own salon
  if (req.user && req.user.role === "owner") {
    filter.ownerId = req.user._id;
  }

  const salon = await Salon.findOneAndDelete(filter);

  if (!salon) {
    throw new AppError("Salon not found or you don't have permission to delete it", 404);
  }

  // Update user's salonId if owner
  if (req.user && req.user.role === "owner") {
    const User = (await import("../models/user.js")).default;
    await User.findByIdAndUpdate(req.user._id, { salonId: null });
  }

  res.json({ success: true, message: "Salon deleted successfully" });
});
