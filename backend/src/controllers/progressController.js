import progressService from '../services/progressService.js';
import { catchAsync } from '../middleware/errorMiddleware.js';

export const progressController = {
  /**
   * GET /api/v1/progress - Overall learner progress summary
   */
  getProgressSummary: catchAsync(async (req, res) => {
    const summary = await progressService.getUserProgressSummary(req.user.id);
    res.status(200).json({
      status: 'success',
      data: summary,
    });
  }),

  /**
   * GET /api/v1/progress/scenarios - Scenario mastery breakdown
   */
  getScenarioMastery: catchAsync(async (req, res) => {
    const scenarios = await progressService.getScenarioMasteryList(req.user.id);
    res.status(200).json({
      status: 'success',
      results: scenarios.length,
      data: scenarios,
    });
  }),

  /**
   * GET /api/v1/progress/topics - Topic completion progress
   */
  getTopicProgress: catchAsync(async (req, res) => {
    const topics = await progressService.getTopicProgressList(req.user.id);
    res.status(200).json({
      status: 'success',
      results: topics.length,
      data: topics,
    });
  }),

  /**
   * GET /api/v1/progress/recent - Recent practice validation history
   */
  getRecentPractice: catchAsync(async (req, res) => {
    const limit = parseInt(req.query.limit || '10', 10);
    const recent = await progressService.getRecentPractice(req.user.id, limit);
    res.status(200).json({
      status: 'success',
      results: recent.length,
      data: recent,
    });
  }),

  /**
   * GET /api/v1/progress/recommendations - Deterministic practice recommendations
   */
  getRecommendations: catchAsync(async (req, res) => {
    const recommendations = await progressService.getRecommendations(req.user.id);
    res.status(200).json({
      status: 'success',
      results: recommendations.length,
      data: recommendations,
    });
  }),
};

export default progressController;
