const SENSITIVE_KEY_REGEX = /(password|passwd|secret|token|api_?key|private_?key|auth|bearer|credential|authorization|cert|private)/i;

/**
 * Recursively sanitize objects and arrays to redact sensitive credentials
 * @param {any} data
 * @returns {any} Sanitized clone of data
 */
export const sanitizeContextData = (data) => {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Check if string looks like an authorization header, private key, or secret
    if (
      data.toLowerCase().startsWith('bearer ') ||
      data.includes('BEGIN PRIVATE KEY') ||
      data.includes('BEGIN RSA PRIVATE KEY') ||
      (data.length > 100 && SENSITIVE_KEY_REGEX.test(data))
    ) {
      return '[REDACTED_SENSITIVE_VALUE]';
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeContextData(item));
  }

  if (typeof data === 'object') {
    const sanitizedObj = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEY_REGEX.test(key)) {
        if (typeof value === 'object' && value !== null && (value.name || value.exists !== undefined)) {
          // Preserve safe metadata if it's an object with name/exists
          sanitizedObj[key] = {
            name: value.name || 'secret-reference',
            exists: value.exists ?? true,
            redacted: true,
          };
        } else {
          sanitizedObj[key] = '[REDACTED_SENSITIVE_VALUE]';
        }
      } else {
        sanitizedObj[key] = sanitizeContextData(value);
      }
    }
    return sanitizedObj;
  }

  return data;
};

export default { sanitizeContextData };
