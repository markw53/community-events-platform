// src/routes/imageRoutes.ts
import express from 'express';
import { uploadEventImage, uploadProfileImage, deleteImage } from '../controllers/imageController';
import { authMiddleware } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = express.Router();

// Upload event image
router.post('/events', authMiddleware, upload.single('image'), uploadEventImage);

// Upload profile image
router.post('/profile', authMiddleware, upload.single('image'), uploadProfileImage);

// Delete image
router.delete('/:imageId', authMiddleware, deleteImage);

export default router;