import { test, expect } from '@playwright/test';
import { APIClient, getJsonResponse } from './config/test-helpers';
import { apiConfig, testData, generateUniqueEmail } from './config/api.config';

let apiClient;
let authToken;
let testEmail;
let testPassword = 'TestPassword123!';

test.beforeAll(async ({ playwright }) => {
  const context = await playwright.request.newContext();
  apiClient = new APIClient(context, apiConfig.AUTH_SERVICE_URL);
});

test.describe('Auth Service - Registration', () => {
  test('should register a new user with valid credentials', async () => {
    testEmail = generateUniqueEmail();
    const response = await apiClient.post('/api/auth/register', {
      email: testEmail,
      password: testPassword,
      name: 'Test User',
    });

    expect(response.status()).toBe(201);
    const data = await getJsonResponse(response);
    expect(data.data).toHaveProperty('userId');
    expect(data.data.email).toBe(testEmail);
  });

  test('should fail registration with duplicate email', async () => {
    testEmail = generateUniqueEmail();
    await apiClient.post('/api/auth/register', {
      email: testEmail,
      password: testPassword,
      name: 'Test User 1',
    });

    const response = await apiClient.post('/api/auth/register', {
      email: testEmail,
      password: testPassword,
      name: 'Test User 2',
    });

    expect(response.status()).toBe(409);
  });

  test('should fail registration with missing email', async () => {
    const response = await apiClient.post('/api/auth/register', {
      password: testPassword,
      name: 'Test User',
    });

    expect(response.status()).toBe(400);
  });

  test('should fail registration with missing password', async () => {
    const response = await apiClient.post('/api/auth/register', {
      email: generateUniqueEmail(),
      name: 'Test User',
    });

    expect(response.status()).toBe(400);
  });

  test('should fail registration with invalid email format', async () => {
    const response = await apiClient.post('/api/auth/register', {
      email: 'invalid-email',
      password: testPassword,
      name: 'Test User',
    });

    expect(response.status()).toBe(400);
  });

  test('should fail registration with weak password', async () => {
    const response = await apiClient.post('/api/auth/register', {
      email: generateUniqueEmail(),
      password: '123',
      name: 'Test User',
    });

    expect(response.status()).toBe(400);
  });

  test('should fail registration with missing name', async () => {
    const response = await apiClient.post('/api/auth/register', {
      email: generateUniqueEmail(),
      password: testPassword,
    });

    expect(response.status()).toBe(400);
  });
});

test.describe('Auth Service - Login', () => {
  test.beforeAll(async () => {
    testEmail = generateUniqueEmail();
    await apiClient.post('/api/auth/register', {
      email: testEmail,
      password: testPassword,
      name: 'Test User',
    });
  });

  test('should login successfully with valid credentials', async () => {
    const response = await apiClient.post('/api/auth/login', {
      email: testEmail,
      password: testPassword,
    });

    expect(response.status()).toBe(200);
    const data = await getJsonResponse(response);
    expect(data.data).toHaveProperty('token');
    authToken = data.data.token;
  });

  test('should fail login with incorrect password', async () => {
    const response = await apiClient.post('/api/auth/login', {
      email: testEmail,
      password: 'WrongPassword123!',
    });

    expect(response.status()).toBe(401);
  });

  test('should fail login with non-existent email', async () => {
    const response = await apiClient.post('/api/auth/login', {
      email: 'nonexistent@example.com',
      password: testPassword,
    });

    expect(response.status()).toBe(401);
  });

  test('should fail login with missing email', async () => {
    const response = await apiClient.post('/api/auth/login', {
      password: testPassword,
    });

    expect(response.status()).toBe(400);
  });

  test('should fail login with missing password', async () => {
    const response = await apiClient.post('/api/auth/login', {
      email: testEmail,
    });

    expect(response.status()).toBe(400);
  });

  test('should return token in login response', async () => {
    const response = await apiClient.post('/api/auth/login', {
      email: testEmail,
      password: testPassword,
    });

    expect(response.status()).toBe(200);
    const data = await getJsonResponse(response);
    expect(data.data.token).toBeTruthy();
    expect(typeof data.data.token).toBe('string');
  });
});

