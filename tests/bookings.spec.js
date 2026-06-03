import { test, expect } from '@playwright/test';
import { APIClient, getJsonResponse } from './config/test-helpers';
import { apiConfig, generateUniqueEmail } from './config/api.config';

let apiClient;
let authToken;
let bookingId;
let showtimeId = 1;
let testEmail;
let testPassword = 'TestPassword123!';

test.beforeAll(async ({ playwright }) => {
  const context = await playwright.request.newContext();
  apiClient = new APIClient(context, apiConfig.BOOKING_SERVICE_URL);

  // Register and login
  testEmail = generateUniqueEmail();
  await apiClient.post('/api/auth/register', {
    email: testEmail,
    password: testPassword,
    name: 'Test User',
  }, { baseURL: apiConfig.AUTH_SERVICE_URL });

  const loginResponse = await apiClient.post('/api/auth/login', {
    email: testEmail,
    password: testPassword,
  }, { baseURL: apiConfig.AUTH_SERVICE_URL });
  const loginData = await getJsonResponse(loginResponse);
  authToken = loginData.data.token;
  apiClient.setToken(authToken);
});

test.describe('Bookings Service - Create Booking', () => {
  test('should create a new booking', async () => {
    const bookingData = {
      showtimeId: showtimeId,
      seatCodes: ['A1', 'A2'],
    };

    const response = await apiClient.post('/api/bookings', bookingData);

    if (response.status() === 201 || response.status() === 200) {
      const data = await getJsonResponse(response);
      expect(data.data).toHaveProperty('bookingId');
      bookingId = data.data.bookingId;
    } else {
      expect([201, 200]).toContain(response.status());
    }
  });

  test('should create booking with single seat', async () => {
    const bookingData = {
      showtimeId: showtimeId,
      seatCodes: ['B5'],
    };

    const response = await apiClient.post('/api/bookings', bookingData);

    if (response.status() === 201 || response.status() === 200) {
      const data = await getJsonResponse(response);
      expect(data.data).toHaveProperty('bookingId');
    } else {
      expect([201, 200]).toContain(response.status());
    }
  });

  test('should create booking with multiple seats', async () => {
    const bookingData = {
      showtimeId: showtimeId,
      seatCodes: ['C1', 'C2', 'C3', 'C4', 'C5'],
    };

    const response = await apiClient.post('/api/bookings', bookingData);

    if (response.status() === 201 || response.status() === 200) {
      const data = await getJsonResponse(response);
      expect(data.data).toHaveProperty('bookingId');
    } else {
      expect([201, 200]).toContain(response.status());
    }
  });

  test('should fail booking with duplicate seat codes', async () => {
    const bookingData = {
      showtimeId: showtimeId,
      seatCodes: ['D1', 'D1'],
    };

    const response = await apiClient.post('/api/bookings', bookingData);

    expect(response.status()).toBe(400);
  });

  test('should fail booking with already occupied seat', async () => {
    // First booking
    await apiClient.post('/api/bookings', {
      showtimeId: showtimeId,
      seatCodes: ['E1'],
    });

    // Try to book same seat
    const response = await apiClient.post('/api/bookings', {
      showtimeId: showtimeId,
      seatCodes: ['E1'],
    });

    expect(response.status()).toBe(409);
  });

  test('should fail booking with empty seat codes', async () => {
    const bookingData = {
      showtimeId: showtimeId,
      seatCodes: [],
    };

    const response = await apiClient.post('/api/bookings', bookingData);

    expect(response.status()).toBe(400);
  });

  test('should fail booking with missing showtime ID', async () => {
    const bookingData = {
      seatCodes: ['F1'],
    };

    const response = await apiClient.post('/api/bookings', bookingData);

    expect(response.status()).toBe(400);
  });

  test('should fail booking with invalid showtime ID', async () => {
    const bookingData = {
      showtimeId: 999999,
      seatCodes: ['G1'],
    };

    const response = await apiClient.post('/api/bookings', bookingData);

    expect(response.status()).toBe(404);
  });

  test('should fail booking without authentication', async () => {
    apiClient.setToken(null);
    const bookingData = {
      showtimeId: showtimeId,
      seatCodes: ['H1'],
    };

    const response = await apiClient.post('/api/bookings', bookingData);

    expect(response.status()).toBe(401);
    apiClient.setToken(authToken); // Reset token
  });
});

