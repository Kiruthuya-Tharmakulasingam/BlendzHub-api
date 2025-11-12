import Product from "../models/product.js";
import Salon from "../models/salon.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

export const getAllProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, supplier, salonId } = req.query;
  const filter = {};
  
  if (supplier) filter.supplier = new RegExp(supplier, "i");
  if (salonId) filter.salonId = salonId;

  // Role-based filtering (if authenticated)
  if (req.user) {
    if (req.user.role === "owner" && req.salon) {
      filter.salonId = req.salon._id;
    } else if (req.user.role === "staff" && req.staff) {
      filter.salonId = req.staff.salonId;
      // Staff can see all products in their salon, not just assigned ones
    }
  }

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate("salonId", "name location")
    .populate("assignedToStaffId", "name role")
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });
  
  res.json({ success: true, total, data: products });
});

export const getProductById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };

  // Role-based access (if authenticated)
  if (req.user) {
    if (req.user.role === "owner" && req.salon) {
      filter.salonId = req.salon._id;
    } else if (req.user.role === "staff" && req.staff) {
      filter.salonId = req.staff.salonId;
    }
  }

  const product = await Product.findOne(filter)
    .populate("salonId", "name location")
    .populate("assignedToStaffId", "name role");

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
  if (req.user.role === "owner" && salon.ownerId.toString() !== req.user._id.toString()) {
    throw new AppError("You can only create products for your own salon", 403);
  }

  const product = await Product.create({
    ...req.body,
    salonId,
  });

  const populatedProduct = await Product.findById(product._id)
    .populate("salonId", "name location")
    .populate("assignedToStaffId", "name role");

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
