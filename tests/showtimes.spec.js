import { test, expect } from '@playwright/test';
import { APIClient, getJsonResponse } from './config/test-helpers';
import { apiConfig, generateUniqueEmail } from './config/api.config';

let apiClient;
let authToken;
let movieId = 1;
let showtimeId;
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

test.describe('Showtimes Service - Get Showtimes', () => {
  test('should get showtimes for a movie', async () => {
    const response = await apiClient.get(`/api/movies/${movieId}/showtimes`);

    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const data = await getJsonResponse(response);
      expect(Array.isArray(data.data)).toBeTruthy();
    }
  });

  test('should return 404 for non-existent movie', async () => {
    const response = await apiClient.get('/api/movies/999999/showtimes');

    expect(response.status()).toBe(404);
  });

  test('should handle invalid movie ID', async () => {
    const response = await apiClient.get('/api/movies/invalid/showtimes');

    expect([400, 404]).toContain(response.status());
  });
});

test.describe('Showtimes Service - Get Seat Availability', () => {
  test('should get seat availability for showtime', async () => {
    const response = await apiClient.get('/api/showtimes/1/seats');

    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const data = await getJsonResponse(response);
      expect(data.data).toBeDefined();
    }
  });

  test('should return 404 for non-existent showtime', async () => {
    const response = await apiClient.get('/api/showtimes/999999/seats');

    expect(response.status()).toBe(404);
  });

  test('should handle invalid showtime ID', async () => {
    const response = await apiClient.get('/api/showtimes/invalid/seats');

    expect([400, 404]).toContain(response.status());
  });
});

test.describe('Showtimes Service - Create Showtime', () => {
  test('should create a new showtime', async () => {
    const showtimeData = {
      movieId: movieId,
      theatreName: 'IMAX Theatre 1',
      showDate: '2026-06-15',
      showTime: '19:00:00',
      ticketPrice: 15.99,
    };

    const response = await apiClient.post('/api/showtimes', showtimeData);

    if (response.status() === 201 || response.status() === 200) {
      const data = await getJsonResponse(response);
      expect(data.data).toHaveProperty('id');
      showtimeId = data.data.id;
    } else {
      expect([201, 200]).toContain(response.status());
    }
  });

  test('should fail creating showtime with missing movieId', async () => {
    const showtimeData = {
      theatreName: 'Theatre 1',
      showDate: '2026-06-15',
      showTime: '19:00:00',
      ticketPrice: 15.99,
    };

    const response = await apiClient.post('/api/showtimes', showtimeData);

    expect(response.status()).toBe(400);
  });

  test('should fail creating showtime with invalid ticket price', async () => {
    const showtimeData = {
      movieId: movieId,
      theatreName: 'Theatre 1',
      showDate: '2026-06-15',
      showTime: '19:00:00',
      ticketPrice: -5,
    };

    const response = await apiClient.post('/api/showtimes', showtimeData);

    expect(response.status()).toBe(400);
  });

  test('should fail creating showtime with past date', async () => {
    const showtimeData = {
      movieId: movieId,
      theatreName: 'Theatre 1',
      showDate: '2020-01-01',
      showTime: '19:00:00',
      ticketPrice: 15.99,
    };

    const response = await apiClient.post('/api/showtimes', showtimeData);

    expect(response.status()).toBe(400);
  });

  test('should fail creating showtime without authentication', async () => {
    apiClient.setToken(null);
    const showtimeData = {
      movieId: movieId,
      theatreName: 'Theatre 1',
      showDate: '2026-06-15',
      showTime: '19:00:00',
      ticketPrice: 15.99,
    };

    const response = await apiClient.post('/api/showtimes', showtimeData);

    expect(response.status()).toBe(401);
    apiClient.setToken(authToken); // Reset token
  });
});

test.describe('Showtimes Service - Delete Showtime', () => {
  test.beforeAll(async () => {
    const showtimeData = {
      movieId: movieId,
      theatreName: `Theatre ${Date.now()}`,
      showDate: '2026-06-20',
      showTime: '20:00:00',
      ticketPrice: 14.99,
    };

    const response = await apiClient.post('/api/showtimes', showtimeData);
    if (response.status() === 201 || response.status() === 200) {
      const data = await getJsonResponse(response);
      showtimeId = data.data.id;
    }
  });

  test('should delete an existing showtime', async () => {
    if (!showtimeId) test.skip();

    const response = await apiClient.delete(`/api/showtimes/${showtimeId}`);

    expect([200, 204]).toContain(response.status());
  });

  test('should fail deleting non-existent showtime', async () => {
    const response = await apiClient.delete('/api/showtimes/999999');

    expect(response.status()).toBe(404);
  });
});
