// src/controllers/eventController.ts
import { Request, Response } from 'express';
import * as EventModel from '../models/Event';
import * as UserModel from '../models/User';

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
    const organizerId = req.body.userId;
    
    const newEvent = await EventModel.createEvent({
      title,
      description,
      startDate,
      endDate,
      location,
      organizer: organizerId,
      category,
      imageUrl,
      capacity,
      attendees: []
    });
    
    // Add event to user's created events
    await UserModel.addCreatedEvent(organizerId, newEvent.id!);

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
    if (event.organizer !== userId) {
      res.status(403).json({ message: 'Not authorized to update this event' });
      return;
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
    if (event.organizer !== userId) {
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