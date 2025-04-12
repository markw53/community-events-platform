// src/models/User.ts
import { firestore } from '../config/firebase-admin';

export interface IUser {
  id?: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'staff' | 'admin';
  createdEvents?: string[]; // Array of Event IDs
  attendingEvents?: string[]; // Array of Event IDs
  googleCalendar?: {
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: Date | string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

const usersCollection = firestore.collection('users');

// Get user by Firebase UID
export const getUserByFirebaseUid = async (firebaseUid: string): Promise<IUser | null> => {
  const snapshot = await usersCollection.where('firebaseUid', '==', firebaseUid).limit(1).get();
  
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  } as IUser;
};

// Get user by ID
export const getUserById = async (id: string): Promise<IUser | null> => {
  const doc = await usersCollection.doc(id).get();
  
  if (!doc.exists) return null;
  
  return {
    id: doc.id,
    ...doc.data()
  } as IUser;
};

// Create or update user
export const createOrUpdateUser = async (userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> => {
  const now = new Date();
  
  // Check if user exists
  const existingUser = await getUserByFirebaseUid(userData.firebaseUid);
  
  if (existingUser) {
    // Update existing user
    const updates = {
      ...userData,
      updatedAt: now
    };
    
    await usersCollection.doc(existingUser.id!).update(updates);
    return getUserById(existingUser.id!) as Promise<IUser>;
  } else {
    // Create new user
    const newUser = {
      ...userData,
      createdEvents: userData.createdEvents || [],
      attendingEvents: userData.attendingEvents || [],
      createdAt: now,
      updatedAt: now
    };
    
    const docRef = await usersCollection.add(newUser);
    const doc = await docRef.get();
    
    return {
      id: doc.id,
      ...doc.data()
    } as IUser;
  }
};

// Update user role
export const updateUserRole = async (id: string, role: 'user' | 'staff' | 'admin'): Promise<IUser | null> => {
  await usersCollection.doc(id).update({
    role,
    updatedAt: new Date()
  });
  
  return getUserById(id);
};

// Add event to user's created events
export const addCreatedEvent = async (userId: string, eventId: string): Promise<boolean> => {
  const userRef = usersCollection.doc(userId);
  
  await firestore.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data() as any;
    const createdEvents = userData.createdEvents || [];
    
    if (!createdEvents.includes(eventId)) {
      transaction.update(userRef, {
        createdEvents: [...createdEvents, eventId],
        updatedAt: new Date()
      });
    }
  });
  
  return true;
};

// Add event to user's attending events
export const addAttendingEvent = async (userId: string, eventId: string): Promise<boolean> => {
  const userRef = usersCollection.doc(userId);
  
  await firestore.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data() as any;
    const attendingEvents = userData.attendingEvents || [];
    
    if (!attendingEvents.includes(eventId)) {
      transaction.update(userRef, {
        attendingEvents: [...attendingEvents, eventId],
        updatedAt: new Date()
      });
    }
  });
  
  return true;
};