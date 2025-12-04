import Product from "../models/product.js";
import Salon from "../models/salon.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

export const getAllProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    supplier,
    salonId,
    search,
    status,
    minQualityRating,
    maxQualityRating,
    qualityRating,
    sortBy = "createdAt",
    sortOrder = "desc",
    startDate,
    endDate,
  } = req.query;

  const filter = {};

  // Role-based filtering (if authenticated)
  if (req.user) {
    if (req.user.role === "owner" && req.salon) {
      filter.salonId = req.salon._id;
    }
  }

  // Supplier filtering
  if (supplier) {
    filter.supplier = new RegExp(supplier, "i");
  }

  // ID-based filtering
  if (salonId) filter.salonId = salonId;

  // Status filtering
  if (status) {
    filter.status = status;
  }

  // Quality rating filtering
  if (qualityRating) {
    filter.qualityRating = Number(qualityRating);
  } else {
    if (minQualityRating || maxQualityRating) {
      filter.qualityRating = {};
      if (minQualityRating)
        filter.qualityRating.$gte = Number(minQualityRating);
      if (maxQualityRating)
        filter.qualityRating.$lte = Number(maxQualityRating);
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

  // Text search in name and supplier
  if (search) {
    const searchRegex = new RegExp(search, "i");
    const searchConditions = [{ name: searchRegex }, { supplier: searchRegex }];

    if (Object.keys(filter).length > 0) {
      const combinedFilter = {
        $and: [{ ...filter }, { $or: searchConditions }],
      };
      Object.keys(filter).forEach((key) => delete filter[key]);
      Object.assign(filter, combinedFilter);
    } else {
      filter.$or = searchConditions;
    }
  }

  // Validate sortBy field
  const allowedSortFields = [
    "name",
    "price",
    "supplier",
    "status",
    "qualityRating",
    "createdAt",
    "updatedAt",
  ];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;
  const sort = { [sortField]: sortDirection };

  // Get total count with filters
  const total = await Product.countDocuments(filter);

  // Calculate pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const totalPages = Math.ceil(total / limitNum);

  // Fetch products with filters, sorting, and pagination
  const products = await Product.find(filter)
    .populate("salonId", "name location")
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    data: products,
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };

  // Role-based access (if authenticated)
  if (req.user) {
    if (req.user.role === "owner" && req.salon) {
      filter.salonId = req.salon._id;
    }
  }

  const product = await Product.findOne(filter).populate(
    "salonId",
    "name location"
  );

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  res.json({ success: true, data: product });
});

// Create product (owner/admin only)
export const createProduct = asyncHandler(async (req, res) => {
  let salonId = req.body.salonId;

  // If owner, use their salon
  if (req.user.role === "owner" && req.salon) {
    salonId = req.salon._id;
  }

  if (!salonId) {
    throw new AppError("Please provide salonId", 400);
  }

  // Verify salon exists
  const salon = await Salon.findById(salonId);
  if (!salon) {
    throw new AppError("Salon not found", 404);
  }

  // Verify owner owns this salon (if owner role)
  if (
    req.user.role === "owner" &&
    salon.ownerId.toString() !== req.user._id.toString()
  ) {
    throw new AppError("You can only create products for your own salon", 403);
  }

  const product = await Product.create({
    ...req.body,
    salonId,
  });

  const populatedProduct = await Product.findById(product._id).populate(
    "salonId",
    "name location"
  );

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: populatedProduct,
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!product) throw new AppError("Product not found", 404);
  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError("Product not found", 404);
  res.json({ success: true, message: "Product deleted successfully" });
});
