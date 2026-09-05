export const buildHumanSummary = (contextObj) => {
  if (!contextObj) return null;

  const observed = contextObj.observedFailure || {};
  const pod = contextObj.pods?.[0] || {};
  const logs = contextObj.logs || {};
  const events = contextObj.events || [];
  const latestEvent = events[0] || {};

  return {
    observedStatus: observed.status || 'Failed',
    affectedResource: observed.affectedResource || 'Deployment/web-app',
    restartCount: pod.restarts || 0,
    exitCode: pod.containers?.[0]?.exitCode ?? (observed.status === 'CrashLoopBackOff' ? 1 : 0),
    waitingReason: pod.containers?.[0]?.reason || observed.reason || 'N/A',
    recentEvent: latestEvent.message || 'Back-off restarting failed container',
    logSnippet: typeof logs.content === 'string' ? logs.content.split('\n').slice(-3).join('\n') : 'No log lines available',
    logCount: logs.lines || 0,
    servicesCount: contextObj.services?.length || 0,
    ingressesCount: contextObj.ingresses?.length || 0,
  };
};

export default { buildHumanSummary };
