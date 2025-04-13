// src/models/Event.ts
import { firestore } from '../config/firebase-admin';
import { DocumentData } from 'firebase-admin/firestore';

export interface IEvent {
  id?: string;
  title: string;
  description: string;
  startDate: Date | string;
  endDate: Date | string;
  location: string;
  organiser: string; // User ID
  category: string;
  imageUrl?: string;
  capacity?: number;
  attendees: string[]; // Array of User IDs
  googleCalendarEventId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const eventsCollection = firestore.collection('events');

// Get all events
export const getAllEvents = async (): Promise<IEvent[]> => {
  const snapshot = await eventsCollection.get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as IEvent[];
};

// Get event by ID
export const getEventById = async (id: string): Promise<IEvent | null> => {
  const doc = await eventsCollection.doc(id).get();
  if (!doc.exists) return null;
  
  return {
    id: doc.id,
    ...doc.data()
  } as IEvent;
};

// Create event
export const createEvent = async (eventData: Omit<IEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<IEvent> => {
  const now = new Date();
  
  const newEvent = {
    ...eventData,
    attendees: eventData.attendees || [],
    createdAt: now,
    updatedAt: now
  };
  
  const docRef = await eventsCollection.add(newEvent);
  const doc = await docRef.get();
  
  return {
    id: doc.id,
    ...doc.data()
  } as IEvent;
};

// Update event
export const updateEvent = async (id: string, eventData: Partial<IEvent>): Promise<IEvent | null> => {
  const now = new Date();
  
  const updates = {
    ...eventData,
    updatedAt: now
  };
  
  await eventsCollection.doc(id).update(updates);
  
  return getEventById(id);
};

// Delete event
export const deleteEvent = async (id: string): Promise<boolean> => {
  await eventsCollection.doc(id).delete();
  return true;
};

// Register for event
export const registerForEvent = async (eventId: string, userId: string): Promise<boolean> => {
  const eventRef = eventsCollection.doc(eventId);
  
  // Use a transaction to ensure data consistency
  await firestore.runTransaction(async (transaction) => {
    const eventDoc = await transaction.get(eventRef);
    
    if (!eventDoc.exists) {
      throw new Error('Event not found');
    }
    
    const eventData = eventDoc.data() as DocumentData;
    const attendees = eventData.attendees || [];
    
    // Check if user is already registered
    if (attendees.includes(userId)) {
      throw new Error('User already registered for this event');
    }
    
    // Check if event is at capacity
    if (eventData.capacity && attendees.length >= eventData.capacity) {
      throw new Error('Event is at full capacity');
    }
    
    // Add user to attendees
    transaction.update(eventRef, {
      attendees: [...attendees, userId],
      updatedAt: new Date()
    });
  });
  
  return true;
};