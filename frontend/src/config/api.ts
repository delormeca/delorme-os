/**
 * API Configuration
 * Handles different deployment scenarios:
 * - Development: Uses Vite proxy (empty base URL)
 * - Production Separate Services: Uses VITE_API_URL
 * - Production Single Docker: Uses same origin (empty base URL)
 */

import { OpenAPI } from '@/client';

const getApiBaseUrl = (): string => {
  // Development: Use Vite proxy (empty = same origin, proxy handles routing)
  if (import.meta.env.DEV) {
    return '';
  }

  // Production: Check for separate API URL
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (apiUrl) {
    // Separate services deployment (e.g., Vercel frontend + Railway backend)
    return apiUrl;
  }

  // Single Docker deployment (FastAPI serves both frontend and API)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Initialize API client configuration
 * Call this once at app startup
 */
export const initializeApiClient = (): void => {
  // Configure OpenAPI client
  OpenAPI.BASE = API_BASE_URL;
  OpenAPI.CREDENTIALS = 'include'; // Include cookies for authentication
  
  // Debug info (removed in production builds)
  if (import.meta.env.DEV) {
    console.log('🔧 API Client Initialized:', {
      mode: import.meta.env.MODE,
      baseUrl: OpenAPI.BASE || 'same-origin (proxy/docker)',
      deployment: API_BASE_URL ? 'separate-services' : 'single-docker/proxy',
      credentials: OpenAPI.CREDENTIALS
    });
  }
};

// Debug info (removed in production builds)
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    mode: import.meta.env.MODE,
    apiBaseUrl: API_BASE_URL || 'same-origin (proxy/docker)',
    deployment: API_BASE_URL ? 'separate-services' : 'single-docker/proxy'
  });
} 