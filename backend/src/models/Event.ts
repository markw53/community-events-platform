export interface Event {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    location: string;
    imageUrl?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  }
  
  // For now, we'll use an in-memory array to store events
  // In a real application, you would use a database
  let events: Event[] = [
    {
      id: '1',
      title: 'Community Cleanup Day',
      description: 'Join us for a day of cleaning up our local parks and streets. Bring gloves and comfortable shoes!',
      startTime: '2023-12-15T09:00:00.000Z',
      endTime: '2023-12-15T12:00:00.000Z',
      location: 'Central Park',
      imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b',
      createdBy: 'admin',
      createdAt: '2023-11-01T12:00:00.000Z',
      updatedAt: '2023-11-01T12:00:00.000Z'
    },
    {
      id: '2',
      title: 'Farmers Market',
      description: 'Weekly farmers market featuring local produce, crafts, and food vendors.',
      startTime: '2023-12-16T08:00:00.000Z',
      endTime: '2023-12-16T13:00:00.000Z',
      location: 'Town Square',
      imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9',
      createdBy: 'admin',
      createdAt: '2023-11-02T10:00:00.000Z',
      updatedAt: '2023-11-02T10:00:00.000Z'
    },
    {
      id: '3',
      title: 'Community Workshop: Basic Gardening',
      description: 'Learn the basics of gardening and how to start your own vegetable garden at home.',
      startTime: '2023-12-18T18:00:00.000Z',
      endTime: '2023-12-18T20:00:00.000Z',
      location: 'Community Center',
      imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae',
      createdBy: 'admin',
      createdAt: '2023-11-03T09:00:00.000Z',
      updatedAt: '2023-11-03T09:00:00.000Z'
    }
  ];
  
  // Event service functions
  export const getAllEvents = (): Event[] => {
    return events;
  };
  
  export const getEventById = (id: string): Event | undefined => {
    return events.find(event => event.id === id);
  };
  
  export const createEvent = (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Event => {
    const newEvent: Event = {
      ...eventData,
      id: Date.now().toString(), // Simple ID generation
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    events.push(newEvent);
    return newEvent;
  };
  
  export const updateEvent = (id: string, eventData: Partial<Event>): Event | null => {
    const index = events.findIndex(event => event.id === id);
    
    if (index === -1) {
      return null;
    }
    
    const updatedEvent: Event = {
      ...events[index],
      ...eventData,
      updatedAt: new Date().toISOString()
    };
    
    events[index] = updatedEvent;
    return updatedEvent;
  };
  
  export const deleteEvent = (id: string): boolean => {
    const initialLength = events.length;
    events = events.filter(event => event.id !== id);
    return events.length !== initialLength;
  };