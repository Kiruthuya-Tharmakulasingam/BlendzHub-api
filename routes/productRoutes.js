import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { verifyToken, verifyRole } from "../middleware/auth.js";

const router = express.Router();

// Public routes - anyone can view products
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Protected routes - only owner can create/update/delete products
router.post("/", verifyToken, verifyRole(["owner"]), createProduct);
router.put("/:id", verifyToken, verifyRole(["owner"]), updateProduct);
router.delete("/:id", verifyToken, verifyRole(["owner"]), deleteProduct);

export default router;
