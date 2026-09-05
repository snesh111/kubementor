import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import validationService from '../../services/validationService';

export const runValidation = createAsyncThunk(
  'validation/runValidation',
  async ({ projectId, attemptId, fileIds }, { rejectWithValue }) => {
    try {
      const response = await validationService.validateFix(projectId, attemptId, fileIds);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Solution validation failed');
    }
  }
);

export const fetchLatestValidation = createAsyncThunk(
  'validation/fetchLatestValidation',
  async ({ projectId, attemptId }, { rejectWithValue }) => {
    try {
      const response = await validationService.getLatestValidation(projectId, attemptId);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch latest validation result');
    }
  }
);

export const fetchValidationsHistory = createAsyncThunk(
  'validation/fetchValidationsHistory',
  async ({ projectId, attemptId }, { rejectWithValue }) => {
    try {
      const response = await validationService.getValidationsHistory(projectId, attemptId);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch validation history');
    }
  }
);

const initialState = {
  latestResult: null,
  history: [],
  validating: false,
  stepIndex: 0,
  error: null,
};

export const validationSlice = createSlice({
  name: 'validation',
  initialState,
  reducers: {
    clearValidationError: (state) => {
      state.error = null;
    },
    resetValidation: (state) => {
      state.latestResult = null;
      state.history = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Run Validation
      .addCase(runValidation.pending, (state) => {
        state.validating = true;
        state.error = null;
        state.stepIndex = 0;
      })
      .addCase(runValidation.fulfilled, (state, action) => {
        state.validating = false;
        state.latestResult = action.payload;
        if (action.payload) {
          state.history.unshift(action.payload);
        }
      })
      .addCase(runValidation.rejected, (state, action) => {
        state.validating = false;
        state.error = action.payload;
      })

      // Fetch Latest Validation
      .addCase(fetchLatestValidation.fulfilled, (state, action) => {
        state.latestResult = action.payload;
      })

      // Fetch Validation History
      .addCase(fetchValidationsHistory.fulfilled, (state, action) => {
        state.history = action.payload || [];
      });
  },
});

export const { clearValidationError, resetValidation } = validationSlice.actions;
export default validationSlice.reducer;
