// src/config/firebase-admin.ts
import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Path to service account file
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
  path.join(__dirname, '../config/service-account.json');

let serviceAccount;

// Try to load service account from file
try {
  if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    serviceAccount = require(SERVICE_ACCOUNT_PATH);
  }
} catch (error) {
  console.error('Error loading service account file:', error);
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  // If service account file exists, use it
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } 
  // Otherwise use environment variables or application default credentials
  else {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
      // If running on Google Cloud, this will use the default service account
      credential: admin.credential.applicationDefault()
    });
  }
}

const firestore = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

export { admin, firestore, auth, storage };