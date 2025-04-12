// src/routes/userRoutes.ts
import express from 'express';
import { 
  getUserProfile, 
  createOrUpdateUser, 
  updateUserRole,
  getUserEvents
} from '../controllers/userController';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, getUserProfile);

// Get user by ID (admin only)
router.get('/:id', authMiddleware, adminMiddleware, getUserProfile);

// Create or update user
router.post('/', authMiddleware, createOrUpdateUser);

// Update user role (admin only)
router.put('/:id/role', authMiddleware, adminMiddleware, updateUserRole);

// Get user's events (created and attending)
router.get('/events', authMiddleware, getUserEvents);

export default router;