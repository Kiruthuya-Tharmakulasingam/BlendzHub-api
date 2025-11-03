import Feedback from "../models/feedback.js";

export const getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find().populate("customerId appointmentId");
    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id).populate(
      "customerId appointmentId"
    );
    if (!feedback) return res.status(404).json({ error: "Feedback not found" });
    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createFeedback = async (req, res) => {
  try {
    const newFeedback = new Feedback(req.body);
    const saved = await newFeedback.save();
    res.status(201).json({ message: "Feedback created", feedback: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateFeedback = async (req, res) => {
  try {
    const updated = await Feedback.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Feedback not found" });
    res.status(200).json({ message: "Feedback updated", feedback: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteFeedback = async (req, res) => {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Feedback not found" });
    res.status(200).json({ message: "Feedback deleted", feedback: deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
