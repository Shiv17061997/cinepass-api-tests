import { APIRequestContext } from '@playwright/test';

export class APIClient {
  constructor(apiRequestContext, baseURL) {
    this.context = apiRequestContext;
    this.baseURL = baseURL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async post(endpoint, data = {}) {
    const response = await this.context.post(`${this.baseURL}${endpoint}`, {
      headers: this.getAuthHeaders(),
      data,
    });
    return response;
  }

  async get(endpoint) {
    const response = await this.context.get(`${this.baseURL}${endpoint}`, {
      headers: this.getAuthHeaders(),
    });
    return response;
  }

  async put(endpoint, data = {}) {
    const response = await this.context.put(`${this.baseURL}${endpoint}`, {
      headers: this.getAuthHeaders(),
      data,
    });
    return response;
  }

  async delete(endpoint) {
    const response = await this.context.delete(`${this.baseURL}${endpoint}`, {
      headers: this.getAuthHeaders(),
    });
    return response;
  }
}

export async function getJsonResponse(response) {
  try {
    return await response.json();
  } catch (e) {
    return null;
  }
}
