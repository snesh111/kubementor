import { useSelector, useDispatch } from 'react-redux';
import {
  fetchScenarios,
  triggerScenarioStart,
  fetchScenarioAttempts,
  cancelAttempt,
  clearScenarioErrors,
  clearActiveAttempt,
} from '../redux/slices/scenarioSlice';

export const useScenarios = () => {
  const dispatch = useDispatch();
  const {
    scenarios,
    activeAttempt,
    attemptsHistory,
    loading,
    actionLoading,
    error,
  } = useSelector((state) => state.scenario);

  return {
    scenarios,
    activeAttempt,
    attemptsHistory,
    loading,
    actionLoading,
    error,
    loadScenarios: (projectId) => dispatch(fetchScenarios(projectId)),
    startScenario: (projectId, scenarioId, deploymentId) =>
      dispatch(triggerScenarioStart({ projectId, scenarioId, deploymentId })),
    loadAttempts: (projectId) => dispatch(fetchScenarioAttempts(projectId)),
    cancelScenario: (projectId, attemptId) => dispatch(cancelAttempt({ projectId, attemptId })),
    clearErrors: () => dispatch(clearScenarioErrors()),
    resetAttempt: () => dispatch(clearActiveAttempt()),
  };
};

export default useScenarios;
