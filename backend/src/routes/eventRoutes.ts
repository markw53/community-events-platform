// backend/src/routes/eventRoutes.ts
import express, { Router } from 'express';
import {
  getEvents,
  getEventById,
  createNewEvent,
  updateExistingEvent,
  deleteExistingEvent
} from '../controllers/eventController';

const router: Router = express.Router();

// Get all events
router.get('/', getEvents);

// Get event by ID
router.get('/:id', getEventById);

// Create a new event
router.post('/', createNewEvent);

// Update an event
router.put('/:id', updateExistingEvent);

// Delete an event
router.delete('/:id', deleteExistingEvent);

export default router;