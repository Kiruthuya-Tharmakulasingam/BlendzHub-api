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

router.post("/", authenticate, requireRole(["owner", "staff"]), createProduct);
router.put("/:id", authenticate, requireRole(["owner", "staff"]), updateProduct);
router.delete(
  "/:id",
  authenticate,
  requireRole(["owner", "staff"]),
  deleteProduct
);

export default router;
