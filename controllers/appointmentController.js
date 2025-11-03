import Appointment from "../models/appointment.js";

export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().populate(
      "customerId staffId serviceId"
    );
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate(
      "customerId staffId serviceId"
    );
    if (!appointment)
      return res.status(404).json({ error: "Appointment not found" });
    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const newAppointment = new Appointment(req.body);
    const saved = await newAppointment.save();
    res
      .status(201)
      .json({ message: "Appointment created", appointment: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated)
      return res.status(404).json({ error: "Appointment not found" });
    res
      .status(200)
      .json({ message: "Appointment updated", appointment: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ error: "Appointment not found" });
    res
      .status(200)
      .json({ message: "Appointment deleted", appointment: deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
