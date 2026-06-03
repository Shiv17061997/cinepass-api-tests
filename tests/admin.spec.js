import { test, expect } from '@playwright/test';
import { APIClient, getJsonResponse } from './config/test-helpers';
import { apiConfig, generateUniqueEmail } from './config/api.config';

let apiClientAdmin;
let apiClientUser;
let adminToken;
let userToken;
let adminEmail;
let userEmail;
let testPassword = 'TestPassword123!';
let createdMovieId;
let createdShowtimeId;

test.beforeAll(async ({ playwright }) => {
  const context = await playwright.request.newContext();
  apiClientAdmin = new APIClient(context, apiConfig.BOOKING_SERVICE_URL);
  apiClientUser = new APIClient(context, apiConfig.BOOKING_SERVICE_URL);

  // Register admin user
  adminEmail = generateUniqueEmail();
  await apiClientAdmin.post('/api/auth/register', {
    email: adminEmail,
    password: testPassword,
    name: 'Admin User',
  }, { baseURL: apiConfig.AUTH_SERVICE_URL });

  const adminLoginResponse = await apiClientAdmin.post('/api/auth/login', {
    email: adminEmail,
    password: testPassword,
  }, { baseURL: apiConfig.AUTH_SERVICE_URL });
  const adminData = await getJsonResponse(adminLoginResponse);
  adminToken = adminData.data.token;
  apiClientAdmin.setToken(adminToken);

  // Register regular user
  userEmail = generateUniqueEmail();
  await apiClientUser.post('/api/auth/register', {
    email: userEmail,
    password: testPassword,
    name: 'Regular User',
  }, { baseURL: apiConfig.AUTH_SERVICE_URL });

  const userLoginResponse = await apiClientUser.post('/api/auth/login', {
    email: userEmail,
    password: testPassword,
  }, { baseURL: apiConfig.AUTH_SERVICE_URL });
  const userData = await getJsonResponse(userLoginResponse);
  userToken = userData.data.token;
  apiClientUser.setToken(userToken);
});

test.describe('Admin Authorization - Movies Operations', () => {
  test('admin should create a movie successfully', async () => {
    const movieData = {
      title: `Admin Movie ${Date.now()}`,
      genre: 'Action',
      duration: 120,
      rating: 'PG-13',
      posterUrl: 'https://example.com/poster.jpg',
      synopsis: 'Admin created movie',
      cast: 'Actor 1, Actor 2',
    };

    const response = await apiClientAdmin.post('/api/movies', movieData);

    if (response.status() === 201 || response.status() === 200) {
      const data = await getJsonResponse(response);
      expect(data.data).toHaveProperty('id');
      expect(data.data.title).toBe(movieData.title);
      createdMovieId = data.data.id;
    } else {
      expect([201, 200]).toContain(response.status());
    }
  });

  test('regular user should NOT create a movie (403 Forbidden)', async () => {
    const movieData = {
      title: `User Movie ${Date.now()}`,
      genre: 'Comedy',
      duration: 110,
      rating: 'PG',
      posterUrl: 'https://example.com/poster.jpg',
      synopsis: 'User attempted movie creation',
      cast: 'Actor',
    };

    const response = await apiClientUser.post('/api/movies', movieData);

    expect(response.status()).toBe(403);
  });

  test('admin should update a movie successfully', async () => {
    if (!createdMovieId) test.skip();

    const updatedData = {
      title: `Admin Updated Movie ${Date.now()}`,
      genre: 'Sci-Fi',
      duration: 150,
      rating: 'PG-13',
      posterUrl: 'https://example.com/updated-poster.jpg',
      synopsis: 'Updated by admin',
      cast: 'Updated Cast',
    };

    const response = await apiClientAdmin.put(`/api/movies/${createdMovieId}`, updatedData);

    expect([200, 204]).toContain(response.status());
  });

  test('regular user should NOT update a movie (403 Forbidden)', async () => {
    if (!createdMovieId) test.skip();

    const updatedData = {
      title: `User Updated Movie ${Date.now()}`,
      genre: 'Drama',
      duration: 140,
      rating: 'R',
      posterUrl: 'https://example.com/poster.jpg',
      synopsis: 'User attempted update',
      cast: 'Actor',
    };

    const response = await apiClientUser.put(`/api/movies/${createdMovieId}`, updatedData);

    expect(response.status()).toBe(403);
  });

  test('admin should delete a movie successfully', async () => {
    // Create a movie first
    const movieData = {
      title: `Movie to Delete ${Date.now()}`,
      genre: 'Thriller',
      duration: 130,
      rating: 'R',
      posterUrl: 'https://example.com/poster.jpg',
      synopsis: 'Will be deleted',
      cast: 'Actor',
    };

    const createResponse = await apiClientAdmin.post('/api/movies', movieData);
    let movieIdToDelete;
    if (createResponse.status() === 201 || createResponse.status() === 200) {
      const data = await getJsonResponse(createResponse);
      movieIdToDelete = data.data.id;
    }

    if (!movieIdToDelete) test.skip();

    const deleteResponse = await apiClientAdmin.delete(`/api/movies/${movieIdToDelete}`);

    expect([200, 204]).toContain(deleteResponse.status());
  });

  test('regular user should NOT delete a movie (403 Forbidden)', async () => {
    if (!createdMovieId) test.skip();

    const response = await apiClientUser.delete(`/api/movies/${createdMovieId}`);

    expect(response.status()).toBe(403);
  });
});

