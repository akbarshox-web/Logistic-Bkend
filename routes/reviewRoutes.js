import express from 'express';
import {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  getAllReviews,
} from '../controllers/reviewController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public — faol fikrlar
router.get('/', getReviews);

// Admin — barchasi
router.get('/admin/all', protect, admin, getAllReviews);

// Login bo'lgan user
router.post('/', protect, createReview);

// Admin yoki egasi
router.put('/:id', protect, admin, updateReview);
router.delete('/:id', protect, deleteReview);
router.get('/:id', getReview);

export default router;