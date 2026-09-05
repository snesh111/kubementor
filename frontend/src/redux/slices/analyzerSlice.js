import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import analyzerService from '../../services/analyzerService';

export const runAnalysis = createAsyncThunk(
  'analyzer/runAnalysis',
  async ({ projectId, fileIds }, { rejectWithValue }) => {
    try {
      const response = await analyzerService.analyzeFiles(projectId, fileIds);
      return response.data.report;
    } catch (err) {
      return rejectWithValue(err.message || 'Analysis failed');
    }
  }
);

export const fetchAnalysisHistory = createAsyncThunk(
  'analyzer/fetchAnalysisHistory',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await analyzerService.getAnalysisHistory(projectId);
      return response.data.history;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch analysis history');
    }
  }
);

export const fetchAnalysisReport = createAsyncThunk(
  'analyzer/fetchAnalysisReport',
  async ({ projectId, analysisId }, { rejectWithValue }) => {
    try {
      const response = await analyzerService.getAnalysisReportById(projectId, analysisId);
      return response.data.report;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch analysis report');
    }
  }
);

const initialState = {
  currentReport: null,
  history: [],
  analyzing: false,
  historyLoading: false,
  reportLoading: false,
  error: null,
};

export const analyzerSlice = createSlice({
  name: 'analyzer',
  initialState,
  reducers: {
    clearAnalyzerError: (state) => {
      state.error = null;
    },
    clearCurrentReport: (state) => {
      state.currentReport = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Run Analysis
      .addCase(runAnalysis.pending, (state) => {
        state.analyzing = true;
        state.error = null;
      })
      .addCase(runAnalysis.fulfilled, (state, action) => {
        state.analyzing = false;
        state.currentReport = action.payload;
        state.history.unshift({
          _id: action.payload._id,
          overallScore: action.payload.overallScore,
          categoryScores: action.payload.categoryScores,
          analyzedFiles: action.payload.analyzedFiles,
          createdAt: action.payload.createdAt,
        });
      })
      .addCase(runAnalysis.rejected, (state, action) => {
        state.analyzing = false;
        state.error = action.payload;
      })

      // Fetch History
      .addCase(fetchAnalysisHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchAnalysisHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.history = action.payload;
      })
      .addCase(fetchAnalysisHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.error = action.payload;
      })

      // Fetch Report by ID
      .addCase(fetchAnalysisReport.pending, (state) => {
        state.reportLoading = true;
        state.error = null;
      })
      .addCase(fetchAnalysisReport.fulfilled, (state, action) => {
        state.reportLoading = false;
        state.currentReport = action.payload;
      })
      .addCase(fetchAnalysisReport.rejected, (state, action) => {
        state.reportLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAnalyzerError, clearCurrentReport } = analyzerSlice.actions;
export default analyzerSlice.reducer;
