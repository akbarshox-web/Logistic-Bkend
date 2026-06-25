import express from 'express';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../controllers/driverController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getDrivers)
  .post(protect, admin, createDriver);

router.route('/:id')
  .put(protect, admin, updateDriver)
  .delete(protect, admin, deleteDriver);

export default router;