import express from 'express';
import {
  getPublicSettings,
  getAdminSettings,
  updateSettings,
  resetSettings,
} from '../controllers/settingController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public
router.get('/', getPublicSettings);

// Admin
router.get('/admin', protect, admin, getAdminSettings);
router.put('/', protect, admin, updateSettings);
router.post('/reset', protect, admin, resetSettings);

export default router;