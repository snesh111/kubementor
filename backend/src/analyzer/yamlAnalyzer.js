import yaml from 'js-yaml';

export const parseYamlManifest = (yamlString) => {
  try {
    const parsed = yaml.load(yamlString);
    return {
      isValid: true,
      parsed,
      error: null,
    };
  } catch (error) {
    return {
      isValid: false,
      parsed: null,
      error: error.message,
    };
  }
};

export default { parseYamlManifest };
