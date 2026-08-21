import type { ApiRequest, ApiResponse } from '../types';

const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
const AUTH_TOKEN = import.meta.env.VITE_N8N_AUTH_TOKEN;

const TIMEOUT_MS = 120000
export class ApiError extends Error {
  isTimeout: boolean;

  constructor(message: string, isTimeout = false) {
    super(message);
    this.name = 'ApiError';
    this.isTimeout = isTimeout;
  }
}

export async function sendMessage(payload: ApiRequest): Promise<ApiResponse> {
  if (!WEBHOOK_URL) {
    throw new ApiError(
      'Missing VITE_N8N_WEBHOOK_URL. Set it in your .env.local file.'
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(AUTH_TOKEN ? { 'X-API-Key': AUTH_TOKEN } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiError(`Request failed with status ${response.status}`);
    }

    const json = (await response.json()) as ApiResponse;

    if (!json || typeof json.response !== 'string') {
      throw new ApiError('Malformed response from server.');
    }

    return json;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', true);
    }

    throw new ApiError(
      err instanceof Error ? err.message : 'Network error. Please try again.'
    );
  }
}
