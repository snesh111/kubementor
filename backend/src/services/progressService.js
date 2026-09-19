import LearnerProgress from '../models/LearnerProgress.js';
import FailureScenario from '../models/FailureScenario.js';
import ValidationResult from '../models/ValidationResult.js';
import scenarioService from '../scenarios/scenarioService.js';

export const progressService = {
  /**
   * Determine mastery state deterministically
   * @param {number|Object} attemptsOrObj
   * @param {number} [passCount]
   * @param {number} [bestScore]
   * @returns {string} 'NOT_STARTED' | 'PRACTICING' | 'COMPLETED' | 'MASTERED'
   */
  calculateMasteryState: (attemptsOrObj, passCount, bestScore) => {
    let a = typeof attemptsOrObj === 'object' && attemptsOrObj !== null ? attemptsOrObj.attempts : attemptsOrObj;
    let p = typeof attemptsOrObj === 'object' && attemptsOrObj !== null ? attemptsOrObj.passCount : passCount;
    let b = typeof attemptsOrObj === 'object' && attemptsOrObj !== null ? attemptsOrObj.bestScore : bestScore;

    a = a || 0;
    p = p || 0;
    b = b || 0;

    if (a === 0) {
      return 'NOT_STARTED';
    }
    if (p >= 1 && (b >= 95 || p >= 2)) {
      return 'MASTERED';
    }
    if (p >= 1) {
      return 'COMPLETED';
    }
    return 'PRACTICING';
  },

  /**
   * Record a validation event and deterministically update learner progress
   * @param {string|Object} userIdOrValDoc
   * @param {string} [scenarioId]
   * @param {Object} [validationResult]
   * @returns {Object} Updated LearnerProgress document
   */
  recordValidationEvent: async (userIdOrValDoc, scenarioId, validationResult) => {
    let userId = userIdOrValDoc;
    let sId = scenarioId;
    let vRes = validationResult;

    if (userIdOrValDoc && typeof userIdOrValDoc === 'object' && userIdOrValDoc.user && userIdOrValDoc.scenario) {
      userId = userIdOrValDoc.user;
      sId = userIdOrValDoc.scenario;
      vRes = userIdOrValDoc;
    }

    if (!userId || !sId || !vRes) {
      return null;
    }

    // BYOA health checks are tracked separately and do not update guided scenario mastery
    if (vRes.isBYOA || sId === 'byoa' || (typeof sId === 'string' && sId.startsWith('byoa'))) {
      return null;
    }

    // 1. Fetch scenario definition for metadata
    await scenarioService.seedDefaultScenarios();
    const scenarioDoc = await FailureScenario.findOne({ scenarioId: sId });

    // 2. Find or create LearnerProgress record
    let progress = await LearnerProgress.findOne({ user: userId, scenarioId: sId });
    const isNew = !progress;

    if (isNew) {
      progress = new LearnerProgress({
        user: userId,
        scenarioId: sId,
        scenarioName: scenarioDoc?.name || sId,
        topic: scenarioDoc?.category || 'Reliability',
        difficulty: scenarioDoc?.difficulty || 'Beginner',
        attempts: 0,
        passCount: 0,
        failureCount: 0,
        bestScore: 0,
        latestScore: 0,
        masteryState: 'NOT_STARTED',
        firstAttemptAt: new Date(),
        recentValidations: [],
      });
    }

    // 3. Update attempt counts and scores
    const score = vRes.score || 0;
    const isPass = vRes.status === 'PASS';

    progress.attempts += 1;
    progress.latestScore = score;
    progress.bestScore = Math.max(progress.bestScore, score);
    progress.lastAttemptAt = new Date();

    if (isPass) {
      progress.passCount += 1;
      if (!progress.completedAt) {
        progress.completedAt = new Date();
      }
    } else {
      progress.failureCount += 1;
    }

    // 4. Compute updated deterministic mastery state
    const newMastery = progressService.calculateMasteryState(
      progress.attempts,
      progress.passCount,
      progress.bestScore
    );

    progress.masteryState = newMastery;
    if (newMastery === 'MASTERED' && !progress.masteredAt) {
      progress.masteredAt = new Date();
    }

    // 5. Append to recent validations (keep last 10)
    progress.recentValidations.unshift({
      validationId: vRes._id,
      status: vRes.status || 'FAIL',
      score,
      attemptNumber: progress.attempts,
      validatedAt: vRes.validatedAt || new Date(),
      summary: vRes.summary || '',
    });

    if (progress.recentValidations.length > 10) {
      progress.recentValidations = progress.recentValidations.slice(0, 10);
    }

    await progress.save();
    return progress.toResponseObject();
  },

  /**
   * Get overall learner progress summary statistics
   * @param {string} userId
   * @returns {Object} Comprehensive progress summary
   */
  getUserProgressSummary: async (userId) => {
    await scenarioService.seedDefaultScenarios();
    const scenarios = await FailureScenario.find({ enabled: true });
    const userProgressRecords = await LearnerProgress.find({ user: userId });

    const progressMap = new Map();
    userProgressRecords.forEach((p) => progressMap.set(p.scenarioId, p));

    let totalAttempts = 0;
    let totalPasses = 0;
    let totalFailures = 0;
    let completedLabs = 0;
    let masteredLabs = 0;
    let practicingLabs = 0;
    let notStartedLabs = 0;
    let scoreSum = 0;
    let attemptedScenariosCount = 0;
    let highestScore = 0;
    let lastActivityAt = null;

    scenarios.forEach((sc) => {
      const p = progressMap.get(sc.scenarioId);
      if (p && p.attempts > 0) {
        totalAttempts += p.attempts;
        totalPasses += p.passCount;
        totalFailures += p.failureCount;
        highestScore = Math.max(highestScore, p.bestScore);
        scoreSum += p.bestScore;
        attemptedScenariosCount += 1;

        if (p.lastAttemptAt && (!lastActivityAt || p.lastAttemptAt > lastActivityAt)) {
          lastActivityAt = p.lastAttemptAt;
        }

        if (p.masteryState === 'MASTERED') {
          masteredLabs += 1;
          completedLabs += 1;
        } else if (p.masteryState === 'COMPLETED') {
          completedLabs += 1;
        } else if (p.masteryState === 'PRACTICING') {
          practicingLabs += 1;
        }
      } else {
        notStartedLabs += 1;
      }
    });

    const averageScore = attemptedScenariosCount > 0 ? Math.round(scoreSum / attemptedScenariosCount) : 0;
    const totalScenarios = scenarios.length;
    const completionPercentage = totalScenarios > 0 ? Math.round((completedLabs / totalScenarios) * 100) : 0;

    // BYOA Stats
    const byoaValidationsCount = await ValidationResult.countDocuments({ user: userId, isBYOA: true });

    return {
      totalScenarios,
      completedLabs,
      masteredLabs,
      practicingLabs,
      notStartedLabs,
      completedScenarios: completedLabs,
      masteredScenarios: masteredLabs,
      practicingScenarios: practicingLabs,
      notStartedScenarios: notStartedLabs,
      totalAttempts,
      totalPasses,
      totalFailures,
      totalValidatedLabs: attemptedScenariosCount,
      averageScore,
      highestScore,
      completionPercentage,
      lastActivityAt,
      byoaValidationsCount,
    };
  },

  /**
   * Get all scenario mastery statuses for a learner
   * @param {string} userId
   * @returns {Array<Object>} List of scenario mastery items
   */
  getScenarioMasteryList: async (userId) => {
    await scenarioService.seedDefaultScenarios();
    const scenarios = await FailureScenario.find({ enabled: true }).sort({ difficulty: 1 });
    const userProgressRecords = await LearnerProgress.find({ user: userId });

    const progressMap = new Map();
    userProgressRecords.forEach((p) => progressMap.set(p.scenarioId, p));

    return scenarios.map((sc) => {
      const p = progressMap.get(sc.scenarioId);
      const attempts = p ? p.attempts : 0;
      const passCount = p ? p.passCount : 0;
      const failureCount = p ? p.failureCount : 0;
      const bestScore = p ? p.bestScore : 0;
      const latestScore = p ? p.latestScore : 0;
      const masteryState = p ? p.masteryState : 'NOT_STARTED';

      return {
        scenarioId: sc.scenarioId,
        name: sc.name,
        topic: sc.category || 'Reliability',
        difficulty: sc.difficulty || 'Beginner',
        description: sc.description,
        objective: sc.objective,
        expectedFailure: sc.expectedFailure,
        attempts,
        passCount,
        failureCount,
        bestScore,
        latestScore,
        masteryState,
        firstAttemptAt: p?.firstAttemptAt || null,
        lastAttemptAt: p?.lastAttemptAt || null,
        completedAt: p?.completedAt || null,
        masteredAt: p?.masteredAt || null,
      };
    });
  },

  /**
   * Get topic-level progress breakdown
   * @param {string} userId
   * @returns {Array<Object>} Topic progress items
   */
  getTopicProgressList: async (userId) => {
    const scenarioMasteryList = await progressService.getScenarioMasteryList(userId);

    const topicMap = new Map();

    scenarioMasteryList.forEach((sc) => {
      const topic = sc.topic || 'Reliability';
      if (!topicMap.has(topic)) {
        topicMap.set(topic, {
          topic,
          totalScenarios: 0,
          completedScenarios: 0,
          masteredScenarios: 0,
          practicingScenarios: 0,
          notStartedScenarios: 0,
          scoreSum: 0,
          attemptedCount: 0,
          scenarios: [],
        });
      }

      const t = topicMap.get(topic);
      t.totalScenarios += 1;
      t.scenarios.push({
        scenarioId: sc.scenarioId,
        name: sc.name,
        difficulty: sc.difficulty,
        masteryState: sc.masteryState,
        bestScore: sc.bestScore,
      });

      if (sc.masteryState === 'MASTERED') {
        t.masteredScenarios += 1;
        t.completedScenarios += 1;
        t.scoreSum += sc.bestScore;
        t.attemptedCount += 1;
      } else if (sc.masteryState === 'COMPLETED') {
        t.completedScenarios += 1;
        t.scoreSum += sc.bestScore;
        t.attemptedCount += 1;
      } else if (sc.masteryState === 'PRACTICING') {
        t.practicingScenarios += 1;
        t.scoreSum += sc.bestScore;
        t.attemptedCount += 1;
      } else {
        t.notStartedScenarios += 1;
      }
    });

    return Array.from(topicMap.values()).map((t) => ({
      topic: t.topic,
      totalScenarios: t.totalScenarios,
      completedScenarios: t.completedScenarios,
      masteredScenarios: t.masteredScenarios,
      practicingScenarios: t.practicingScenarios,
      notStartedScenarios: t.notStartedScenarios,
      completionPercentage: t.totalScenarios > 0 ? Math.round((t.completedScenarios / t.totalScenarios) * 100) : 0,
      averageScore: t.attemptedCount > 0 ? Math.round(t.scoreSum / t.attemptedCount) : 0,
      scenarios: t.scenarios,
    }));
  },

  /**
   * Get recent practice validation history for learner
   * @param {string} userId
   * @param {number} limit
   * @returns {Array<Object>} Recent practice entries
   */
  getRecentPractice: async (userId, limit = 10) => {
    const validations = await ValidationResult.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    await scenarioService.seedDefaultScenarios();
    const scenarios = await FailureScenario.find({});
    const scenarioMap = new Map();
    scenarios.forEach((s) => scenarioMap.set(s.scenarioId, s));

    return validations.map((v) => {
      const sc = scenarioMap.get(v.scenario);
      return {
        validationId: v._id,
        scenarioId: v.scenario,
        scenarioName: sc?.name || (v.isBYOA ? 'Custom Application (BYOA)' : v.scenario),
        topic: sc?.category || (v.isBYOA ? 'BYOA' : 'Reliability'),
        status: v.status,
        score: v.score,
        attemptNumber: v.attemptNumber,
        summary: v.summary,
        checksPassed: v.checks?.filter((c) => c.status === 'PASS').length || 0,
        totalChecks: v.checks?.length || 0,
        isBYOA: v.isBYOA || v.scenario === 'byoa',
        validatedAt: v.validatedAt || v.createdAt,
      };
    });
  },

  /**
   * Deterministic recommendation engine
   * Priorities:
   * 1. Scenarios with repeated failures (>= 2 fails and passCount === 0)
   * 2. Completed scenarios with low score (< 90)
   * 3. Not-started scenarios (Beginner -> Intermediate -> Advanced)
   * 4. Currently practicing scenarios
   * @param {string} userId
   * @param {number} [limit]
   * @returns {Array<Object>} Ranked recommendations
   */
  getRecommendations: async (userId, limit = 10) => {
    const scenarioMasteryList = await progressService.getScenarioMasteryList(userId);

    const difficultyWeights = { Beginner: 1, Intermediate: 2, Advanced: 3 };

    const repeatedFailures = [];
    const lowScoreCompleted = [];
    const notStarted = [];
    const practicing = [];
    const mastered = [];

    scenarioMasteryList.forEach((sc) => {
      if (sc.failureCount >= 2 && sc.passCount === 0) {
        repeatedFailures.push({
          scenarioId: sc.scenarioId,
          name: sc.name,
          topic: sc.topic,
          difficulty: sc.difficulty,
          bestScore: sc.bestScore,
          masteryState: sc.masteryState,
          priority: 1,
          badge: 'High Priority',
          priorityReason: 'Repeated Failures (Needs Remediation)',
          reason: `You have attempted this scenario ${sc.attempts} times without a successful validation. Focus on analyzing container exit codes and logs.`,
        });
      } else if (sc.passCount >= 1 && sc.bestScore < 90) {
        lowScoreCompleted.push({
          scenarioId: sc.scenarioId,
          name: sc.name,
          topic: sc.topic,
          difficulty: sc.difficulty,
          bestScore: sc.bestScore,
          masteryState: sc.masteryState,
          priority: 2,
          badge: 'Improve Score',
          priorityReason: 'Score Improvement (< 90%)',
          reason: `You resolved this scenario with a score of ${sc.bestScore}/100. Practice again to achieve full 100/100 mastery.`,
        });
      } else if (sc.masteryState === 'NOT_STARTED') {
        notStarted.push({
          scenarioId: sc.scenarioId,
          name: sc.name,
          topic: sc.topic,
          difficulty: sc.difficulty,
          bestScore: 0,
          masteryState: sc.masteryState,
          priority: 3,
          badge: 'New Practice',
          priorityReason: `Next ${sc.difficulty} Practice (Not Started)`,
          reason: `Foundational ${sc.difficulty.toLowerCase()} troubleshooting practice in ${sc.topic}. Great next step for skill progression.`,
        });
      } else if (sc.masteryState === 'PRACTICING') {
        practicing.push({
          scenarioId: sc.scenarioId,
          name: sc.name,
          topic: sc.topic,
          difficulty: sc.difficulty,
          bestScore: sc.bestScore,
          masteryState: sc.masteryState,
          priority: 4,
          badge: 'In Progress',
          priorityReason: 'Active In-Progress Practice',
          reason: `Continue working on this active scenario to achieve your first successful validation PASS.`,
        });
      } else {
        mastered.push({
          scenarioId: sc.scenarioId,
          name: sc.name,
          topic: sc.topic,
          difficulty: sc.difficulty,
          bestScore: sc.bestScore,
          masteryState: sc.masteryState,
          priority: 5,
          badge: 'Mastered',
          priorityReason: 'Practice Retention (Mastered)',
          reason: `You have mastered this scenario. Practice periodically to maintain diagnostic fluency.`,
        });
      }
    });

    // Sort notStarted by difficulty (Beginner -> Intermediate -> Advanced)
    notStarted.sort((a, b) => (difficultyWeights[a.difficulty] || 1) - (difficultyWeights[b.difficulty] || 1));

    // Combine in deterministic priority order
    const combined = [
      ...repeatedFailures,
      ...lowScoreCompleted,
      ...notStarted,
      ...practicing,
      ...mastered,
    ];

    return combined.slice(0, limit);
  },
};

export default progressService;
