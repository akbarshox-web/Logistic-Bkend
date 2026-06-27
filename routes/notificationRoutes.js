import express from 'express';
import {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAll,
  createNotification,
} from '../controllers/notificationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.get('/:id', protect, getNotification);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllAsRead);
router.delete('/all', protect, deleteAll);
router.delete('/:id', protect, deleteNotification);

// Admin — boshqa userga bildirishnoma yuborish
router.post('/', protect, admin, createNotification);

export default router;