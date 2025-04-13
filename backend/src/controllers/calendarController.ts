// src/controllers/calendarController.ts
import { Request, Response } from 'express';
import {
  getAuthUrl,
  getTokens,
  addEventToCalendar,
  listCalendarEvents,
  storeUserTokens
} from '../services/googleCalendarService';
import * as EventModel from '../models/Event';
import * as UserModel from '../models/User';
import { firestore } from '../config/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Get Google OAuth URL
export const getGoogleAuthUrl = (req: Request, res: Response): void => {
  try {
    const url = getAuthUrl();
    res.json({ url });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ 
      message: 'Error generating auth URL', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Handle Google OAuth callback
export const handleGoogleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    const userId = req.body.userId;
    
    if (!code || typeof code !== 'string') {
      res.status(400).json({ message: 'Invalid authorization code' });
      return;
    }
    
    const tokens = await getTokens(code);
    
    // Store tokens in Firestore
    const userRef = firestore.collection('users').doc(userId);
    
    await userRef.update({
      googleCalendar: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(Date.now() + (tokens.expiry_date || 3600) * 1000)
      },
      updatedAt: new Date()
    });
    
    res.status(200).json({ message: 'Google Calendar connected successfully' });
  } catch (error) {
    console.error('Error handling Google callback:', error);
    res.status(500).json({ 
      message: 'Error handling Google callback', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Add event to Google Calendar
export const addToGoogleCalendar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.body.userId;
    
    // Get user with Google Calendar tokens
    const user = await UserModel.getUserById(userId);
    
    if (!user || !user.googleCalendar || !user.googleCalendar.accessToken) {
      res.status(400).json({ message: 'Google Calendar not connected' });
      return;
    }
    
    // Get tokens
    const tokens = {
      access_token: user.googleCalendar.accessToken,
      refresh_token: user.googleCalendar.refreshToken,
      expiry_date: typeof user.googleCalendar.tokenExpiry === 'string' 
        ? new Date(user.googleCalendar.tokenExpiry).getTime() 
        : user.googleCalendar.tokenExpiry?.getTime() || 0
    };
    
    // Get event from database
    const event = await EventModel.getEventById(eventId);
    
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }
    
    const calendarEvent = await addEventToCalendar(tokens, {
      title: event.title,
      description: event.description,
      startTime: event.startDate,
      endTime: event.endDate,
      location: event.location
    }, userId);
    
    // Store Google Calendar event ID with the event
    await EventModel.updateEvent(eventId, {
      googleCalendarEventId: calendarEvent.id ?? undefined
    });
    
    res.status(200).json({ message: 'Event added to calendar', event: calendarEvent });
  } catch (error) {
    console.error('Error adding event to calendar:', error);
    res.status(500).json({ 
      message: 'Error adding event to calendar', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// List user's calendar events
export const getCalendarEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.body.userId;
    
    // Get user with Google Calendar tokens
    const user = await UserModel.getUserById(userId);
    
    if (!user || !user.googleCalendar || !user.googleCalendar.accessToken) {
      res.status(400).json({ message: 'Google Calendar not connected' });
      return;
    }
    
    // Get tokens
    const tokens = {
      access_token: user.googleCalendar.accessToken,
      refresh_token: user.googleCalendar.refreshToken,
      expiry_date: typeof user.googleCalendar.tokenExpiry === 'string' 
        ? new Date(user.googleCalendar.tokenExpiry).getTime() 
        : user.googleCalendar.tokenExpiry?.getTime() || 0
    };
    
    const events = await listCalendarEvents(tokens, userId);
    res.status(200).json(events);
  } catch (error) {
    console.error('Error listing calendar events:', error);
    res.status(500).json({ 
      message: 'Error listing calendar events', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Disconnect Google Calendar
export const disconnectGoogleCalendar = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.body.userId;
    
    // Remove Google Calendar tokens from user
    const userRef = firestore.collection('users').doc(userId);
    
    await userRef.update({
      googleCalendar: FieldValue.delete(),
      updatedAt: new Date()
    });
    
    res.status(200).json({ message: 'Google Calendar disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({ 
      message: 'Error disconnecting Google Calendar', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};