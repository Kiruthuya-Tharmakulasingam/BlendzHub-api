import Service from "../models/service.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const getAllServices = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, name } = req.query;
  const filter = name ? { name: new RegExp(name, "i") } : {};
  const total = await Service.countDocuments(filter);
  const services = await Service.find(filter)
    .skip((page - 1) * limit)
    .limit(Number(limit));
  res.json({ success: true, total, data: services });
});

export const getServiceById = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new Error("Service not found");
  res.json({ success: true, data: service });
});

export const createService = asyncHandler(async (req, res) => {
  const service = await Service.create(req.body);
  res.status(201).json({ success: true, data: service });
});

export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!service) throw new Error("Service not found");
  res.json({ success: true, data: service });
});

export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) throw new Error("Service not found");
  res.json({ success: true, message: "Service deleted successfully" });
});
