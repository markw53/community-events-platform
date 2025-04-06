import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

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

// Google Calendar API credentials
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';

// Scopes for Google Calendar API
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Create OAuth2 client
const createOAuth2Client = (): OAuth2Client => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
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

// Create calendar client with tokens
const createCalendarClient = (tokens: any): calendar_v3.Calendar => {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(tokens);
  
  return google.calendar({ version: 'v3', auth: oauth2Client });
};

// Add event to user's calendar
export const addEventToCalendar = async (
  tokens: any,
  eventData: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    location: string;
  }
) => {
  try {
    const calendar = createCalendarClient(tokens);
    
    const event = {
      summary: eventData.title,
      description: eventData.description,
      start: {
        dateTime: eventData.startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: eventData.endTime,
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
export const listCalendarEvents = async (tokens: any) => {
  try {
    const calendar = createCalendarClient(tokens);
    
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