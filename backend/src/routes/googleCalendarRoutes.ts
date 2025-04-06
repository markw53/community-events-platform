import express, { Router } from 'express';
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  addToGoogleCalendar,
  getCalendarEvents
} from '../controllers/googleCalendarController';

const router: Router = express.Router();

// Get Google OAuth URL
router.get('/auth-url', getGoogleAuthUrl);

// Handle Google OAuth callback
router.get('/callback', handleGoogleCallback);

// Add event to Google Calendar
router.post('/add-event/:eventId', addToGoogleCalendar);

// List user's calendar events
router.post('/events', getCalendarEvents);

export default router;