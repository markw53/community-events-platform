// src/controllers/imageController.ts
import { Request, Response } from 'express';
import { uploadImage, deleteImage as deleteStorageImage } from '../services/storageService';
import * as UserModel from '../models/User';
import * as EventModel from '../models/Event';
import path from 'path';

// Upload event image
export const uploadEventImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No image file provided' });
      return;
    }
    
    // Generate a unique filename with original extension
    const fileExt = path.extname(req.file.originalname);
    const fileName = `event_${Date.now()}${fileExt}`;
    
    // Upload to Firebase Storage
    const imageUrl = await uploadImage(req.file, 'events', fileName);
    
    res.status(200).json({ 
      message: 'Image uploaded successfully',
      imageUrl 
    });
  } catch (error) {
    console.error('Error uploading event image:', error);
    res.status(500).json({ 
      message: 'Error uploading image', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Upload profile image
export const uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No image file provided' });
      return;
    }
    
    const userId = req.body.userId;
    
    // Get current user to check if they already have a profile image
    const user = await UserModel.getUserById(userId);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // If user already has a profile image, delete it
    if (user.photoURL && user.photoURL.includes('storage.googleapis.com')) {
      try {
        await deleteStorageImage(user.photoURL);
      } catch (error) {
        console.error('Error deleting old profile image:', error);
        // Continue even if deletion fails
      }
    }
    
    // Generate a unique filename with original extension
    const fileExt = path.extname(req.file.originalname);
    const fileName = `${userId}${fileExt}`;
    
    // Upload to Firebase Storage
    const imageUrl = await uploadImage(req.file, 'profiles', fileName);
    
    // Update user profile with new image URL
    await UserModel.createOrUpdateUser({
      ...user,
      photoURL: imageUrl
    });
    
    res.status(200).json({ 
      message: 'Profile image uploaded successfully',
      imageUrl 
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ 
      message: 'Error uploading image', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Delete image
export const deleteImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      res.status(400).json({ message: 'No image URL provided' });
      return;
    }
    
    await deleteStorageImage(imageUrl);
    
    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ 
      message: 'Error deleting image', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};