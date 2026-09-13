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
        userPrompt = promptTemplates.buildConceptPrompt(formattedContext, extraParams.conceptQuery || 'Kubernetes Troubleshooting');
        break;
      case 'chat':
        userPrompt = promptTemplates.buildChatPrompt(formattedContext, extraParams.message || 'What is the issue with my workload?');
        break;
      default:
        userPrompt = promptTemplates.buildDiagnosisPrompt(formattedContext);
        break;
    }

    // Call Gemini API if available
    const geminiResult = await geminiProvider.generateResponse(systemPrompt, userPrompt);

    if (!geminiResult.isFallback && geminiResult.text) {
      const parsedJSON = extractAndParseJSON(geminiResult.text);
      if (parsedJSON && (parsedJSON.diagnosis || parsedJSON.hint || parsedJSON.likelyCause || parsedJSON.observations)) {
        parsedJSON.provider = 'gemini';
        parsedJSON.model = geminiResult.model || 'gemini-3.6-flash';
        parsedJSON.isFallback = false;
        return parsedJSON;
      }
      console.warn('[Troubleshooting Engine] Could not parse Gemini JSON response. Using structured parser fallback.');
    }

    // Fallback context-grounded response engine
    const fallbackResponse = troubleshootingEngine.buildGroundedFallbackResponse(mode, snapshotObj, extraParams);
    fallbackResponse.provider = 'fallback';
    fallbackResponse.isFallback = true;
    if (geminiResult.error) {
      fallbackResponse.fallbackReason = geminiResult.error;
    }
    return fallbackResponse;
  },

  /**
   * Deterministic context-grounded fallback reasoning engine across all 6 scenarios and health states
   */
  buildGroundedFallbackResponse: (mode, snapshotObj, extraParams = {}) => {
    const ctx = snapshotObj?.context || {};
    const scenario = ctx.scenario || {};
    const pod = ctx.pods?.[0] || {};
    const container = pod.containers?.[0] || {};
    const observed = ctx.observedFailure || {};
    const events = ctx.events || [];
    const deployment = ctx.deployment || {};
    const services = ctx.services || [];
    const ingresses = ctx.ingresses || [];
    const configMaps = ctx.configMaps || [];
    const scratchpad = ctx.scratchpad || snapshotObj?.scratchpad || {};
    const level = extraParams.level || 1;
    const userMessage = (extraParams.message || '').toLowerCase();

    const scenarioId = scenario.id || observed.affectedResource || 'crash-loop-backoff';
    const podName = pod.name || 'web-app-pod';
    const restarts = pod.restarts || 0;
    const exitCode = container.exitCode;
    const isPodReady = pod.ready === true;
    const isRunningPhase = pod.phase === 'Running';
    const isWorkloadHealthy = isPodReady && isRunningPhase && (!observed.status || observed.status === 'Running' || observed.status === 'Ready');

    // Handle Healthy/Resolved State
    if (isWorkloadHealthy) {
      return {
        diagnosis: {
          summary: `Workload '${deployment.name || 'web-app'}' is Healthy and Running (1/1 Ready). The previous failure condition is resolved.`,
          confidence: 'high',
        },
        observations: [
          `Pod '${podName}' is in phase 'Running' with Ready status True`,
          `Container '${container.name || 'nginx'}' is active with 0 current restart loops`,
          `Observed status: Healthy / Operational`,
        ],
        likelyCause: 'All required configurations, resources, and dependencies are correctly satisfied.',
        evidence: [
          `Pod status: Running (Ready: True)`,
          `Replicas: Available ${deployment.availableReplicas || 1} / Desired ${deployment.replicas || 1}`,
          `Recent event: Container started successfully`,
        ],
        nextSteps: [
          'Verify application endpoints via terminal (curl or kubectl get pods)',
          'Review your investigation notes in the Scratchpad to consolidate learnings',
        ],
        hintLevel: level,
        hint: 'Your workload is running and healthy! The issue has been successfully resolved in the sandbox.',
        warning: null,
      };
    }

    // Detailed Scenario-specific knowledge base
    const scenarioProfiles = {
      'crash-loop-backoff': {
        name: 'CrashLoopBackOff',
        summary: `Container in pod '${podName}' is in CrashLoopBackOff and repeatedly crashing shortly after start (Exit Code ${exitCode ?? 1}).`,
        likelyCause: 'The configured container startup command or entrypoint process exits with a non-zero exit code, causing Kubernetes to enter CrashLoopBackOff.',
        evidence: [
          `Pod Phase: ${pod.phase || 'Running'} (Ready: False)`,
          `Container State: Waiting (Reason: CrashLoopBackOff)`,
          `Exit Code: ${exitCode ?? 1} | Restarts: ${restarts}`,
          `Event: Back-off restarting failed container`,
        ],
        nextSteps: [
          `Run 'kubectl logs ${podName}' to inspect application crash output`,
          `Run 'kubectl describe pod ${podName}' to check container Last State termination reason`,
          'Inspect the "command" or "args" field in deployment.yaml',
        ],
        hints: {
          1: `Direction: Start by checking the container's last termination reason and exit code using 'kubectl describe pod ${podName}'.`,
          2: `Evidence: The container exits with code ${exitCode ?? 1} and restart count is ${restarts}. This indicates process-level termination rather than an OOM kill.`,
          3: `Root Cause: The deployment defines a container startup command (e.g. 'exit 1') that forces the process to terminate immediately upon launch.`,
          4: `Suggested Fix: In deployment.yaml, remove or fix the failing 'command: ["/bin/sh", "-c", "... exit 1"]' block so nginx starts its default process.`,
        },
      },
      'image-pull-backoff': {
        name: 'ImagePullBackOff',
        summary: `Pod '${podName}' cannot pull the requested container image from registry.`,
        likelyCause: 'The specified container image tag or repository does not exist or is mistyped in the deployment manifest.',
        evidence: [
          `Pod Phase: ${pod.phase || 'Pending'} (Ready: False)`,
          `Container State: Waiting (Reason: ImagePullBackOff / ErrImagePull)`,
          `Event: Failed to pull image: repository or tag not found`,
        ],
        nextSteps: [
          `Run 'kubectl describe pod ${podName}' to view the exact image pull error`,
          'Inspect the container "image" field in deployment.yaml',
          'Verify the image tag against available versions (e.g. nginx:1.25.3)',
        ],
        hints: {
          1: `Direction: Inspect pod events using 'kubectl describe pod ${podName}' to see why the container image failed to download.`,
          2: `Evidence: Kubernetes reports ErrImagePull / ImagePullBackOff because the container image tag is invalid or nonexistent.`,
          3: `Root Cause: The deployment specifies a nonexistent container image tag (e.g. nginx:1.25.3-nonexistent-release-v99).`,
          4: `Suggested Fix: In deployment.yaml, update the container image to a valid version such as 'nginx:1.25.3' and redeploy.`,
        },
      },
      'oom-killed': {
        name: 'OOMKilled',
        summary: `Container in pod '${podName}' exceeded its allocated memory limit and was terminated (Exit Code 137).`,
        likelyCause: 'The container memory limit configured in deployment.yaml is too low for the application runtime footprint.',
        evidence: [
          `Pod Phase: ${pod.phase || 'Running'} (Ready: False)`,
          `Container State: Terminated (Reason: OOMKilled, Exit Code: 137)`,
          `Event: Killed process inside container (memory limit exceeded)`,
        ],
        nextSteps: [
          `Run 'kubectl describe pod ${podName}' and check 'Last State: Terminated (Reason: OOMKilled)'`,
          'Inspect resources.limits.memory in deployment.yaml',
          'Increase the memory limit to allow standard application execution (e.g. 256Mi or 512Mi)',
        ],
        hints: {
          1: `Direction: Check the pod's last termination reason and exit code. An exit code of 137 indicates a SIGKILL signal.`,
          2: `Evidence: The container was terminated with Reason 'OOMKilled' (Exit Code 137) because memory consumption exceeded resources.limits.memory.`,
          3: `Root Cause: The memory limit in deployment.yaml is severely constrained (e.g. 16Mi), causing the Linux OOM-killer to terminate the container.`,
          4: `Suggested Fix: In deployment.yaml, increase 'resources.limits.memory' from 16Mi to at least 256Mi and redeploy.`,
        },
      },
      'missing-configmap': {
        name: 'Missing ConfigMap',
        summary: `Pod '${podName}' is blocked in CreateContainerConfigError because a referenced ConfigMap is missing.`,
        likelyCause: 'The deployment references a ConfigMap in envFrom or volumes that does not exist in the namespace.',
        evidence: [
          `Pod Phase: ${pod.phase || 'Pending'} (Ready: False)`,
          `Container State: Waiting (Reason: CreateContainerConfigError)`,
          `Event: configmap "app-config" not found`,
        ],
        nextSteps: [
          `Run 'kubectl describe pod ${podName}' to see the missing ConfigMap reference`,
          `Run 'kubectl get configmaps' to see which ConfigMaps currently exist`,
          'Create the missing ConfigMap or ensure the referenced name in configmap.yaml matches the deployment',
        ],
        hints: {
          1: `Direction: Check why the container cannot create its configuration. Run 'kubectl describe pod ${podName}' to see what resource is missing.`,
          2: `Evidence: The container state is 'CreateContainerConfigError' with event 'configmap "app-config" not found'.`,
          3: `Root Cause: The deployment expects environment variables or volumes from a ConfigMap named 'app-config' which has not been created or is misnamed.`,
          4: `Suggested Fix: Check configmap.yaml in the YAML Editor, ensure its name is 'app-config', save, and redeploy all manifests.`,
        },
      },
      'service-connectivity': {
        name: 'Service Connectivity & Selector Mismatch',
        summary: `Service 'web-service' has 0 active endpoints because its selector does not match the pod labels.`,
        likelyCause: 'The Service spec.selector label (e.g. app: mismatched-label) does not match the Deployment template labels (app: web-app).',
        evidence: [
          `Service 'web-service' Endpoints: <none>`,
          `Service Selector: ${JSON.stringify(services[0]?.selector || { app: 'mismatched-label' })}`,
          `Pod Labels: app=web-app`,
          `Event: Endpoints empty for service "web-service"`,
        ],
        nextSteps: [
          `Run 'kubectl get endpoints web-service' to inspect active backend endpoints`,
          `Run 'kubectl describe service web-service' to check the configured selector`,
          'Compare the selector in service.yaml with the labels in deployment.yaml',
        ],
        hints: {
          1: `Direction: Inspect the service routing backend endpoints by running 'kubectl get endpoints web-service'.`,
          2: `Evidence: The Service has 0 endpoints because its selector does not target any running pod labels in the namespace.`,
          3: `Root Cause: The Service in service.yaml defines selector 'app: mismatched-label', whereas the pods are labeled 'app: web-app'.`,
          4: `Suggested Fix: In service.yaml, update 'spec.selector.app' to 'web-app' so Kubernetes automatically binds the pod to the service endpoints.`,
        },
      },
      'ingress-tls-failure': {
        name: 'Ingress TLS Secret Failure',
        summary: `Ingress 'web-ingress' cannot establish HTTPS routing because its configured TLS secret is missing.`,
        likelyCause: 'The Ingress spec.tls[0].secretName references a secret that is nonexistent or not present in the namespace.',
        evidence: [
          `Ingress 'web-ingress' TLS Secret: ${ingresses[0]?.tlsSecretName || 'nonexistent-tls-secret-failure'}`,
          `Event: Secret "nonexistent-tls-secret-failure" not found`,
        ],
        nextSteps: [
          `Run 'kubectl describe ingress web-ingress' to verify TLS sync errors`,
          `Run 'kubectl get secrets' to inspect available TLS secret objects`,
          'Ensure the secretName in ingress.yaml matches the Secret metadata.name in secret.yaml',
        ],
        hints: {
          1: `Direction: Inspect Ingress TLS configuration and check pod events with 'kubectl describe ingress web-ingress'.`,
          2: `Evidence: Ingress controller reports a SyncError because the referenced TLS secret does not exist in the namespace.`,
          3: `Root Cause: Ingress specifies secretName 'nonexistent-tls-secret-failure', but secret.yaml creates 'example-tls-secret'.`,
          4: `Suggested Fix: In ingress.yaml, change 'secretName' to 'example-tls-secret' to match the actual TLS secret manifest and redeploy.`,
        },
      },
    };

    const currentProfile = scenarioProfiles[scenarioId] || scenarioProfiles['crash-loop-backoff'];
    const currentHints = currentProfile.hints || scenarioProfiles['crash-loop-backoff'].hints;

    // Detect if user has a hypothesis in Scratchpad to acknowledge in chat
    let learnerContextAcknowledgement = '';
    if (scratchpad.hypothesis) {
      learnerContextAcknowledgement = ` I noticed in your Scratchpad that your hypothesis is: "${scratchpad.hypothesis}". Let's test that hypothesis against the runtime telemetry.`;
    }

    // Tailor diagnosis summary for wrong fixes (e.g. replicas changed but container still broken)
    let diagnosisSummary = currentProfile.summary;
    if (deployment.replicas > 1 && !isPodReady) {
      diagnosisSummary = `Although deployment replica count was modified to ${deployment.replicas}, the underlying issue persists: ${currentProfile.summary}`;
    }

    return {
      diagnosis: {
        summary: diagnosisSummary,
        confidence: 'high',
      },
      observations: [
        `Pod '${podName}' is in phase '${pod.phase || 'Unknown'}' (Ready: ${pod.ready ? 'True' : 'False'})`,
        `Observed failure condition: '${currentProfile.name}'`,
        ...currentProfile.evidence.slice(0, 2),
      ],
      likelyCause: `${currentProfile.likelyCause}${learnerContextAcknowledgement}`,
      evidence: currentProfile.evidence,
      nextSteps: currentProfile.nextSteps,
      hintLevel: level,
      hint: currentHints[level] || currentHints[1],
      warning: snapshotObj ? null : 'Context telemetry is partial or unavailable.',
    };
  },
};

const extractAndParseJSON = (rawText) => {
  if (!rawText) return null;
  const cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {}
    }
  }
  return null;
};

export default troubleshootingEngine;
