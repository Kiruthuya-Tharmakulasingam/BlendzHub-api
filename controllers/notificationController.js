import Notification from "../models/notification.js";
import { asyncHandler, AppError } from "../middleware/errorhandler.js";

// Get all notifications for the current user
export const getNotifications = asyncHandler(async (req, res) => {
  const { read, limit = 50 } = req.query;

  const filter = { userId: req.user._id };

  if (read !== undefined) {
    filter.read = read === "true";
  }

  const notifications = await Notification.find(filter)
    .populate("appointmentId", "date time status")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  const unreadCount = await Notification.countDocuments({
    userId: req.user._id,
    read: false,
  });

  res.json({
    success: true,
    data: notifications,
    unreadCount,
  });
});

// Mark notification as read
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findOne({
    _id: id,
    userId: req.user._id,
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  notification.read = true;
  notification.readAt = new Date();
  await notification.save();

  res.json({
    success: true,
    message: "Notification marked as read",
    data: notification,
  });
});

// Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, read: false },
    { read: true, readAt: new Date() }
  );

  res.json({
    success: true,
    message: "All notifications marked as read",
  });
});

// Delete notification
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findOneAndDelete({
    _id: id,
    userId: req.user._id,
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  res.json({
    success: true,
    message: "Notification deleted successfully",
  });
});

