export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const FILE_SIZE_LIMITS = {
  IMAGE: MAX_FILE_SIZE,
  // Add other file size limits here as needed
} as const;

export const API_CONFIG = {
  TIMEOUT: 10000, // 10 seconds
} as const;
