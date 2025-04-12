// src/routes/calendarRoutes.ts
import express from 'express';
import { 
  getGoogleAuthUrl, 
  handleGoogleCallback, 
  addToGoogleCalendar, 
  getCalendarEvents,
  disconnectGoogleCalendar
} from '../controllers/calendarController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Get Google OAuth URL
router.get('/auth/google/url', authMiddleware, getGoogleAuthUrl);

// Handle Google OAuth callback
router.post('/auth/google/callback', authMiddleware, handleGoogleCallback);

// Add event to Google Calendar
router.post('/events/:eventId/add', authMiddleware, addToGoogleCalendar);

// List user's calendar events
router.get('/events', authMiddleware, getCalendarEvents);

// Disconnect Google Calendar
router.delete('/disconnect', authMiddleware, disconnectGoogleCalendar);

export default router;