import api from './api';

export const progressService = {
  /**
   * Fetch complete learner progress summary
   */
  getUserProgress: async () => {
    const res = await api.get('/progress');
    return res.data;
  },

  /**
   * Fetch deterministic scenario mastery list
   */
  getScenarioMasteryList: async () => {
    const res = await api.get('/progress/scenarios');
    return res.data;
  },

  /**
   * Fetch topic-level progress breakdown
   */
  getTopicProgressList: async () => {
    const res = await api.get('/progress/topics');
    return res.data;
  },

  /**
   * Fetch recent practice validation history
   * @param {number} limit
   */
  getRecentPractice: async (limit = 10) => {
    const res = await api.get(`/progress/recent?limit=${limit}`);
    return res.data;
  },

  /**
   * Fetch deterministic practice recommendations
   */
  getRecommendations: async () => {
    const res = await api.get('/progress/recommendations');
    return res.data;
  },
};

export default progressService;
