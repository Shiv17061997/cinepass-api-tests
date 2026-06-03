import { test, expect } from '@playwright/test';
import { APIClient, getJsonResponse } from './config/test-helpers';
import { apiConfig, testData, generateUniqueEmail } from './config/api.config';

let apiClient;
let authToken;
let createdMovieId;
let testEmail;
let testPassword = 'TestPassword123!';

test.beforeAll(async ({ playwright }) => {
  const context = await playwright.request.newContext();
  apiClient = new APIClient(context, apiConfig.BOOKING_SERVICE_URL);

  // Register and login as admin
  testEmail = generateUniqueEmail();
  await apiClient.post('/api/auth/register', {
    email: testEmail,
    password: testPassword,
    name: 'Admin User',
  }, { baseURL: apiConfig.AUTH_SERVICE_URL });

  const loginResponse = await apiClient.post('/api/auth/login', {
    email: testEmail,
    password: testPassword,
  }, { baseURL: apiConfig.AUTH_SERVICE_URL });
  const loginData = await getJsonResponse(loginResponse);
  authToken = loginData.data.token;
  apiClient.setToken(authToken);
});

test.describe('Movies Service - Get Movies', () => {
  test('should get all movies with pagination', async () => {
    const response = await apiClient.get('/api/movies?page=0&size=10&sort=title');

    expect(response.status()).toBe(200);
    const data = await getJsonResponse(response);
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test('should get movies with genre filter', async () => {
    const response = await apiClient.get('/api/movies?genre=Action');

    expect(response.status()).toBe(200);
    const data = await getJsonResponse(response);
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test('should return empty array for non-existent genre', async () => {
    const response = await apiClient.get('/api/movies?genre=NonExistentGenre12345');

    expect(response.status()).toBe(200);
    const data = await getJsonResponse(response);
    expect(Array.isArray(data.data)).toBeTruthy();
    expect(data.data.length).toBe(0);
  });

  test('should handle invalid page number gracefully', async () => {
    const response = await apiClient.get('/api/movies?page=-1&size=10');

    expect([200, 400]).toContain(response.status());
  });

  test('should handle invalid size parameter', async () => {
    const response = await apiClient.get('/api/movies?page=0&size=-5');

    expect([200, 400]).toContain(response.status());
  });
});

test.describe('Movies Service - Get Single Movie', () => {
  test('should get movie by valid ID', async () => {
    const response = await apiClient.get('/api/movies/1');

    if (response.status() === 200) {
      const data = await getJsonResponse(response);
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('title');
    } else {
      expect(response.status()).toBe(404);
    }
  });

  test('should return 404 for non-existent movie ID', async () => {
    const response = await apiClient.get('/api/movies/999999');

    expect(response.status()).toBe(404);
  });

  test('should handle invalid movie ID format', async () => {
    const response = await apiClient.get('/api/movies/invalid-id');

    expect([400, 404]).toContain(response.status());
  });
});

test.describe('Movies Service - Create Movie', () => {
  test('should create a new movie successfully', async () => {
    const movieData = {
      title: `Test Movie ${Date.now()}`,
      genre: 'Sci-Fi',
      duration: 148,
      rating: 'PG-13',
      posterUrl: 'https://example.com/poster.jpg',
      synopsis: 'A test movie synopsis',
      cast: 'Actor 1, Actor 2',
    };

    const response = await apiClient.post('/api/movies', movieData);

    if (response.status() === 201) {
      const data = await getJsonResponse(response);
      expect(data.data).toHaveProperty('id');
      expect(data.data.title).toBe(movieData.title);
      createdMovieId = data.data.id;
    } else {
      expect([201, 200]).toContain(response.status());
    }
  });

  test('should fail creating movie with missing title', async () => {
    const movieData = {
      genre: 'Action',
      duration: 120,
      rating: 'PG-13',
      posterUrl: 'https://example.com/poster.jpg',
      synopsis: 'Test synopsis',
      cast: 'Actor',
    };

    const response = await apiClient.post('/api/movies', movieData);

    expect(response.status()).toBe(400);
  });

  test('should fail creating movie with invalid duration', async () => {
    const movieData = {
      title: `Test Movie ${Date.now()}`,
      genre: 'Comedy',
      duration: -10,
      rating: 'PG',
      posterUrl: 'https://example.com/poster.jpg',
      synopsis: 'Test synopsis',
      cast: 'Actor',
    };

    const response = await apiClient.post('/api/movies', movieData);

    expect(response.status()).toBe(400);
  });

  test('should fail creating movie without authentication', async () => {
    apiClient.setToken(null);
    const movieData = {
      title: `Test Movie ${Date.now()}`,
      genre: 'Action',
      duration: 120,
      rating: 'PG-13',
      posterUrl: 'https://example.com/poster.jpg',
      synopsis: 'Test synopsis',
      cast: 'Actor',
    };

    const response = await apiClient.post('/api/movies', movieData);

    expect(response.status()).toBe(401);
    apiClient.setToken(authToken); // Reset token for other tests
  });
});

test.describe('Movies Service - Update Movie', () => {
  test.beforeAll(async () => {
    const movieData = {
      title: `Movie to Update ${Date.now()}`,
      genre: 'Drama',
      duration: 120,
      rating: 'R',
      posterUrl: 'https://example.com/poster.jpg',
      synopsis: 'Original synopsis',
      cast: 'Original Cast',
    };

    const response = await apiClient.post('/api/movies', movieData);
    if (response.status() === 201 || response.status() === 200) {
      const data = await getJsonResponse(response);
      createdMovieId = data.data.id;
    }
  });

  test('should update an existing movie', async () => {
    if (!createdMovieId) test.skip();

    const updatedData = {
      title: `Movie Updated ${Date.now()}`,
      genre: 'Drama',
      duration: 130,
      rating: 'R',
      posterUrl: 'https://example.com/updated-poster.jpg',
      synopsis: 'Updated synopsis',
      cast: 'Updated Cast',
    };

    const response = await apiClient.put(`/api/movies/${createdMovieId}`, updatedData);

    expect([200, 204]).toContain(response.status());
  });

  test('should fail updating non-existent movie', async () => {
    const updatedData = {
      title: 'Updated Title',
      genre: 'Action',
      duration: 120,
      rating: 'PG-13',
      posterUrl: 'https://example.com/poster.jpg',
      synopsis: 'Updated synopsis',
      cast: 'Actor',
    };

    const response = await apiClient.put('/api/movies/999999', updatedData);

    expect(response.status()).toBe(404);
  });
});

test.describe('Movies Service - Delete Movie', () => {
  test.beforeAll(async () => {
    const movieData = {
      title: `Movie to Delete ${Date.now()}`,
      genre: 'Horror',
      duration: 100,
      rating: 'R',
      posterUrl: 'https://example.com/poster.jpg',
      synopsis: 'Movie to be deleted',
      cast: 'Actor',
    };

    const response = await apiClient.post('/api/movies', movieData);
    if (response.status() === 201 || response.status() === 200) {
      const data = await getJsonResponse(response);
      createdMovieId = data.data.id;
    }
  });

  test('should delete an existing movie', async () => {
    if (!createdMovieId) test.skip();

    const response = await apiClient.delete(`/api/movies/${createdMovieId}`);

    expect([200, 204]).toContain(response.status());
  });

  test('should fail deleting non-existent movie', async () => {
    const response = await apiClient.delete('/api/movies/999999');

    expect(response.status()).toBe(404);
  });
});
