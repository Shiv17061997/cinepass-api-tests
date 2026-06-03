import dotenv from 'dotenv';

dotenv.config();

export const apiConfig = {
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:8081',
  BOOKING_SERVICE_URL: process.env.BOOKING_SERVICE_URL || 'http://localhost:8082',
};

export const testData = {
  user: {
    email: process.env.TEST_USER_EMAIL || 'testuser@example.com',
    password: process.env.TEST_USER_PASSWORD || 'password123',
    name: process.env.TEST_USER_NAME || 'Test User',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'adminpass123',
  },
};

export const generateUniqueEmail = () => {
  return `testuser_${Date.now()}@example.com`;
};

export const generateUniqueUsername = () => {
  return `testuser_${Date.now()}`;
};