test.describe('Auth Service - Current User', () => {
  test.beforeAll(async () => {
    testEmail = generateUniqueEmail();
    await apiClient.post('/api/auth/register', {
      email: testEmail,
      password: testPassword,
      name: 'Test User',
    });

    const loginResponse = await apiClient.post('/api/auth/login', {
      email: testEmail,
      password: testPassword,
    });
    const data = await getJsonResponse(loginResponse);
    apiClient.setToken(data.data.token);
  });

  test('should get current user with valid token', async () => {
    const response = await apiClient.get('/api/auth/me');

    expect(response.status()).toBe(200);
    const data = await getJsonResponse(response);
    expect(data.data.email).toBe(testEmail);
  });

  test('should return user details in current user response', async () => {
    const response = await apiClient.get('/api/auth/me');

    expect(response.status()).toBe(200);
    const data = await getJsonResponse(response);
    expect(data.data).toHaveProperty('userId');
    expect(data.data).toHaveProperty('email');
    expect(data.data).toHaveProperty('name');
  });

  test('should fail getting current user with invalid token', async () => {
    apiClient.setToken('invalid.token.here');
    const response = await apiClient.get('/api/auth/me');

    expect(response.status()).toBe(401);
  });

  test('should fail getting current user without token', async () => {
    apiClient.setToken(null);
    const response = await apiClient.get('/api/auth/me');

    expect(response.status()).toBe(401);
  });

  test('should fail with expired token', async () => {
    apiClient.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
    const response = await apiClient.get('/api/auth/me');

    expect(response.status()).toBe(401);
  });
});

test.describe('Auth Service - Logout', () => {
  test.beforeAll(async () => {
    testEmail = generateUniqueEmail();
    await apiClient.post('/api/auth/register', {
      email: testEmail,
      password: testPassword,
      name: 'Test User',
    });

    const loginResponse = await apiClient.post('/api/auth/login', {
      email: testEmail,
      password: testPassword,
    });
    const data = await getJsonResponse(loginResponse);
    apiClient.setToken(data.data.token);
  });

  test('should logout successfully with valid token', async () => {
    const response = await apiClient.post('/api/auth/logout', {});

    expect(response.status()).toBe(200);
  });

  test('should fail logout with invalid token', async () => {
    apiClient.setToken('invalid.token.here');
    const response = await apiClient.post('/api/auth/logout', {});

    expect(response.status()).toBe(401);
  });

  test('should invalidate token after logout', async () => {
    // Register and login
    const testEmailLogout = generateUniqueEmail();
    await apiClient.post('/api/auth/register', {
      email: testEmailLogout,
      password: testPassword,
      name: 'Logout Test User',
    });

    const loginResponse = await apiClient.post('/api/auth/login', {
      email: testEmailLogout,
      password: testPassword,
    });
    const loginData = await getJsonResponse(loginResponse);
    apiClient.setToken(loginData.data.token);

    // Logout
    const logoutResponse = await apiClient.post('/api/auth/logout', {});
    expect(logoutResponse.status()).toBe(200);

    // Try to use token after logout
    const meResponse = await apiClient.get('/api/auth/me');
    expect(meResponse.status()).toBe(401);
  });

  test('should fail logout without token', async () => {
    apiClient.setToken(null);
    const response = await apiClient.post('/api/auth/logout', {});

    expect(response.status()).toBe(401);
  });
});

test.describe('Auth Service - Token Validation', () => {
  test('should reject malformed token', async () => {
    apiClient.setToken('not.a.valid.jwt');
    const response = await apiClient.get('/api/auth/me');

    expect(response.status()).toBe(401);
  });

  test('should reject empty token', async () => {
    apiClient.setToken('');
    const response = await apiClient.get('/api/auth/me');

    expect(response.status()).toBe(401);
  });

  test('should require token for protected endpoints', async () => {
    apiClient.setToken(null);
    const response = await apiClient.post('/api/auth/logout', {});

    expect(response.status()).toBe(401);
  });
});
