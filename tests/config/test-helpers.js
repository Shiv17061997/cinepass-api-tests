import { test as base } from '@playwright/test';

export class APIClient {
  constructor(baseURL, context) {
    this.baseURL = baseURL;
    this.context = context;
    this.token = null;
  }

  async request(method, endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await this.context.request[method.toLowerCase()](url, {
      ...options,
      headers,
    });

    return {
      status: response.status(),
      data: await response.json().catch(() => null),
      headers: response.headers(),
    };
  }

  setToken(token) {
    this.token = token;
  }
}

export const test = base.extend({
  apiClient: async ({ context }, use) => {
    const client = new APIClient(process.env.API_URL || 'http://localhost', context);
    await use(client);
  },
});

export { expect } from '@playwright/test';
