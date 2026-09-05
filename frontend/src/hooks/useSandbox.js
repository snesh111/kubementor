import { useSelector, useDispatch } from 'react-redux';
import {
  executeDeploy,
  fetchDeploymentHistory,
  fetchSandboxStatus,
  cleanupSandbox,
  clearSandboxErrors,
  clearActiveDeployment,
} from '../redux/slices/sandboxSlice';

export const useSandbox = () => {
  const dispatch = useDispatch();
  const {
    activeDeployment,
    liveStatus,
    history,
    deploying,
    statusLoading,
    actionLoading,
    error,
  } = useSelector((state) => state.sandbox);

  return {
    activeDeployment,
    liveStatus,
    history,
    deploying,
    statusLoading,
    actionLoading,
    error,
    deploy: (projectId, fileIds) => dispatch(executeDeploy({ projectId, fileIds })),
    loadHistory: (projectId) => dispatch(fetchDeploymentHistory(projectId)),
    loadStatus: (projectId, deploymentId) => dispatch(fetchSandboxStatus({ projectId, deploymentId })),
    stopSandbox: (projectId, deploymentId) => dispatch(cleanupSandbox({ projectId, deploymentId })),
    clearErrors: () => dispatch(clearSandboxErrors()),
    resetDeployment: () => dispatch(clearActiveDeployment()),
  };
};

export default useSandbox;
