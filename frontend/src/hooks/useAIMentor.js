import { useSelector, useDispatch } from 'react-redux';
import {
  fetchDiagnosis,
  requestHint,
  sendChatMessage,
  fetchChatHistory,
  clearAIError,
  resetAIMentor,
} from '../redux/slices/aiSlice';

export const useAIMentor = () => {
  const dispatch = useDispatch();
  const {
    diagnosis,
    activeHintLevel,
    activeHint,
    messages,
    loading,
    hintLoading,
    chatLoading,
    error,
  } = useSelector((state) => state.ai);

  return {
    diagnosis,
    activeHintLevel,
    activeHint,
    messages,
    loading,
    hintLoading,
    chatLoading,
    error,
    loadDiagnosis: (projectId, attemptId) => dispatch(fetchDiagnosis({ projectId, attemptId })),
    getHintLevel: (projectId, attemptId, level) => dispatch(requestHint({ projectId, attemptId, level })),
    sendUserMessage: (projectId, attemptId, message) => dispatch(sendChatMessage({ projectId, attemptId, message })),
    loadHistory: (projectId, attemptId) => dispatch(fetchChatHistory({ projectId, attemptId })),
    clearError: () => dispatch(clearAIError()),
    reset: () => dispatch(resetAIMentor()),
  };
};

export default useAIMentor;
