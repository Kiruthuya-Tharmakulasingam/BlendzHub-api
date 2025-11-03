import Equipment from "../models/equipment.js";

export const getAllEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.find();
    res.status(200).json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEquipmentById = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment)
      return res.status(404).json({ error: "Equipment not found" });
    res.status(200).json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createEquipment = async (req, res) => {
  try {
    const newEquipment = new Equipment(req.body);
    const saved = await newEquipment.save();
    res.status(201).json({ message: "Equipment created", equipment: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEquipment = async (req, res) => {
  try {
    const updated = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Equipment not found" });
    res.status(200).json({ message: "Equipment updated", equipment: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteEquipment = async (req, res) => {
  try {
    const deleted = await Equipment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Equipment not found" });
    res.status(200).json({ message: "Equipment deleted", equipment: deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
