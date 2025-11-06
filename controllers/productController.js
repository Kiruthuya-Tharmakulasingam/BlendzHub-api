import Product from "../models/product.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const getAllProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  const products = await Product.find().skip(skip).limit(limit);
  const totalProduct = await Product.countDocuments();

  res.status(200).json({
    totalProduct,
    page,
    totalPages: Math.ceil(totalProduct / limit),
    count: products.length,
    products,
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.status(200).json(product);
});

export const createProduct = asyncHandler(async (req, res) => {
  const newProduct = new Product(req.body);
  const saved = await newProduct.save();
  res.status(201).json({ message: "Product created", product: saved });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updated) return res.status(404).json({ error: "Product not found" });
  res.status(200).json({ message: "Product updated", product: updated });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const deleted = await Product.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Product not found" });
  res.status(200).json({ message: "Product deleted", product: deleted });
});
