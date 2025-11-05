import Service from "../models/service.js";
import asyncHandler from "../middleware/asyncHandler.js";

// GET all services
export const getAllServices = asyncHandler(async (req, res) => {
  const services = await Service.find();
  res.status(200).json(services);
});

// GET single service by ID
export const getServiceById = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ error: "Service not found" });
  res.status(200).json(service);
});

// CREATE new service
export const createService = asyncHandler(async (req, res) => {
  const newService = new Service(req.body);
  const savedService = await newService.save();
  res.status(201).json({
    message: "Service created successfully",
    service: savedService,
  });
});

// UPDATE service
export const updateService = asyncHandler(async (req, res) => {
  const updatedService = await Service.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!updatedService)
    return res.status(404).json({ error: "Service not found" });
  res.status(200).json({
    message: "Service updated successfully",
    service: updatedService,
  });
});

// DELETE service
export const deleteService = asyncHandler(async (req, res) => {
  const deletedService = await Service.findByIdAndDelete(req.params.id);
  if (!deletedService)
    return res.status(404).json({ error: "Service not found" });
  res.status(200).json({
    message: "Service deleted successfully",
    service: deletedService,
  });
});
