import { test, expect } from './config/test-helpers.js';
import { API_CONFIG, TEST_DATA } from './config/api.config.js';

test.describe('Movies Service Tests', () => {
  let authToken;
  let movieId;

  test.beforeEach(async ({ apiClient }) => {
    const email = `movie-test-${Date.now()}@example.com`;
    const registerRes = await apiClient.request('POST', `${API_CONFIG.AUTH_SERVICE_URL}/api/auth/register`, {
      data: {
        email,
        password: TEST_DATA.user.password,
        name: TEST_DATA.user.name,
      },
    });

    authToken = registerRes.data.data.token;
    apiClient.setToken(authToken);
  });

  test.describe('Get Movies', () => {
    test('should get all movies with pagination', async ({ apiClient }) => {
      const response = await apiClient.request('GET', `${API_CONFIG.BOOKING_SERVICE_URL}/api/movies?page=0&size=10&sort=title`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    test('should filter movies by genre', async ({ apiClient }) => {
      const response = await apiClient.request('GET', `${API_CONFIG.BOOKING_SERVICE_URL}/api/movies?genre=Action`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
    });

    test('should support pagination with different page sizes', async ({ apiClient }) => {
      const page1 = await apiClient.request('GET', `${API_CONFIG.BOOKING_SERVICE_URL}/api/movies?page=0&size=5`);
      const page2 = await apiClient.request('GET', `${API_CONFIG.BOOKING_SERVICE_URL}/api/movies?page=1&size=5`);

      expect(page1.status).toBe(200);
      expect(page2.status).toBe(200);
    });
  });

  test.describe('Get Movie by ID', () => {
    test('should get movie details by valid ID', async ({ apiClient }) => {
      const createRes = await apiClient.request('POST', `${API_CONFIG.BOOKING_SERVICE_URL}/api/movies`, {
        data: TEST_DATA.movie,
      });

      movieId = createRes.data.data.id;

      const response = await apiClient.request('GET', `${API_CONFIG.BOOKING_SERVICE_URL}/api/movies/${movieId}`);

      expect(response.status).toBe(200);
      expect(response.data.data.id).toBe(movieId);
    });

    test('should return 404 for non-existent movie ID', async ({ apiClient }) => {
      const response = await apiClient.request('GET', `${API_CONFIG.BOOKING_SERVICE_URL}/api/movies/999999`);

      expect(response.status).toBe(404);
    });
  });

  test.describe('Create Movie (Admin)', () => {
    test('should create movie successfully with valid data', async ({ apiClient }) => {
      const movieData = {
        ...TEST_DATA.movie,
        title: `Movie-${Date.now()}`,
      };

      const response = await apiClient.request('POST', `${API_CONFIG.BOOKING_SERVICE_URL}/api/movies`, {
        data: movieData,
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('data.id');
      movieId = response.data.data.id;
    });

    test('should fail creating movie without auth token', async ({ apiClient }) => {
      apiClient.setToken(null);
      const response = await apiClient.request('POST', `${API_CONFIG.BOOKING_SERVICE_URL}/api/movies`, {
        data: TEST_DATA.movie,
      });

      expect(response.status).toBe(401);
    });

    test('should fail creating movie with invalid duration', async ({ apiClient }) => {
      const invalidMovie = {
        ...TEST_DATA.movie,
        duration: -10,
      };

      const response = await apiClient.request('POST', `${API_CONFIG.BOOKING_SERVICE_URL}/api/movies`, {
        data: invalidMovie,
      });

      expect(response.status).toBe(400);
    });
  });

  test.describe('Update Movie (Admin)', () => {
    test('should update movie successfully', async ({ apiClient }) => {
      const createRes = await apiClient.request('POST', `${API_CONFIG.BOOKING_SERVICE_URL}/api/movies`, {
        data: TEST_DATA.movie,
      });

      movieId = createRes.data.data.id;

      const updatedData = {
        ...TEST_DATA.movie,
        title: `Updated-${Date.now()}`,
      };

      const response = await apiClient.request('PUT', `${API_CONFIG.BOOKING_SERVICE_URL}/api/movies/${movieId}`, {
        data: updatedData,
      });

      expect(response.status).toBe(200);
    });

    test('should fail updating non-existent movie', async ({ apiClient }) => {
      const response = await apiClient.request('PUT', `${API_CONFIG.BOOKING_SERVICE_URL}/api/movies/999999`, {
        data: TEST_DATA.movie,
      });

      expect(response.status).toBe(404);
    });
  });

  test.describe('Delete Movie (Admin)', () => {
    test('should delete movie successfully', async ({ apiClient }) => {
      const createRes = await apiClient.request('POST', `${API_CONFIG.BOOKING_SERVICE_URL}/api/movies`, {
        data: TEST_DATA.movie,
      });

      movieId = createRes.data.data.id;

      const response = await apiClient.request('DELETE', `${API_CONFIG.BOOKING_SERVICE_URL}/api/movies/${movieId}`);

      expect(response.status).toBe(204);

      const getRes = await apiClient.request('GET', `${API_CONFIG.BOOKING_SERVICE_URL}/api/movies/${movieId}`);
      expect(getRes.status).toBe(404);
    });

    test('should fail deleting non-existent movie', async ({ apiClient }) => {
      const response = await apiClient.request('DELETE', `${API_CONFIG.BOOKING_SERVICE_URL}/api/movies/999999`);

      expect(response.status).toBe(404);
    });
  });
});
