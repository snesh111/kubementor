import { useSelector, useDispatch } from 'react-redux';
import {
  runValidation,
  fetchLatestValidation,
  fetchValidationsHistory,
  clearValidationError,
  resetValidation,
} from '../redux/slices/validationSlice';

export const useValidation = () => {
  const dispatch = useDispatch();
  const { latestResult, history, validating, stepIndex, error } = useSelector((state) => state.validation);

  return {
    latestResult,
    history,
    validating,
    stepIndex,
    error,
    validateSolution: (projectId, attemptId, fileIds) =>
      dispatch(runValidation({ projectId, attemptId, fileIds })),
    loadLatestResult: (projectId, attemptId) =>
      dispatch(fetchLatestValidation({ projectId, attemptId })),
    loadHistory: (projectId, attemptId) =>
      dispatch(fetchValidationsHistory({ projectId, attemptId })),
    clearError: () => dispatch(clearValidationError()),
    reset: () => dispatch(resetValidation()),
  };
};

export default useValidation;
