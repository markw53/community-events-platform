// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase-admin';
import * as UserModel from '../models/User';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized: No token provided' });
      return;
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Find user in our database
    const user = await UserModel.getUserByFirebaseUid(decodedToken.uid);
    
    if (!user) {
      res.status(401).json({ message: 'Unauthorized: User not found in database' });
      return;
    }
    
    // Add user ID to request body for controllers to use
    req.body.userId = user.id;
    req.body.userRole = user.role;
    req.body.firebaseUid = decodedToken.uid;
    
    next();
  } catch (error) {
    res.status(401).json({ 
      message: 'Unauthorized: Invalid token', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body.userRole !== 'admin') {
    res.status(403).json({ message: 'Forbidden: Admin access required' });
    return;
  }
  
  next();
};