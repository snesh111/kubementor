import geminiProvider from '../ai/geminiProvider.js';
import promptTemplates from '../ai/promptTemplates.js';

export const aiService = {
  analyzeLogContent: async (logContent) => {
    const prompt = promptTemplates.buildLogAnalysisPrompt(logContent);
    return await geminiProvider.generateCompletion(prompt);
  },

  analyzeYamlManifest: async (yamlContent) => {
    const prompt = promptTemplates.buildYamlAnalysisPrompt(yamlContent);
    return await geminiProvider.generateCompletion(prompt);
  },
};

export default aiService;
