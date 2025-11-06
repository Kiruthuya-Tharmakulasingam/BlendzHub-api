import Equipment from "../models/equipment.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const getAllEquipments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const filter = status ? { status } : {};
  const total = await Equipment.countDocuments(filter);
  const equipments = await Equipment.find(filter)
    .skip((page - 1) * limit)
    .limit(Number(limit));
  res.json({ success: true, total, data: equipments });
});

export const getEquipmentById = asyncHandler(async (req, res) => {
  const equipment = await Equipment.findById(req.params.id);
  if (!equipment) throw new Error("Equipment not found");
  res.json({ success: true, data: equipment });
});

export const createEquipment = asyncHandler(async (req, res) => {
  const equipment = await Equipment.create(req.body);
  res.status(201).json({ success: true, data: equipment });
});

export const updateEquipment = asyncHandler(async (req, res) => {
  const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!equipment) throw new Error("Equipment not found");
  res.json({ success: true, data: equipment });
});

export const deleteEquipment = asyncHandler(async (req, res) => {
  const equipment = await Equipment.findByIdAndDelete(req.params.id);
  if (!equipment) throw new Error("Equipment not found");
  res.json({ success: true, message: "Equipment deleted successfully" });
});
