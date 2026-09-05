import Scenario from '../models/Scenario.js';

export const scenarioService = {
  listScenarios: async () => {
    return await Scenario.find().select('-solutionYaml');
  },

  evaluateSolution: async (scenarioId, submittedYaml) => {
    // Scaffold for checking submitted solution against reference solution
    return {
      passed: true,
      score: 100,
    };
  },
};

export default scenarioService;
