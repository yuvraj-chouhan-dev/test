
export const config = {
  // Toggle this to FALSE to use the real Backend API
  // In production, this should be false to use real API endpoints
  USE_MOCK_DATA: import.meta.env.MODE === 'development', 
  
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_URL || '/api',
  
  // Feature Flags
  ENABLE_ANALYTICS: true,
  ENABLE_NOTIFICATIONS: true,
  
  // Timeout Settings
  API_TIMEOUT: 15000,
};
