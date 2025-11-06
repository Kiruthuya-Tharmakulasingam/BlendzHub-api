import Equipment from "../models/equipment.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const getAllEquipment = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  const equipments = await Equipment.find().skip(skip).limit(limit);
  const totalEquipments = await Equipment.countDocuments();

  res.status(200).json({
    totalEquipments,
    page,
    totalPages: Math.ceil(totalEquipments / limit),
    count: equipments.length,
    equipments,
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
