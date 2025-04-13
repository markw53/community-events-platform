// src/controllers/eventController.ts
import { Request, Response } from 'express';
import * as EventModel from '../models/Event';
import * as UserModel from '../models/User';
import { Storage } from '@google-cloud/storage';

// Get all events
export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await EventModel.getAllEvents();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching events', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Get event by ID
export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await EventModel.getEventById(req.params.id);
    
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }
    
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching event', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Create new event
export const createNewEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, startDate, endDate, location, category, imageUrl, capacity } = req.body;
    
    // Get user ID from auth middleware
    const organiserId = req.body.userId;
    
    const newEvent = await EventModel.createEvent({
      title,
      description,
      startDate,
      endDate,
      location,
      organiser: organiserId,
      category,
      imageUrl,
      capacity,
      attendees: []
    });
    
    // Add event to user's created events
    await UserModel.addCreatedEvent(organiserId, newEvent.id!);

    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error creating event', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Update event
export const updateExistingEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.body.userId;
    
    // Get the event to check permissions
    const event = await EventModel.getEventById(id);
    
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }
    
    // Check if user is the organizer
    if (event.organiser !== userId) {
      res.status(403).json({ message: 'Not authorized to update this event' });
      return;
    }
    
    // If updating the image and there's an existing image, delete the old one
    if (updates.imageUrl && event.imageUrl && 
      event.imageUrl.includes('storage.googleapis.com') && 
      updates.imageUrl !== event.imageUrl) {
    try {
      await deleteStorageImage(event.imageUrl);
    } catch (error) {
      console.error('Error deleting old event image:', error);
      // Continue even if deletion fails
    }
  }
    
    const updatedEvent = await EventModel.updateEvent(id, updates);
    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating event', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Delete event
export const deleteExistingEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.body.userId;
    
    // Get the event to check permissions
    const event = await EventModel.getEventById(id);
    
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }
    
    // Check if user is the organizer
    if (event.organiser !== userId) {
      res.status(403).json({ message: 'Not authorized to delete this event' });
      return;
    }
    
    await EventModel.deleteEvent(id);
    
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting event', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Register for an event
export const registerForEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.body.userId;
    
    // Register for the event
    await EventModel.registerForEvent(id, userId);
    
    // Add event to user's attending events
    await UserModel.addAttendingEvent(userId, id);
    
    res.status(200).json({ message: 'Successfully registered for event' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error registering for event', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};
const storage = new Storage();
const bucketName = 'your-bucket-name'; // Replace with your actual bucket name

async function deleteStorageImage(imageUrl: string): Promise<void> {
  try {
    // Extract the file name from the image URL
    const fileName = imageUrl.split(`${bucketName}/`)[1];
    if (!fileName) {
      throw new Error('Invalid image URL');
    }

    // Delete the file from the bucket
    await storage.bucket(bucketName).file(fileName).delete();
    console.log(`Successfully deleted image: ${fileName}`);
  } catch (error) {
    console.error('Error deleting image from storage:', error);
    throw new Error('Failed to delete image from storage');
  }
}
