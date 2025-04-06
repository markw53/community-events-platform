import { Request, Response } from 'express';
import { 
  getAllEvents, 
  getEventById, 
  createEvent, 
  updateEvent, 
  deleteEvent 
} from '../models/Event';

// Get all events
export const getEvents = (req: Request, res: Response) => {
  try {
    const events = getAllEvents();
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get event by ID
export const getEvent = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = getEventById(id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.status(200).json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new event
export const createNewEvent = (req: Request, res: Response) => {
  try {
    const { title, description, startTime, endTime, location, imageUrl } = req.body;
    
    // Basic validation
    if (!title || !description || !startTime || !endTime || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // In a real app, you would get the user ID from the authenticated user
    const createdBy = 'admin'; // Placeholder
    
    const newEvent = createEvent({
      title,
      description,
      startTime,
      endTime,
      location,
      imageUrl,
      createdBy
    });
    
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update an event
export const updateExistingEvent = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, startTime, endTime, location, imageUrl } = req.body;
    
    const updatedEvent = updateEvent(id, {
      title,
      description,
      startTime,
      endTime,
      location,
      imageUrl
    });
    
    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete an event
export const deleteExistingEvent = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = deleteEvent(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};