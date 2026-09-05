/**
 * Validate registration request body
 */
export const validateRegistration = (data) => {
  const errors = {};

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.name = 'Name is required and must be at least 2 characters long.';
  }

  if (!data.email || typeof data.email !== 'string' || !/\S+@\S+\.\S+/.test(data.email.trim())) {
    errors.email = 'A valid email address is required.';
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate login request body
 */
export const validateLogin = (data) => {
  const errors = {};

  if (!data.email || typeof data.email !== 'string' || !/\S+@\S+\.\S+/.test(data.email.trim())) {
    errors.email = 'A valid email address is required.';
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.password = 'Password is required.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate profile update request body
 */
export const validateProfileUpdate = (data) => {
  const errors = {};

  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length < 2)) {
    errors.name = 'Name must be at least 2 characters long.';
  }

  if (data.email !== undefined && (typeof data.email !== 'string' || !/\S+@\S+\.\S+/.test(data.email.trim()))) {
    errors.email = 'A valid email address is required.';
  }

  if (data.password !== undefined && data.password !== '' && (typeof data.password !== 'string' || data.password.length < 6)) {
    errors.password = 'New password must be at least 6 characters long if provided.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export default {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
};
