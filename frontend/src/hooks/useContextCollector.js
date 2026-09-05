import { useSelector, useDispatch } from 'react-redux';
import {
  fetchContext,
  recollectContext,
  clearContextError,
  clearContextSnapshot,
} from '../redux/slices/contextSlice';

export const useContextCollector = () => {
  const dispatch = useDispatch();
  const { currentSnapshot, loading, refreshing, error } = useSelector((state) => state.context);

  return {
    currentSnapshot,
    loading,
    refreshing,
    error,
    loadContext: (projectId, attemptId) => dispatch(fetchContext({ projectId, attemptId })),
    refreshDiagnosisContext: (projectId, attemptId) => dispatch(recollectContext({ projectId, attemptId })),
    clearError: () => dispatch(clearContextError()),
    resetContext: () => dispatch(clearContextSnapshot()),
  };
};

export default useContextCollector;
