import { Request, Response } from 'express';
import {
  getAuthUrl,
  getTokens,
  addEventToCalendar,
  listCalendarEvents
} from '../services/googleCalendarService';
import { getEventById } from '../models/Event';

// Get Google OAuth URL
export const getGoogleAuthUrl = (req: Request, res: Response): void => {
  try {
    const url = getAuthUrl();
    res.json({ url });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Handle Google OAuth callback
export const handleGoogleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.query;
    
    if (!code || typeof code !== 'string') {
      res.status(400).json({ message: 'Invalid authorization code' });
      return;
    }
    
    const tokens = await getTokens(code);
    
    // In a real application, you would store these tokens in your database
    // associated with the user's account
    
    // For now, we'll just send them back to the client
    // WARNING: In a production app, NEVER send the tokens directly to the client
    // This is just for demonstration purposes
    res.json({ tokens });
  } catch (error) {
    console.error('Error handling Google callback:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add event to Google Calendar
export const addToGoogleCalendar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { tokens } = req.body;
    
    if (!tokens || !tokens.access_token) {
      res.status(400).json({ message: 'Invalid tokens' });
      return;
    }
    
    const event = getEventById(eventId);
    
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }
    
    const calendarEvent = await addEventToCalendar(tokens, {
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location
    });
    
    res.status(200).json({ message: 'Event added to calendar', event: calendarEvent });
  } catch (error) {
    console.error('Error adding event to calendar:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// List user's calendar events
export const getCalendarEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokens } = req.body;
    
    if (!tokens || !tokens.access_token) {
      res.status(400).json({ message: 'Invalid tokens' });
      return;
    }
    
    const events = await listCalendarEvents(tokens);
    res.status(200).json(events);
  } catch (error) {
    console.error('Error listing calendar events:', error);
    res.status(500).json({ message: 'Server error' });
  }
};