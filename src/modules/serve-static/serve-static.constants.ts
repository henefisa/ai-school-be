/**
 * Constants for static file serving configuration
 */

/**
 * Cache duration for static files in milliseconds
 * 24 hours = 86400000 milliseconds
 */
export const STATIC_FILE_CACHE_DURATION = 86400000;

/**
 * Default MIME types allowed for file uploads
 */
export const DEFAULT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
];

/**
 * Default maximum file size in bytes
 * 5MB = 5 * 1024 * 1024 bytes
 */
export const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024;
