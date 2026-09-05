import Project from '../models/Project.js';
import ScenarioAttempt from '../models/ScenarioAttempt.js';
import ContextSnapshot from '../models/ContextSnapshot.js';
import AIConversation from '../models/AIConversation.js';
import AIMentorResponse from '../models/AIMentorResponse.js';
import troubleshootingEngine from './troubleshootingEngine.js';
import contextService from '../context/contextService.js';
import { ApiError } from '../middleware/errorMiddleware.js';

const MAX_REQUESTS_PER_ATTEMPT = parseInt(process.env.AI_MAX_REQUESTS_PER_ATTEMPT || '20', 10);

export const aiService = {
  /**
   * Helper: Verify ownership, rate limits, and retrieve latest ContextSnapshot
   */
  getAttemptAndSnapshot: async (projectId, attemptId, userId) => {
    // 1. Verify project ownership
    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) {
      throw new ApiError('Project not found or not accessible', 404);
    }

    // 2. Fetch scenario attempt
    const attempt = await ScenarioAttempt.findOne({
      _id: attemptId,
      project: projectId,
      user: userId,
    }).populate('deployment');

    if (!attempt) {
      throw new ApiError('Scenario attempt not found or not accessible', 404);
    }

    // 3. Enforce rate limiting
    const requestCount = await AIMentorResponse.countDocuments({
      scenarioAttempt: attemptId,
      user: userId,
    });

    if (requestCount >= MAX_REQUESTS_PER_ATTEMPT) {
      throw new ApiError(`AI hint request limit reached for this scenario attempt (Max ${MAX_REQUESTS_PER_ATTEMPT} requests).`, 429);
    }

    // 4. Retrieve latest ContextSnapshot for attempt
    let snapshot = await ContextSnapshot.findOne({
      scenarioAttempt: attemptId,
      project: projectId,
      user: userId,
    }).sort({ createdAt: -1 });

    if (!snapshot) {
      // Generate snapshot automatically if not found
      const generated = await contextService.generateAndSaveSnapshot(projectId, attemptId, userId);
      snapshot = await ContextSnapshot.findById(generated.snapshotId);
    }

    return { project, attempt, snapshot };
  },

  /**
   * Automatically generate proactive AI diagnosis for scenario attempt
   */
  diagnoseAttempt: async (projectId, attemptId, userId) => {
    const { attempt, snapshot } = await aiService.getAttemptAndSnapshot(projectId, attemptId, userId);

    const responseObj = await troubleshootingEngine.processMentorRequest('diagnose', snapshot);

    // Save in AIMentorResponse
    await AIMentorResponse.create({
      user: userId,
      project: projectId,
      deployment: attempt.deployment._id,
      scenarioAttempt: attemptId,
      contextSnapshot: snapshot._id,
      mode: 'diagnose',
      response: responseObj,
    });

    // Save in AIConversation
    await aiService.appendConversationMessage(
      userId,
      projectId,
      attempt.deployment._id,
      attemptId,
      snapshot._id,
      'assistant',
      responseObj.diagnosis?.summary || 'Generated AI Diagnosis',
      'diagnose',
      null,
      responseObj.diagnosis?.confidence,
      responseObj.evidence
    );

    return {
      scenarioAttemptId: attemptId,
      contextSnapshotId: snapshot._id,
      contextVersion: snapshot.contextVersion || '1.0',
      aiResponse: responseObj,
    };
  },

  /**
   * Get progressive hint (Levels 1-4)
   */
  getHint: async (projectId, attemptId, requestedLevel, userId) => {
    const level = parseInt(requestedLevel, 10);
    if (isNaN(level) || level < 1 || level > 4) {
      throw new ApiError('Invalid hint level. Allowed levels: 1 (Direction), 2 (Evidence), 3 (Root Cause), 4 (Suggested Fix)', 400);
    }

    const { attempt, snapshot } = await aiService.getAttemptAndSnapshot(projectId, attemptId, userId);

    const responseObj = await troubleshootingEngine.processMentorRequest('hint', snapshot, { level });

    await AIMentorResponse.create({
      user: userId,
      project: projectId,
      deployment: attempt.deployment._id,
      scenarioAttempt: attemptId,
      contextSnapshot: snapshot._id,
      mode: 'hint',
      hintLevel: level,
      response: responseObj,
    });

    await aiService.appendConversationMessage(
      userId,
      projectId,
      attempt.deployment._id,
      attemptId,
      snapshot._id,
      'assistant',
      responseObj.hint || 'Requested Hint',
      'hint',
      level,
      responseObj.diagnosis?.confidence,
      responseObj.evidence
    );

    return {
      scenarioAttemptId: attemptId,
      contextSnapshotId: snapshot._id,
      contextVersion: snapshot.contextVersion || '1.0',
      hintLevel: level,
      aiResponse: responseObj,
    };
  },

  /**
   * Explain specific evidence topic
   */
  explainEvidence: async (projectId, attemptId, topic, userId) => {
    const { attempt, snapshot } = await aiService.getAttemptAndSnapshot(projectId, attemptId, userId);

    const responseObj = await troubleshootingEngine.processMentorRequest('explain', snapshot, { topic });

    await AIMentorResponse.create({
      user: userId,
      project: projectId,
      deployment: attempt.deployment._id,
      scenarioAttempt: attemptId,
      contextSnapshot: snapshot._id,
      mode: 'explain',
      response: responseObj,
    });

    return {
      scenarioAttemptId: attemptId,
      contextSnapshotId: snapshot._id,
      topic,
      aiResponse: responseObj,
    };
  },

  /**
   * Explain K8s concept grounded in current telemetry
   */
  explainConcept: async (projectId, attemptId, conceptQuery, userId) => {
    const { attempt, snapshot } = await aiService.getAttemptAndSnapshot(projectId, attemptId, userId);

    const responseObj = await troubleshootingEngine.processMentorRequest('concept', snapshot, { conceptQuery });

    return {
      scenarioAttemptId: attemptId,
      contextSnapshotId: snapshot._id,
      conceptQuery,
      aiResponse: responseObj,
    };
  },

  /**
   * Interactive AI chat anchored strictly to latest ContextSnapshot
   */
  chatWithMentor: async (projectId, attemptId, userMessage, userId) => {
    if (!userMessage || userMessage.trim().length === 0) {
      throw new ApiError('Please provide a message for the AI Mentor.', 400);
    }

    const { attempt, snapshot } = await aiService.getAttemptAndSnapshot(projectId, attemptId, userId);

    // Append user message
    await aiService.appendConversationMessage(
      userId,
      projectId,
      attempt.deployment._id,
      attemptId,
      snapshot._id,
      'user',
      userMessage,
      'chat'
    );

    const responseObj = await troubleshootingEngine.processMentorRequest('chat', snapshot, { message: userMessage });

    // Append assistant response
    await aiService.appendConversationMessage(
      userId,
      projectId,
      attempt.deployment._id,
      attemptId,
      snapshot._id,
      'assistant',
      responseObj.diagnosis?.summary || responseObj.likelyCause || 'AI Mentor Response',
      'chat',
      null,
      responseObj.diagnosis?.confidence,
      responseObj.evidence
    );

    return {
      scenarioAttemptId: attemptId,
      contextSnapshotId: snapshot._id,
      userMessage,
      aiResponse: responseObj,
    };
  },

  /**
   * Get AI conversation history for scenario attempt
   */
  getConversationHistory: async (projectId, attemptId, userId) => {
    const conversation = await AIConversation.findOne({
      scenarioAttempt: attemptId,
      project: projectId,
      user: userId,
    });

    return conversation ? conversation.toResponseObject() : { messages: [] };
  },

  /**
   * Helper: Append message to AIConversation document
   */
  appendConversationMessage: async (
    userId,
    projectId,
    deploymentId,
    attemptId,
    snapshotId,
    role,
    content,
    mode,
    hintLevel = null,
    confidence = null,
    evidence = []
  ) => {
    await AIConversation.updateOne(
      { scenarioAttempt: attemptId, project: projectId, user: userId },
      {
        $setOnInsert: {
          user: userId,
          project: projectId,
          deployment: deploymentId,
          scenarioAttempt: attemptId,
          contextSnapshot: snapshotId,
        },
        $push: {
          messages: {
            role,
            content,
            mode,
            hintLevel,
            confidence,
            evidence,
            createdAt: new Date(),
          },
        },
      },
      { upsert: true }
    );
  },
};

export default aiService;
