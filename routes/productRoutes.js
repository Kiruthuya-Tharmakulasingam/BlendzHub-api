import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { authOptional, authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authOptional, getAllProducts);
router.get("/:id", authOptional, getProductById);

router.post("/", authenticate, requireRole(["owner"]), createProduct);
router.put("/:id", authenticate, requireRole(["owner"]), updateProduct);
router.delete("/:id", authenticate, requireRole(["owner"]), deleteProduct);

export default router;
