// src/services/storageService.ts
import { storage } from '../config/firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Upload image to Firebase Storage
export const uploadImage = async (
  file: Express.Multer.File,
  folder: 'events' | 'profiles' | 'images',
  customFileName?: string
): Promise<string> => {
  try {
    // Generate a unique filename if not provided
    const fileName = customFileName || `${uuidv4()}${path.extname(file.originalname)}`;
    const filePath = `${folder}/${fileName}`;
    
    // Create a storage reference
    const bucket = storage.bucket();
    const fileRef = bucket.file(filePath);
    
    // Upload the file
    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype
      }
    });
    
    // Make the file publicly accessible
    await fileRef.makePublic();
    
    // Return the public URL
    return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Delete image from Firebase Storage
export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract the file path from the URL
    const bucket = storage.bucket();
    const urlParts = imageUrl.split(`https://storage.googleapis.com/${bucket.name}/`);
    
    if (urlParts.length !== 2) {
      throw new Error('Invalid image URL format');
    }
    
    const filePath = urlParts[1];
    const fileRef = bucket.file(filePath);
    
    // Check if file exists
    const [exists] = await fileRef.exists();
    
    if (exists) {
      await fileRef.delete();
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};