import Activity from '../models/Activity.js';
import mongoose from 'mongoose';

/**
 * ✅ Activity Log yozish uchun universal helper
 * - Faoliyat muvaffaqiyatsiz bo'lsa, asosiy jarayonni buzmasligi kerak
 */
export const logActivity = async ({
  type,
  actor = null,
  actorRole = 'system',
  actorName = 'Tizim',
  targetType = 'system',
  targetId = null,
  targetName = '',
  description = '',
  metadata = {},
  ip = '',
} = {}) => {
  try {
    if (!type || !description) return null;
    if (mongoose.connection.readyState !== 1) return null;

    const payload = {
      type,
      actorRole,
      actorName,
      targetType,
      targetName,
      description,
      metadata,
      ip,
    };

    if (actor && mongoose.Types.ObjectId.isValid(actor)) {
      payload.actor = actor;
    }
    if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
      payload.targetId = targetId;
    }

    return await Activity.create(payload);
  } catch (error) {
    console.warn('⚠️ Activity log yozilmadi:', error.message);
    return null;
  }
};

/**
 * ✅ IP manzilni olish
 */
export const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    req.ip ||
    ''
  );
};

export default logActivity;