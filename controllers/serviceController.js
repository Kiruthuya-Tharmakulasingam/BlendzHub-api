import Service from "../models/service.js";

// GET all services
export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET single service by ID
export const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE new service
export const createService = async (req, res) => {
  try {
    const newService = new Service(req.body);
    const savedService = await newService.save();
    res.status(201).json({
      message: "Service created successfully",
      service: savedService,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE service
export const updateService = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE service
export const deleteService = async (req, res) => {
  try {
    const deletedService = await Service.findByIdAndDelete(req.params.id);
    if (!deletedService)
      return res.status(404).json({ error: "Service not found" });
    res.status(200).json({
      message: "Service deleted successfully",
      service: deletedService,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
