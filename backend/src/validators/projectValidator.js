const VALID_STATUSES = ['draft', 'analyzed', 'deployed', 'archived'];

/**
 * Validate project creation request body
 */
export const validateProjectCreate = (data) => {
  const errors = {};

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 3 || data.name.trim().length > 100) {
    errors.name = 'Project name is required and must be between 3 and 100 characters.';
  }

  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string' || data.description.trim().length > 500) {
      errors.description = 'Description cannot exceed 500 characters.';
    }
  }

  if (data.status !== undefined && data.status !== null) {
    if (!VALID_STATUSES.includes(data.status)) {
      errors.status = `Status must be one of: ${VALID_STATUSES.join(', ')}.`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate project update request body
 */
export const validateProjectUpdate = (data) => {
  const errors = {};

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length < 3 || data.name.trim().length > 100) {
      errors.name = 'Project name must be between 3 and 100 characters.';
    }
  }

  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string' || data.description.trim().length > 500) {
      errors.description = 'Description cannot exceed 500 characters.';
    }
  }

  if (data.status !== undefined && data.status !== null) {
    if (!VALID_STATUSES.includes(data.status)) {
      errors.status = `Status must be one of: ${VALID_STATUSES.join(', ')}.`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export default {
  validateProjectCreate,
  validateProjectUpdate,
};
