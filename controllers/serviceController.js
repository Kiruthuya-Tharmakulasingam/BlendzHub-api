import Service from "../models/service.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

export const getAllServices = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    minPrice,
    maxPrice,
    price,
    minDiscount,
    maxDiscount,
    discount,
    sortBy = "createdAt",
    sortOrder = "desc",
    startDate,
    endDate,
  } = req.query;

  const filter = {};

  // Price filtering
  if (price) {
    filter.price = Number(price);
  } else {
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
  }

  // Discount filtering
  if (discount !== undefined) {
    filter.discount = Number(discount);
  } else {
    if (minDiscount !== undefined || maxDiscount !== undefined) {
      filter.discount = {};
      if (minDiscount !== undefined) filter.discount.$gte = Number(minDiscount);
      if (maxDiscount !== undefined) filter.discount.$lte = Number(maxDiscount);
    }
  }

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

  // Text search in name and description
  if (search) {
    const searchRegex = new RegExp(search, "i");
    const searchConditions = [
      { name: searchRegex },
      { description: searchRegex },
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
  const allowedSortFields = ["name", "price", "discount", "createdAt", "updatedAt"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
  const sort = { [sortField]: sortDirection };

  // Get total count with filters
  const total = await Service.countDocuments(filter);

  // Calculate pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const totalPages = Math.ceil(total / limitNum);

  // Fetch services with filters, sorting, and pagination
  const services = await Service.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    data: services,
  });
});

export const getServiceById = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new AppError("Service not found", 404);
  res.json({ success: true, data: service });
});

export const createService = asyncHandler(async (req, res) => {
  const service = await Service.create(req.body);
  res.status(201).json({ success: true, data: service });
});

export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!service) throw new AppError("Service not found", 404);
  res.json({ success: true, data: service });
});

export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) throw new AppError("Service not found", 404);
  res.json({ success: true, message: "Service deleted successfully" });
});
