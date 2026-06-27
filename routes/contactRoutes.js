import express from 'express';
import {
  createContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
} from '../controllers/contactController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public — xabar yuborish (login bo'lishi shart emas, lekin token bo'lsa user saqlanadi)
router.post('/', createContact);

// Admin
router.get('/', protect, admin, getContacts);
router.get('/:id', protect, admin, getContact);
router.put('/:id', protect, admin, updateContact);
router.delete('/:id', protect, admin, deleteContact);

export default router;