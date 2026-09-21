import asyncHandler from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/apiResponse.js';
import scenarioService from '../scenarios/scenarioService.js';
import labService from '../services/labService.js';

/**
 * @desc    Get structured learner practice catalog (Basics, Configuration, Troubleshooting)
 * @route   GET /api/v1/labs/catalog
 * @access  Private / Public
 */
export const getPracticeCatalog = asyncHandler(async (req, res) => {
  // 1. Fetch live available troubleshooting failure scenarios from DB
  const liveScenarios = await scenarioService.getScenarios();

  // 2. Build practice tracks
  const catalog = [
    {
      categoryId: 'troubleshooting',
      categoryName: 'Troubleshooting Labs',
      description: 'Real-world cluster outage simulations. Diagnose live pod failures, analyze telemetry, and redeploy working configurations.',
      items: liveScenarios.map((sc) => ({
        id: sc.scenarioId,
        slug: sc.scenarioId,
        scenarioId: sc.scenarioId,
        name: sc.name,
        description: sc.description,
        difficulty: sc.difficulty,
        estTime: sc.difficulty === 'Advanced' ? '20 mins' : sc.difficulty === 'Intermediate' ? '15 mins' : '10 mins',
        expectedFailure: sc.expectedFailure,
        status: 'Available',
        isLive: true,
        category: 'Troubleshooting',
        concept: sc.concept || null,
        iconName:
          sc.scenarioId === 'crash-loop-backoff'
            ? 'Bomb'
            : sc.scenarioId === 'image-pull-backoff'
            ? 'StopCircle'
            : sc.scenarioId === 'oom-killed'
            ? 'Flame'
            : sc.scenarioId === 'missing-configmap'
            ? 'FileText'
            : sc.scenarioId === 'service-connectivity'
            ? 'WifiOff'
            : sc.scenarioId === 'ingress-tls-failure'
            ? 'Lock'
            : 'Wrench',
      })),
    },
    {
      categoryId: 'basics',
      categoryName: 'Kubernetes Basics',
      description: 'Master core building blocks: Pod lifecycle, declarative Deployments, and L4 Services.',
      items: [
        {
          id: 'topic-pods',
          slug: 'topic-pods',
          scenarioId: 'topic-pods',
          name: 'Pods & Multi-Container Pods',
          description: 'Atomic scheduling unit in Kubernetes. Learn container specifications, shared networking, and lifecycle states.',
          difficulty: 'Beginner',
          estTime: '10 mins',
          status: 'Available',
          isLive: true,
          category: 'Kubernetes Basics',
          iconName: 'Box',
        },
        {
          id: 'topic-deployments',
          slug: 'topic-deployments',
          scenarioId: 'topic-deployments',
          name: 'Deployments & Rolling Updates',
          description: 'Declaratively manage replica sets, zero-downtime rolling updates, pod revisions, and rollbacks.',
          difficulty: 'Beginner',
          estTime: '15 mins',
          status: 'Available',
          isLive: true,
          category: 'Kubernetes Basics',
          iconName: 'Layers',
        },
        {
          id: 'topic-services',
          slug: 'topic-services',
          scenarioId: 'topic-services',
          name: 'Services & Cluster Networking',
          description: 'Expose workloads internally and externally via ClusterIP, NodePort, and LoadBalancer with selector discovery.',
          difficulty: 'Beginner',
          estTime: '15 mins',
          status: 'Available',
          isLive: true,
          category: 'Kubernetes Basics',
          iconName: 'Network',
        },
      ],
    },
    {
      categoryId: 'configuration',
      categoryName: 'Configuration',
      description: 'Decouple runtime parameters and environment variables from container images.',
      items: [
        {
          id: 'topic-configmaps',
          slug: 'topic-configmaps',
          scenarioId: 'topic-configmaps',
          name: 'ConfigMaps & Environment Injection',
          description: 'Inject configuration key-value pairs, property files, and mounted volumes into running containers.',
          difficulty: 'Beginner',
          estTime: '10 mins',
          status: 'Available',
          isLive: true,
          category: 'Configuration',
          iconName: 'FileText',
        },
      ],
    },
  ];

  return ApiResponse.success(res, 'Practice catalog retrieved successfully', { catalog }, 200);
});

/**
 * @desc    Start or resume an automated lab session
 * @route   POST /api/v1/labs/:labId/start
 * @access  Private
 */
