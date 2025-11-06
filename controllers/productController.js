import Product from "../models/product.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const getAllProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, supplier } = req.query;
  const filter = supplier ? { supplier: new RegExp(supplier, "i") } : {};
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .skip((page - 1) * limit)
    .limit(Number(limit));
  res.json({ success: true, total, data: products });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new Error("Product not found");
  res.json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!product) throw new Error("Product not found");
  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new Error("Product not found");
  res.json({ success: true, message: "Product deleted successfully" });
});
