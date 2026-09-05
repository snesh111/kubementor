export const validateScenarioSubmission = (data) => {
  const errors = [];
  if (!data.solutionYaml) {
    errors.push('solutionYaml field is required for verification.');
  }
  return { valid: errors.length === 0, errors };
};
