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

// Protected routes - only admin/owner can create/update/delete products
router.post("/", verifyToken, verifyRole(["owner", "admin"]), createProduct);
router.put("/:id", verifyToken, verifyRole(["owner", "admin"]), updateProduct);
router.delete("/:id", verifyToken, verifyRole(["owner", "admin"]), deleteProduct);

export default router;
