import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Parse MongoDB connection details from environment variables
const getMongoURI = (): string => {
  // If a full URI is provided, use it directly
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  
  // Otherwise, build the URI from components
  const username = encodeURIComponent(process.env.MONGO_USERNAME || '');
  const password = encodeURIComponent(process.env.MONGO_PASSWORD || '');
  const cluster = process.env.MONGO_CLUSTER || '';
  const dbName = process.env.MONGO_DB_NAME || 'community-events';
  const options = 'retryWrites=true&w=majority';
  
  return `mongodb+srv://${username}:${password}@${cluster}.mongodb.net/${dbName}?${options}`;
};

// Connection options
const connectionOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  maxPoolSize: 10, // Maintain up to 10 socket connections
};

// Connect to MongoDB
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = getMongoURI();
    
    // Set up connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.log(`Mongoose connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected');
    });
    
    // Close the Mongoose connection when the Node process ends
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Mongoose connection closed due to app termination');
      process.exit(0);
    });
    
    // Connect to the database
    const conn = await mongoose.connect(mongoURI, connectionOptions);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Ping database to verify connection
    if (mongoose.connection.db) {
      await mongoose.connection.db?.admin().ping();
    } else {
      throw new Error('Database connection is not established.');
    }
    console.log('Database ping successful');
    
  } catch (error) {
    console.error('MongoDB connection error:');
    if (error instanceof Error) {
      console.error(`Name: ${error.name}`);
      console.error(`Message: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
    } else {
      console.error(error);
    }
    
    // Exit with failure in production, but maybe don't exit in development
    if (process.env.NODE_ENV === 'production') {
      console.error('Exiting due to MongoDB connection failure');
      process.exit(1);
    }
  }
};

// Function to check if the database connection is healthy
export const checkDBConnection = async (): Promise<boolean> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      return false;
    }
    
    // Ping the database
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
    } else {
      throw new Error('Database connection is not established.');
    }
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

export default connectDB;