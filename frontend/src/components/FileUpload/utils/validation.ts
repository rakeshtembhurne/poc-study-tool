import { FileValidationConfig } from '@/types/card';

/**
 * Validates a file against the provided configuration
 * @param file - The file to validate
 * @param config - Validation configuration
 * @returns Error message if validation fails, null if valid
 */
export function validateFile(
  file: File,
  config: FileValidationConfig
): string | null {
  // Check file size
  if (file.size > config.maxSize) {
    const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return `File size (${fileSizeMB}MB) exceeds maximum allowed size of ${maxSizeMB}MB`;
  }

  // Check file type
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type;

  const isValidType = config.allowedTypes.some((allowedType) => {
    // Check both MIME type and file extension
    return mimeType === allowedType || fileExtension === allowedType;
  });

  if (!isValidType) {
    const allowedExtensions = config.allowedTypes
      .filter((type) => type.startsWith('.'))
      .join(', ');
    const allowedMimeTypes = config.allowedTypes
      .filter((type) => !type.startsWith('.'))
      .join(', ');

    let errorMessage = 'Invalid file type.';
    if (allowedExtensions) {
      errorMessage += ` Allowed extensions: ${allowedExtensions}`;
    }
    if (allowedMimeTypes) {
      errorMessage += ` Allowed types: ${allowedMimeTypes}`;
    }

    return errorMessage;
  }

  return null; // File is valid
}

/**
 * Formats file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Gets file extension from filename
 * @param filename - The filename
 * @returns File extension with dot (e.g., '.txt')
 */
export function getFileExtension(filename: string): string {
  return '.' + filename.split('.').pop()?.toLowerCase() || '';
}
