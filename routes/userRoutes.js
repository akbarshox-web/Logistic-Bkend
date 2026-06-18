import express from 'express';
import {
  googleAuth,
  authUser,
  registerUser,
  logoutUser,
  getUsers,
  deleteUser,
  verifyEmail,
  resendVerificationCode,
  getCurrentUser
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/google', googleAuth);
router.post('/login', authUser);
router.post('/logout', logoutUser);
router.post('/verify', verifyEmail);
router.post('/resend', resendVerificationCode);
router.post('/', registerUser);
router.get('/me', protect, getCurrentUser);
router.get('/', protect, admin, getUsers);
router.route('/:id')
  .delete(protect, admin, deleteUser);

export default router;