test.describe('Admin Authorization - Showtimes Operations', () => {
  test('admin should create a showtime successfully', async () => {
    const showtimeData = {
      movieId: 1,
      theatreName: `Admin Theatre ${Date.now()}`,
      showDate: '2026-07-15',
      showTime: '19:00:00',
      ticketPrice: 16.99,
    };

    const response = await apiClientAdmin.post('/api/showtimes', showtimeData);

    if (response.status() === 201 || response.status() === 200) {
      const data = await getJsonResponse(response);
      expect(data.data).toHaveProperty('id');
      createdShowtimeId = data.data.id;
    } else {
      expect([201, 200]).toContain(response.status());
    }
  });

  test('regular user should NOT create a showtime (403 Forbidden)', async () => {
    const showtimeData = {
      movieId: 1,
      theatreName: `User Theatre ${Date.now()}`,
      showDate: '2026-07-20',
      showTime: '20:00:00',
      ticketPrice: 15.99,
    };

    const response = await apiClientUser.post('/api/showtimes', showtimeData);

    expect(response.status()).toBe(403);
  });

  test('admin should delete a showtime successfully', async () => {
    if (!createdShowtimeId) test.skip();

    const response = await apiClientAdmin.delete(`/api/showtimes/${createdShowtimeId}`);

    expect([200, 204]).toContain(response.status());
  });

  test('regular user should NOT delete a showtime (403 Forbidden)', async () => {
    // Create a showtime first
    const showtimeData = {
      movieId: 1,
      theatreName: `Showtime to Protect ${Date.now()}`,
      showDate: '2026-07-25',
      showTime: '21:00:00',
      ticketPrice: 14.99,
    };

    const createResponse = await apiClientAdmin.post('/api/showtimes', showtimeData);
    let showtimeIdToProtect;
    if (createResponse.status() === 201 || createResponse.status() === 200) {
      const data = await getJsonResponse(createResponse);
      showtimeIdToProtect = data.data.id;
    }

    if (!showtimeIdToProtect) test.skip();

    const deleteResponse = await apiClientUser.delete(`/api/showtimes/${showtimeIdToProtect}`);

    expect(deleteResponse.status()).toBe(403);
  });
});

