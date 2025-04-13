// src/controllers/userController.ts
import { Request, Response } from 'express';
import * as UserModel from '../models/User';
import * as EventModel from '../models/Event';

// Get user profile
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id || req.body.userId;
    
    const user = await UserModel.getUserById(userId);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Remove sensitive information
    const { googleCalendar, ...safeUserData } = user;
    
    res.status(200).json(safeUserData);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching user profile', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Create or update user
export const createOrUpdateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firebaseUid, email, displayName, photoURL } = req.body;
    
    // Default role is 'user' for new users
    const userData = {
      firebaseUid,
      email,
      displayName,
      photoURL,
      role: 'user' as const,
      createdEvents: [],
      attendingEvents: []
    };
    
    const user = await UserModel.createOrUpdateUser(userData);
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error creating/updating user', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Update user role (admin only)
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    // Validate role
    if (!['user', 'staff', 'admin'].includes(role)) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }
    
    const updatedUser = await UserModel.updateUserRole(id, role as 'user' | 'staff' | 'admin');
    
    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating user role', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Get user's events (created and attending)
export const getUserEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.body.userId;
    
    const user = await UserModel.getUserById(userId);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Get events created by the user
    const createdEventsPromises = (user.createdEvents || []).map(
      eventId => EventModel.getEventById(eventId)
    );
    
    // Get events the user is attending
    const attendingEventsPromises = (user.attendingEvents || []).map(
      eventId => EventModel.getEventById(eventId)
    );
    
    // Wait for all promises to resolve
    const [createdEvents, attendingEvents] = await Promise.all([
      Promise.all(createdEventsPromises),
      Promise.all(attendingEventsPromises)
    ]);
    
    // Filter out null values (events that might have been deleted)
    const validCreatedEvents = createdEvents.filter(event => event !== null);
    const validAttendingEvents = attendingEvents.filter(event => event !== null);
    
    res.status(200).json({
      createdEvents: validCreatedEvents,
      attendingEvents: validAttendingEvents
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching user events', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};