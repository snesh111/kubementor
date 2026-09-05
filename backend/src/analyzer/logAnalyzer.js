export const parseContainerLogs = (rawLogs) => {
  if (!rawLogs) return { errors: [], warnings: [], linesCount: 0 };
  const lines = rawLogs.split('\n');
  const errors = lines.filter((line) => /error|fatal|exception|fail/i.test(line));
  const warnings = lines.filter((line) => /warn|warning/i.test(line));

  return {
    linesCount: lines.length,
    errors,
    warnings,
  };
};

export default { parseContainerLogs };
