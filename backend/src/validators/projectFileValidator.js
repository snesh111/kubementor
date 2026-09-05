import yaml from 'js-yaml';
import path from 'path';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB in bytes

/**
 * Determine file type based on original filename
 */
export const detectFileType = (filename) => {
  if (!filename) return 'unknown';
  const lowerName = filename.toLowerCase();
  const ext = path.extname(lowerName);

  if (ext === '.yaml' || ext === '.yml') {
    return 'yaml';
  }

  if (
    lowerName === 'dockerfile' ||
    lowerName.startsWith('dockerfile.') ||
    ext === '.dockerfile' ||
    ext === '.containerfile'
  ) {
    return 'dockerfile';
  }

  return 'unknown';
};

/**
 * Validate file metadata (size, file type)
 */
export const validateFileMetadata = (filename, size) => {
  const errors = [];

  if (size > MAX_FILE_SIZE) {
    errors.push('File exceeds the 5 MB limit.');
  }

  const fileType = detectFileType(filename);
  if (fileType === 'unknown') {
    errors.push('File type not supported. Allowed extensions: .yaml, .yml, Dockerfile.');
  }

  return {
    valid: errors.length === 0,
    errors,
    fileType,
  };
};

/**
 * Validate raw text content of file (YAML syntax or Dockerfile structure)
 */
export const validateFileContent = (fileType, contentString) => {
  if (!contentString || typeof contentString !== 'string' || contentString.trim().length === 0) {
    return {
      valid: false,
      error: 'File content cannot be empty.',
    };
  }

  if (fileType === 'yaml') {
    try {
      // Parse multi-document or single document YAML
      yaml.loadAll(contentString);
      return { valid: true, error: null };
    } catch (err) {
      return {
        valid: false,
        error: `Invalid YAML syntax: ${err.message}`,
      };
    }
  }

  if (fileType === 'dockerfile') {
    // Check for FROM instruction (case-insensitive)
    const hasFrom = /^\s*FROM\s+\S+/im.test(contentString);
    if (!hasFrom) {
      return {
        valid: false,
        error: 'Invalid Dockerfile: Missing required FROM instruction.',
      };
    }
    return { valid: true, error: null };
  }

  return { valid: true, error: null };
};

export default {
  detectFileType,
  validateFileMetadata,
  validateFileContent,
};