export const startLabSession = asyncHandler(async (req, res) => {
  const { labId } = req.params;
  const session = await labService.startLab(req.user._id, labId);
  return ApiResponse.success(
    res,
    session.resumed ? 'Lab session resumed successfully' : 'Lab provisioned and started successfully',
    { session },
    session.resumed ? 200 : 201
  );
});

/**
 * @desc    Get active lab session for the authenticated user
 * @route   GET /api/v1/labs/:labId/session
 * @access  Private
 */
export const getActiveLabSession = asyncHandler(async (req, res) => {
  const { labId } = req.params;
  const session = await labService.getLabSession(req.user._id, labId);
  return ApiResponse.success(res, 'Active lab session retrieved successfully', { session }, 200);
});

/**
 * @desc    Reset lab environment back to original failure state
 * @route   POST /api/v1/labs/:labId/reset
 * @access  Private
 */
export const resetLabSession = asyncHandler(async (req, res) => {
  const { labId } = req.params;
  const session = await labService.resetLab(req.user._id, labId);
  return ApiResponse.success(res, 'Lab environment reset successfully', { session }, 200);
});

/**
 * @desc    Get all manifest files for active lab
 * @route   GET /api/v1/labs/:labId/files
 * @access  Private
 */
export const getLabFiles = asyncHandler(async (req, res) => {
  const { labId } = req.params;
  const files = await labService.getLabFiles(req.user._id, labId);
  return ApiResponse.success(res, 'Lab files retrieved successfully', { files }, 200);
});

/**
 * @desc    Get single manifest file by filename
 * @route   GET /api/v1/labs/:labId/files/:filename
 * @access  Private
 */
export const getLabFile = asyncHandler(async (req, res) => {
  const { labId, filename } = req.params;
  const file = await labService.getLabFileByName(req.user._id, labId, filename);
  return ApiResponse.success(res, 'Lab file retrieved successfully', { file }, 200);
});

/**
 * @desc    Save/update manifest file content with syntax validation
 * @route   PUT /api/v1/labs/:labId/files/:filename
 * @access  Private
 */
export const saveLabFile = asyncHandler(async (req, res) => {
  const { labId, filename } = req.params;
  const { content } = req.body;
  const file = await labService.saveLabFile(req.user._id, labId, filename, content);
  return ApiResponse.success(res, `File '${filename}' saved successfully`, { file }, 200);
});

/**
 * @desc    Deploy saved manifests to sandbox environment
 * @route   POST /api/v1/labs/:labId/deploy
 * @access  Private
 */
export const deployLab = asyncHandler(async (req, res) => {
  const { labId } = req.params;
  const result = await labService.deployLab(req.user._id, labId);
  return ApiResponse.success(res, result.message, { deploymentResult: result }, 200);
});

/**
 * @desc    Get persistent investigation notes for active lab
 * @route   GET /api/v1/labs/:labId/notes
 * @access  Private
 */
export const getLabNotes = asyncHandler(async (req, res) => {
  const { labId } = req.params;
  const notes = await labService.getLabNotes(req.user._id, labId);
  return ApiResponse.success(res, 'Investigation notes retrieved successfully', { notes }, 200);
});

/**
 * @desc    Save / update persistent investigation notes for active lab
 * @route   PUT /api/v1/labs/:labId/notes
 * @access  Private
 */
export const saveLabNotes = asyncHandler(async (req, res) => {
  const { labId } = req.params;
  const notes = await labService.saveLabNotes(req.user._id, labId, req.body);
  return ApiResponse.success(res, 'Investigation notes saved successfully', { notes }, 200);
});

/**
 * @desc    Generate proactive context-grounded AI diagnosis for active lab
 * @route   POST /api/v1/labs/:labId/ai/diagnose
 * @access  Private
 */
export const diagnoseLabScenario = asyncHandler(async (req, res) => {
  const { labId } = req.params;
  const result = await labService.diagnoseLab(req.user._id, labId);
  return ApiResponse.success(res, 'AI diagnosis generated successfully', result, 200);
});

/**
 * @desc    Request progressive hint (Levels 1-4) for active lab
 * @route   POST /api/v1/labs/:labId/ai/hint
 * @access  Private
 */
