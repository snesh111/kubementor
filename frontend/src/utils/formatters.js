export const formatLogOutput = (rawLog) => {
  if (!rawLog) return '';
  return rawLog
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
};

export const sanitizeYaml = (yamlText) => {
  if (!yamlText) return '';
  return yamlText.replace(/\r\n/g, '\n');
};