test.describe('Bookings Service - Get My Bookings', () => {
  test('should get user bookings', async () => {
    const response = await apiClient.get('/api/bookings/mine');

    expect(response.status()).toBe(200);
    const data = await getJsonResponse(response);
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test('should fail getting bookings without authentication', async () => {
    apiClient.setToken(null);
    const response = await apiClient.get('/api/bookings/mine');

    expect(response.status()).toBe(401);
    apiClient.setToken(authToken); // Reset token
  });

  test('should return bookings for authenticated user only', async () => {
    const response = await apiClient.get('/api/bookings/mine');

    expect(response.status()).toBe(200);
    const data = await getJsonResponse(response);
    // Each booking should belong to the current user
    if (data.data.length > 0) {
      data.data.forEach(booking => {
        expect(booking).toHaveProperty('bookingId');
        expect(booking).toHaveProperty('showtimeId');
      });
    }
  });
});

test.describe('Bookings Service - Cancel Booking', () => {
  test.beforeAll(async () => {
    const bookingData = {
      showtimeId: showtimeId,
      seatCodes: ['I1'],
    };

    const response = await apiClient.post('/api/bookings', bookingData);
    if (response.status() === 201 || response.status() === 200) {
      const data = await getJsonResponse(response);
      bookingId = data.data.bookingId;
    }
  });

  test('should cancel an existing booking', async () => {
    if (!bookingId) test.skip();

    const response = await apiClient.delete(`/api/bookings/${bookingId}`);

    expect([200, 204]).toContain(response.status());
  });

  test('should fail cancelling non-existent booking', async () => {
    const response = await apiClient.delete('/api/bookings/999999');

    expect(response.status()).toBe(404);
  });

  test('should fail cancelling already cancelled booking', async () => {
    if (!bookingId) test.skip();

    await apiClient.delete(`/api/bookings/${bookingId}`);
    const response = await apiClient.delete(`/api/bookings/${bookingId}`);

    expect(response.status()).toBe(404);
  });

  test('should fail cancelling booking without authentication', async () => {
    apiClient.setToken(null);
    const response = await apiClient.delete('/api/bookings/1');

    expect(response.status()).toBe(401);
    apiClient.setToken(authToken); // Reset token
  });
});

test.describe('Bookings Service - Cross-User Isolation', () => {
  test('should not allow user to cancel another users booking', async () => {
    // Create booking with first user
    const booking1Data = {
      showtimeId: showtimeId,
      seatCodes: ['J1'],
    };
    const booking1Response = await apiClient.post('/api/bookings', booking1Data);
    const booking1 = await getJsonResponse(booking1Response);

    // Login as second user
    const testEmail2 = generateUniqueEmail();
    await apiClient.post('/api/auth/register', {
      email: testEmail2,
      password: testPassword,
      name: 'Test User 2',
    }, { baseURL: apiConfig.AUTH_SERVICE_URL });

    const login2Response = await apiClient.post('/api/auth/login', {
      email: testEmail2,
      password: testPassword,
    }, { baseURL: apiConfig.AUTH_SERVICE_URL });
    const login2Data = await getJsonResponse(login2Response);
    apiClient.setToken(login2Data.data.token);

    // Try to cancel first user's booking
    const response = await apiClient.delete(`/api/bookings/${booking1.data.bookingId}`);

    expect(response.status()).toBe(403);
    apiClient.setToken(authToken); // Reset to original user
  });
});
