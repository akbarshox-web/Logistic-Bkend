import express from 'express';
import {
  createOrder,
  getOrders,
  getMyOrders,
  trackOrder,
  updateOrder,
  deleteOrder,
  getClients,
  getDashboardStats,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Muhim: aniq routelar /:id dan OLDIN yozilishi kerak
router.get('/my-orders', protect, getMyOrders);
router.get('/clients', protect, admin, getClients);
router.get('/stats/dashboard', protect, admin, getDashboardStats);
router.get('/track/:trackingId', trackOrder);

router.post('/', createOrder);
router.get('/', protect, admin, getOrders);
router.put('/:id', protect, admin, updateOrder);
router.delete('/:id', protect, admin, deleteOrder);

export default router;