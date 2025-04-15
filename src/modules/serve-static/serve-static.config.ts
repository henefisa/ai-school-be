/**
 * Configuration for static file serving
 * Defines upload directories and their corresponding routes
 */
export interface UploadDirectoryConfig {
  /** Path to the directory relative to the project root */
  path: string;
  /** Route where the files will be served */
  route: string;
  /** Description of the directory purpose */
  description: string;
}

/**
 * Configuration for all upload directories in the application
 */
export const uploadDirectories: UploadDirectoryConfig[] = [
  {
    path: 'uploads/students',
    route: '/uploads/students',
    description: 'Student profile photos and documents',
  },
  {
    path: 'uploads/teachers',
    route: '/uploads/teachers',
    description: 'Teacher profile photos and documents',
  },
  // Add more upload directories as needed
  {
    path: 'uploads/avatars',
    route: '/uploads/avatars',
    description: 'User profile avatars',
  },
];
