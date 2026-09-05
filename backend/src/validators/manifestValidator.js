export const validateManifestUpload = (data) => {
  const errors = [];
  if (!data || Object.keys(data).length === 0) {
    errors.push('Manifest content cannot be empty.');
  }
  return { valid: errors.length === 0, errors };
};
