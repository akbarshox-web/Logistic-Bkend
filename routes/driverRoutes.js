import express from 'express';
import {
  getDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  getMyOrders,
  updateOrderStatus,
} from '../controllers/driverController.js';
import { driverLogin } from '../controllers/driverAuthController.js';
import { protect, admin, driverAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public — Driver login
router.post('/login', driverLogin);

// Driver o'z buyurtmalari (/:id dan OLDIN yozilishi shart)
router.get('/my-orders', protect, driverAuth, getMyOrders);
router.put('/orders/:orderId', protect, driverAuth, updateOrderStatus);

// Admin routes
router.route('/')
  .get(protect, admin, getDrivers)
  .post(protect, admin, createDriver);

router.route('/:id')
  .put(protect, admin, updateDriver)
  .delete(protect, admin, deleteDriver);

export default router;