import Equipment from "../models/equipment.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { paginate } from "../utils/paginate.js";

export const getAllEquipment = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await paginate(Equipment, page, limit);

  res.status(200).json({
    success: true,
    message: "Equipment fetched successfully",
    ...result,
  });
});

export const getEquipmentById = asyncHandler(async (req, res) => {
  const equipment = await Equipment.findById(req.params.id);
  if (!equipment) return res.status(404).json({ error: "Equipment not found" });
  res.status(200).json(equipment);
});

export const createEquipment = asyncHandler(async (req, res) => {
  const newEquipment = new Equipment(req.body);
  const saved = await newEquipment.save();
  res.status(201).json({ message: "Equipment created", equipment: saved });
});

export const updateEquipment = asyncHandler(async (req, res) => {
  const updated = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updated) return res.status(404).json({ error: "Equipment not found" });
  res.status(200).json({ message: "Equipment updated", equipment: updated });
});

export const deleteEquipment = asyncHandler(async (req, res) => {
  const deleted = await Equipment.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Equipment not found" });
  res.status(200).json({ message: "Equipment deleted", equipment: deleted });
});