export const getLabScenarioHint = asyncHandler(async (req, res) => {
  const { labId } = req.params;
  const { level } = req.body;
  const result = await labService.getLabHint(req.user._id, labId, level || 1);
  return ApiResponse.success(res, `Progressive hint (Level ${result.hintLevel}) generated`, result, 200);
});

/**
 * @desc    Interactive chat with AI Mentor for active lab
 * @route   POST /api/v1/labs/:labId/ai/chat
 * @access  Private
 */
export const chatWithLabMentor = asyncHandler(async (req, res) => {
  const { labId } = req.params;
  const { message } = req.body;
  const result = await labService.chatWithLabMentor(req.user._id, labId, message);
  return ApiResponse.success(res, 'AI Mentor response generated', result, 200);
});

/**
 * @desc    Fetch AI conversation history for active lab
 * @route   GET /api/v1/labs/:labId/ai/chat
 * @access  Private
 */
export const getLabChatHistory = asyncHandler(async (req, res) => {
  const { labId } = req.params;
  const history = await labService.getLabChatHistory(req.user._id, labId);
  return ApiResponse.success(res, 'AI conversation history retrieved', history, 200);
});

/**
 * @desc    Explain evidence topic for active lab
 * @route   POST /api/v1/labs/:labId/ai/explain
 * @access  Private
 */
export const explainLabEvidence = asyncHandler(async (req, res) => {
  const { labId } = req.params;
  const { topic } = req.body;
  const result = await labService.explainLabEvidence(req.user._id, labId, topic || 'events');
  return ApiResponse.success(res, 'Evidence explanation generated successfully', result, 200);
});

/**
 * @desc    Explain Kubernetes concept in active lab telemetry context
 * @route   POST /api/v1/labs/:labId/ai/concept
 * @access  Private
 */
export const explainLabConcept = asyncHandler(async (req, res) => {
  const { labId } = req.params;
  const { concept } = req.body;
  const result = await labService.explainLabConcept(req.user._id, labId, concept || 'Kubernetes Troubleshooting');
  return ApiResponse.success(res, 'Kubernetes concept explanation generated', result, 200);
});

/**
 * @desc    Validate learner solution against authoritative runtime state
 * @route   POST /api/v1/labs/:labId/validate
 * @access  Private
 */
export const validateLabSolution = asyncHandler(async (req, res) => {
  const { labId } = req.params;
  const result = await labService.validateLabSolution(req.user._id, labId);
  return ApiResponse.success(res, result.summary, result, 200);
});

/**
 * @desc    Get validation attempts history for active lab
 * @route   GET /api/v1/labs/:labId/validation
 * @access  Private
 */
export const getLabValidationHistory = asyncHandler(async (req, res) => {
  const { labId } = req.params;
  const history = await labService.getLabValidationHistory(req.user._id, labId);
  return ApiResponse.success(res, 'Validation history retrieved successfully', { history }, 200);
});

/**
 * @desc    Get specific validation attempt details by validation ID
 * @route   GET /api/v1/labs/:labId/validation/:attemptId
 * @access  Private
 */
export const getLabValidationAttempt = asyncHandler(async (req, res) => {
  const { labId, attemptId } = req.params;
  const validation = await labService.getLabValidationAttempt(req.user._id, labId, attemptId);
  return ApiResponse.success(res, 'Validation attempt retrieved successfully', { validation }, 200);
});

/**
 * @desc    Get guided post-mortem report for successful lab attempt
 * @route   GET /api/v1/labs/:labId/post-mortem/:attemptId
 * @access  Private
 */
export const getLabPostMortem = asyncHandler(async (req, res) => {
  const { labId } = req.params;
  const postMortem = await labService.getLabPostMortem(req.user._id, labId);
  return ApiResponse.success(res, 'Post-mortem report retrieved successfully', { postMortem }, 200);
});

export default {
  getPracticeCatalog,
  startLabSession,
  getActiveLabSession,
  resetLabSession,
  getLabFiles,
  getLabFile,
  saveLabFile,
  deployLab,
  getLabNotes,
  saveLabNotes,
  diagnoseLabScenario,
  getLabScenarioHint,
  chatWithLabMentor,
  getLabChatHistory,
  explainLabEvidence,
  explainLabConcept,
  validateLabSolution,
  getLabValidationHistory,
  getLabValidationAttempt,
  getLabPostMortem,
};
