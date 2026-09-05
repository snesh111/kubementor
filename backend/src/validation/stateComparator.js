export const compareSnapshots = (beforeSnapshot, afterSnapshot) => {
  const bCtx = beforeSnapshot?.context || {};
  const aCtx = afterSnapshot?.context || {};

  const bPod = bCtx.pods?.[0] || {};
  const aPod = aCtx.pods?.[0] || {};

  const bContainer = bPod.containers?.[0] || {};
  const aContainer = aPod.containers?.[0] || {};

  const bObserved = bCtx.observedFailure || {};
  const aObserved = aCtx.observedFailure || {};

  const bSvc = bCtx.services?.[0] || {};
  const aSvc = aCtx.services?.[0] || {};

  const bCm = bCtx.configMaps?.[0] || {};
  const aCm = aCtx.configMaps?.[0] || {};

  const bIng = bCtx.ingresses?.[0] || {};
  const aIng = aCtx.ingresses?.[0] || {};

  return {
    observedStatus: {
      before: bObserved.status || 'Failed',
      after: aObserved.status || 'Running',
      improved: aObserved.status !== bObserved.status && aObserved.status !== 'CrashLoopBackOff',
    },
    podPhase: {
      before: bPod.phase || 'Pending',
      after: aPod.phase || 'Running',
    },
    podReady: {
      before: bPod.ready ? true : false,
      after: aPod.ready ? true : false,
      improved: !bPod.ready && aPod.ready,
    },
    restartCount: {
      before: bPod.restarts || 0,
      after: aPod.restarts || 0,
    },
    containerState: {
      before: bContainer.state || 'Waiting',
      after: aContainer.state || 'Running',
    },
    exitCode: {
      before: bContainer.exitCode ?? 1,
      after: aContainer.exitCode ?? 0,
    },
    endpointCount: {
      before: bSvc.endpointCount || 0,
      after: aSvc.endpointCount || 0,
    },
    configMapExists: {
      before: bCm.exists ?? false,
      after: aCm.exists ?? true,
    },
    tlsSecretExists: {
      before: bIng.tlsSecretName ? false : false,
      after: aIng.tlsSecretName ? true : false,
    },
  };
};

export default { compareSnapshots };
