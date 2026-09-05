export const checkResourceLimits = (manifestObj) => {
  const issues = [];
  if (manifestObj?.kind === 'Deployment' || manifestObj?.kind === 'Pod') {
    const containers = manifestObj?.spec?.template?.spec?.containers || manifestObj?.spec?.containers || [];
    containers.forEach((container) => {
      if (!container.resources || !container.resources.limits) {
        issues.push(`Container '${container.name}' is missing resource limits.`);
      }
    });
  }
  return issues;
};

export default { checkResourceLimits };
