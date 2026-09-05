import asyncHandler from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/apiResponse.js';
import aiService from '../ai/aiService.js';

/**
 * @desc    Generate proactive context-grounded AI diagnosis
 * @route   POST /api/v1/projects/:projectId/scenario-attempts/:attemptId/ai/diagnose
 * @access  Private
 */
export const diagnoseScenario = asyncHandler(async (req, res) => {
  const { projectId, attemptId } = req.params;

  const result = await aiService.diagnoseAttempt(projectId, attemptId, req.user._id);

  return ApiResponse.success(res, 'AI diagnosis generated successfully', result, 200);
});

/**
 * @desc    Request progressive hint (Levels 1-4)
 * @route   POST /api/v1/projects/:projectId/scenario-attempts/:attemptId/ai/hint
 * @access  Private
 */
export const getScenarioHint = asyncHandler(async (req, res) => {
  const { projectId, attemptId } = req.params;
  const { level } = req.body;

  const result = await aiService.getHint(projectId, attemptId, level || 1, req.user._id);

  return ApiResponse.success(res, `Progressive hint (Level ${result.hintLevel}) generated`, result, 200);
});

/**
 * @desc    Explain evidence topic
 * @route   POST /api/v1/projects/:projectId/scenario-attempts/:attemptId/ai/explain
 * @access  Private
 */
export const explainEvidenceTopic = asyncHandler(async (req, res) => {
  const { projectId, attemptId } = req.params;
  const { topic } = req.body;

  const result = await aiService.explainEvidence(projectId, attemptId, topic || 'events', req.user._id);

  return ApiResponse.success(res, 'Evidence explanation generated successfully', result, 200);
});

/**
 * @desc    Explain K8s concept in current telemetry context
 * @route   POST /api/v1/projects/:projectId/scenario-attempts/:attemptId/ai/concept
 * @access  Private
 */
export const explainConcept = asyncHandler(async (req, res) => {
  const { projectId, attemptId } = req.params;
  const { concept } = req.body;

  const result = await aiService.explainConcept(projectId, attemptId, concept || 'CrashLoopBackOff', req.user._id);

  return ApiResponse.success(res, 'Kubernetes concept explanation generated', result, 200);
});

/**
 * @desc    Interactive chat with AI Mentor
 * @route   POST /api/v1/projects/:projectId/scenario-attempts/:attemptId/ai/chat
 * @access  Private
 */
export const chatWithMentor = asyncHandler(async (req, res) => {
  const { projectId, attemptId } = req.params;
  const { message } = req.body;

  const result = await aiService.chatWithMentor(projectId, attemptId, message, req.user._id);

  return ApiResponse.success(res, 'AI Mentor response generated', result, 200);
});

/**
 * @desc    Fetch AI conversation history for scenario attempt
 * @route   GET /api/v1/projects/:projectId/scenario-attempts/:attemptId/ai/chat
 * @access  Private
 */
export const getChatHistory = asyncHandler(async (req, res) => {
  const { projectId, attemptId } = req.params;

  const history = await aiService.getConversationHistory(projectId, attemptId, req.user._id);

  return ApiResponse.success(res, 'AI conversation history retrieved', history, 200);
});