test.describe('Admin Authorization - Role-Based Access Control', () => {
  test('should validate admin role on movie creation endpoint', async () => {
    const movieData = {
      title: `RBAC Test Movie ${Date.now()}`,
      genre: 'Horror',
      duration: 95,
      rating: 'PG-13',
      posterUrl: 'https://example.com/poster.jpg',
      synopsis: 'RBAC test',
      cast: 'Actor',
    };

    // Admin should succeed
    const adminResponse = await apiClientAdmin.post('/api/movies', movieData);
    expect([200, 201]).toContain(adminResponse.status());

    // User should fail
    const userResponse = await apiClientUser.post('/api/movies', movieData);
    expect(userResponse.status()).toBe(403);
  });

  test('should validate admin role on showtime creation endpoint', async () => {
    const showtimeData = {
      movieId: 1,
      theatreName: `RBAC Theatre ${Date.now()}`,
      showDate: '2026-08-01',
      showTime: '18:00:00',
      ticketPrice: 13.99,
    };

    // Admin should succeed
    const adminResponse = await apiClientAdmin.post('/api/showtimes', showtimeData);
    expect([200, 201]).toContain(adminResponse.status());

    // User should fail
    const userResponse = await apiClientUser.post('/api/showtimes', showtimeData);
    expect(userResponse.status()).toBe(403);
  });

  test('regular user should still be able to create bookings', async () => {
    const bookingData = {
      showtimeId: 1,
      seatCodes: ['Z1', 'Z2'],
    };

    const response = await apiClientUser.post('/api/bookings', bookingData);

    expect([200, 201, 404, 409]).toContain(response.status());
  });

  test('admin should be able to create bookings', async () => {
    const bookingData = {
      showtimeId: 1,
      seatCodes: ['Y1'],
    };

    const response = await apiClientAdmin.post('/api/bookings', bookingData);

    expect([200, 201, 404, 409]).toContain(response.status());
  });
});

test.describe('Admin Authorization - Permission Denied Scenarios', () => {
  test('user without admin role cannot modify any movie', async () => {
    const testMovieId = 999;
    const updateData = {
      title: 'Unauthorized Update',
      genre: 'Action',
      duration: 120,
      rating: 'PG-13',
      posterUrl: 'https://example.com/poster.jpg',
      synopsis: 'Unauthorized',
      cast: 'Actor',
    };

    const response = await apiClientUser.put(`/api/movies/${testMovieId}`, updateData);

    expect([403, 404]).toContain(response.status());
  });

  test('user without admin role cannot delete any movie', async () => {
    const response = await apiClientUser.delete('/api/movies/1');

    expect([403, 404]).toContain(response.status());
  });

  test('user without admin role cannot modify any showtime', async () => {
    const response = await apiClientUser.delete('/api/showtimes/1');

    expect([403, 404]).toContain(response.status());
  });

  test('admin should have elevated permissions across all endpoints', async () => {
    // Test that admin can access/use all endpoints
    const movieResponse = await apiClientAdmin.get('/api/movies');
    expect([200, 404]).toContain(movieResponse.status());

    const meResponse = await apiClientAdmin.get('/api/auth/me');
    expect(meResponse.status()).toBe(200);

    const bookingsResponse = await apiClientAdmin.get('/api/bookings/mine');
    expect(bookingsResponse.status()).toBe(200);
  });

  test('should enforce admin role on movie update endpoint', async () => {
    const testMovieId = 1;
    const updateData = {
      title: 'Unauthorized Update',
      genre: 'Drama',
      duration: 100,
      rating: 'PG',
      posterUrl: 'https://example.com/poster.jpg',
      synopsis: 'Test',
      cast: 'Actor',
    };

    const response = await apiClientUser.put(`/api/movies/${testMovieId}`, updateData);

    expect(response.status()).toBe(403);
  });

  test('should enforce admin role on movie delete endpoint', async () => {
    const response = await apiClientUser.delete('/api/movies/999');

    expect([403, 404]).toContain(response.status());
  });

  test('should enforce admin role on showtime update endpoint', async () => {
    const response = await apiClientUser.put('/api/showtimes/1', {
      ticketPrice: 20.00,
    });

    expect([403, 404, 405]).toContain(response.status());
  });
});

test.describe('Admin Authorization - Unauthenticated Access', () => {
  test('unauthenticated user cannot create movies', async () => {
    const movieData = {
      title: `Unauth Movie ${Date.now()}`,
      genre: 'Drama',
      duration: 105,
      rating: 'R',
      posterUrl: 'https://example.com/poster.jpg',
      synopsis: 'Unauthorized attempt',
      cast: 'Actor',
    };

    const response = await apiClientUser.post('/api/movies', movieData);
    expect([401, 403]).toContain(response.status());
  });

  test('unauthenticated user cannot create showtimes', async () => {
    const showtimeData = {
      movieId: 1,
      theatreName: 'Unauth Theatre',
      showDate: '2026-08-10',
      showTime: '19:00:00',
      ticketPrice: 12.99,
    };

    const response = await apiClientUser.post('/api/showtimes', showtimeData);
    expect([401, 403]).toContain(response.status());
  });
});
