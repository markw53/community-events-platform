// src/services/googleCalendarService.ts
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { firestore } from '../config/firebase-admin';

dotenv.config();

// Path to credentials file
const CREDENTIALS_PATH = path.join(__dirname, '../config/credentials/google-calendar-credentials.json');

// Load credentials from file
let credentials: any;
try {
  const credentialsFile = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
  credentials = JSON.parse(credentialsFile);
} catch (error) {
  console.error('Error loading Google Calendar credentials:', error);
  // Fallback to environment variables if file not found
  credentials = {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uris: [process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback']
  };
}

// Scopes for Google Calendar API
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Create OAuth2 client
const createOAuth2Client = (): OAuth2Client => {
  return new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uris[0]
  );
};

// Generate authentication URL
export const getAuthUrl = (): string => {
  const oauth2Client = createOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force to get refresh token
  });
};

// Get tokens from code
export const getTokens = async (code: string) => {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

// Helper to refresh tokens if needed
export const refreshTokensIfNeeded = async (tokens: any, userId: string) => {
  // Check if tokens are expired
  if (tokens.expiry_date && tokens.expiry_date <= Date.now()) {
    try {
      const oauth2Client = createOAuth2Client();
      oauth2Client.setCredentials({
        refresh_token: tokens.refresh_token
      });
      
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update tokens in Firestore
      await firestore.collection('users').doc(userId).update({
        'googleCalendar.accessToken': credentials.access_token,
        'googleCalendar.tokenExpiry': new Date(credentials.expiry_date || Date.now() + 3600 * 1000),
        'updatedAt': new Date()
      });
      
      return {
        access_token: credentials.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: Date.now() + (credentials.expiry_date || 3600) * 1000
      };
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }
  
  return tokens;
};

// Create calendar client with tokens
const createCalendarClient = async (tokens: any, userId?: string): Promise<calendar_v3.Calendar> => {
  let updatedTokens = tokens;
  
  // Refresh tokens if needed and userId is provided
  if (userId) {
    updatedTokens = await refreshTokensIfNeeded(tokens, userId);
  }
  
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(updatedTokens);
  
  return google.calendar({ version: 'v3', auth: oauth2Client });
};

// Add event to user's calendar
export const addEventToCalendar = async (
  tokens: any,
  eventData: {
    title: string;
    description: string;
    startTime: Date | string;
    endTime: Date | string;
    location: string;
  },
  userId?: string
) => {
  try {
    const calendar = await createCalendarClient(tokens, userId);
    
    const event = {
      summary: eventData.title,
      description: eventData.description,
      start: {
        dateTime: typeof eventData.startTime === 'string' 
          ? eventData.startTime 
          : eventData.startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: typeof eventData.endTime === 'string' 
          ? eventData.endTime 
          : eventData.endTime.toISOString(),
        timeZone: 'UTC',
      },
      location: eventData.location,
    };
    
    const response = await calendar.events.insert({
      calendarId: 'primary', // 'primary' refers to the user's primary calendar
      requestBody: event,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error adding event to Google Calendar:', error);
    throw error;
  }
};

// List user's calendar events
export const listCalendarEvents = async (tokens: any, userId?: string) => {
  try {
    const calendar = await createCalendarClient(tokens, userId);
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: (new Date()).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    return response.data.items;
  } catch (error) {
    console.error('Error listing calendar events:', error);
    throw error;
  }
};

// Store Google Calendar tokens in Firestore
export const storeUserTokens = async (userId: string, tokens: any) => {
  try {
    await firestore.collection('users').doc(userId).update({
      'googleCalendar.accessToken': tokens.access_token,
      'googleCalendar.refreshToken': tokens.refresh_token,
      'googleCalendar.tokenExpiry': new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
      'updatedAt': new Date()
    });
  } catch (error) {
    console.error('Error storing user tokens:', error);
    throw error;
  }
};