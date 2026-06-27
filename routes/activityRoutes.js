import express from 'express';
import {
  getActivities,
  getActivityStats,
  getRecent,
  deleteActivity,
  clearAll,
} from '../controllers/activityController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, admin, getActivities);
router.get('/stats', protect, admin, getActivityStats);
router.get('/recent', protect, admin, getRecent);
router.delete('/all', protect, admin, clearAll);
router.delete('/:id', protect, admin, deleteActivity);

export default router;