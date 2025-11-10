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

// Read: anyone authenticated
router.get("/", verifyToken, getAllProducts);
router.get("/:id", verifyToken, getProductById);

// Write: admin/owner only
router.post("/", verifyToken, verifyRole(["owner", "admin"]), createProduct);
router.put("/:id", verifyToken, verifyRole(["owner", "admin"]), updateProduct);
router.delete("/:id", verifyToken, verifyRole(["owner", "admin"]), deleteProduct);

export default router;
