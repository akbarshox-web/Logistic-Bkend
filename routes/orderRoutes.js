import express from 'express';
import {
  createOrder,
  getOrders,
  trackOrder,
  updateOrder,
  deleteOrder,
  getClients,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', createOrder);
router.get('/track/:trackingId', trackOrder);
router.get('/clients', protect, admin, getClients);
router.get('/', protect, admin, getOrders);
router.put('/:id', protect, admin, updateOrder);
router.delete('/:id', protect, admin, deleteOrder);

export default router;