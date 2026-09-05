import { useSelector, useDispatch } from 'react-redux';
import {
  runAnalysis,
  fetchAnalysisHistory,
  fetchAnalysisReport,
  clearAnalyzerError,
  clearCurrentReport,
} from '../redux/slices/analyzerSlice';

export const useAnalyzer = () => {
  const dispatch = useDispatch();
  const {
    currentReport,
    history,
    analyzing,
    historyLoading,
    reportLoading,
    error,
  } = useSelector((state) => state.analyzer);

  return {
    currentReport,
    history,
    analyzing,
    historyLoading,
    reportLoading,
    error,
    analyzeFiles: (projectId, fileIds) => dispatch(runAnalysis({ projectId, fileIds })),
    loadHistory: (projectId) => dispatch(fetchAnalysisHistory(projectId)),
    loadReport: (projectId, analysisId) => dispatch(fetchAnalysisReport({ projectId, analysisId })),
    clearError: () => dispatch(clearAnalyzerError()),
    resetReport: () => dispatch(clearCurrentReport()),
  };
};

export default useAnalyzer;
