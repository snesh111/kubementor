import geminiProvider from './geminiProvider.js';
import promptTemplates from './promptTemplates.js';
import { formatContextForAI } from './contextFormatter.js';

export const troubleshootingEngine = {
  /**
   * Process AI Mentor request using Gemini or context-grounded fallback
   */
  processMentorRequest: async (mode, snapshotObj, extraParams = {}) => {
    const formattedContext = formatContextForAI(snapshotObj);
    const systemPrompt = promptTemplates.getSystemPrompt();

    let userPrompt = '';
    switch (mode) {
      case 'diagnose':
        userPrompt = promptTemplates.buildDiagnosisPrompt(formattedContext);
        break;
      case 'hint':
        userPrompt = promptTemplates.buildHintPrompt(formattedContext, extraParams.level || 1);
        break;
      case 'explain':
        userPrompt = promptTemplates.buildExplainEvidencePrompt(formattedContext, extraParams.topic || 'events');
        break;
      case 'concept':
        userPrompt = promptTemplates.buildConceptPrompt(formattedContext, extraParams.conceptQuery || 'CrashLoopBackOff');
        break;
      case 'chat':
        userPrompt = promptTemplates.buildChatPrompt(formattedContext, extraParams.message || 'Why is my pod crashing?');
        break;
      default:
        userPrompt = promptTemplates.buildDiagnosisPrompt(formattedContext);
        break;
    }

    // Call Gemini API
    const geminiResult = await geminiProvider.generateResponse(systemPrompt, userPrompt);

    if (!geminiResult.isFallback && geminiResult.text) {
      try {
        const parsedJSON = JSON.parse(geminiResult.text);
        if (parsedJSON && parsedJSON.diagnosis) {
          return parsedJSON;
        }
      } catch (err) {
        console.warn('[Troubleshooting Engine] Could not parse Gemini JSON response. Using structured parser fallback.');
      }
    }

    // Fallback context-grounded response engine
    return troubleshootingEngine.buildGroundedFallbackResponse(mode, snapshotObj, extraParams);
  },

  /**
   * Deterministic context-grounded fallback reasoning engine
   */
  buildGroundedFallbackResponse: (mode, snapshotObj, extraParams = {}) => {
    const ctx = snapshotObj?.context || {};
    const scenario = ctx.scenario || {};
    const pod = ctx.pods?.[0] || {};
    const container = pod.containers?.[0] || {};
    const observed = ctx.observedFailure || {};
    const level = extraParams.level || 1;

    const expectedFailure = scenario.expectedFailure || observed.status || 'CrashLoopBackOff';
    const podName = pod.name || 'sandbox-pod';
    const restarts = pod.restarts || 0;
    const exitCode = container.exitCode ?? 1;

    let confidence = 'high';
    if (!pod.name) confidence = 'low';

    const hints = {
      1: `Direction: Inspect the container status and recent restart events for '${podName}'.`,
      2: `Evidence: Container is in state '${container.state || 'Waiting'}' with reason '${expectedFailure}', exit code ${exitCode}, and ${restarts} restart(s).`,
      3: `Root Cause: The container process terminates shortly after startup, causing Kubernetes to repeatedly restart it (${expectedFailure}).`,
      4: `Suggested Fix: Review the container command/entrypoint or resource specs in your deployment manifest and ensure the process runs continuously.`,
    };

    return {
      diagnosis: {
        summary: `The application container in pod '${podName}' has entered '${expectedFailure}' state with ${restarts} restart(s).`,
        confidence,
      },
      observations: [
        `Pod '${podName}' is in phase '${pod.phase || 'Running'}' (Ready: ${pod.ready ? 'True' : 'False'})`,
        `Container '${container.name || 'nginx'}' exited with code ${exitCode} and restart count ${restarts}`,
        `Observed failure status: '${expectedFailure}'`,
      ],
      likelyCause: `Container process inside '${podName}' is exiting with failure condition '${expectedFailure}'.`,
      evidence: [
        `Pod status: ${expectedFailure}`,
        `Container exit code: ${exitCode}`,
        `Restart count: ${restarts}`,
        `Recent event: Back-off restarting failed container`,
      ],
      nextSteps: [
        'Inspect container startup logs using the System Diagnosis Context panel',
        'Verify container image, command, entrypoint, and resource limits in the deployment file',
        'Check Kubernetes events for image pull or resource quota issues',
      ],
      hintLevel: level,
      hint: hints[level] || hints[1],
      warning: snapshotObj ? null : 'Context telemetry is partial or unavailable.',
    };
  },
};

export default troubleshootingEngine;
