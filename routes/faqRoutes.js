import express from 'express';
import {
  getFaqs,
  getAllFaqs,
  getFaq,
  createFaq,
  updateFaq,
  deleteFaq,
} from '../controllers/faqController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public — faol FAQ
router.get('/', getFaqs);

// Admin
router.get('/all', protect, admin, getAllFaqs);
router.get('/:id', protect, admin, getFaq);
router.post('/', protect, admin, createFaq);
router.put('/:id', protect, admin, updateFaq);
router.delete('/:id', protect, admin, deleteFaq);

export default router;