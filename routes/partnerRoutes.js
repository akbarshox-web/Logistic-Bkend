import express from 'express';
import {
  getPartners,
  createPartner,
  deletePartner
} from '../controllers/partnerController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getPartners)
  .post(protect, admin, createPartner);
router.route('/:id')
  .delete(protect, admin, deletePartner);

export default router;
