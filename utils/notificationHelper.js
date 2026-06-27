import Notification from '../models/Notification.js';
import mongoose from 'mongoose';

/**
 * ✅ Bildirishnoma yaratish uchun universal helper
 */
export const createNotification = async ({
  user,
  type = 'system',
  title,
  message,
  data = {},
}) => {
  try {
    if (!user || !title || !message) return null;
    if (mongoose.connection.readyState !== 1) return null;
    if (!mongoose.Types.ObjectId.isValid(user)) return null;

    return await Notification.create({
      user,
      type,
      title,
      message,
      data,
    });
  } catch (error) {
    console.warn('⚠️ Notification yaratilmadi:', error.message);
    return null;
  }
};

export default createNotification;