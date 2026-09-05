import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import scenarioService from '../../services/scenarioService';

export const fetchScenarios = createAsyncThunk(
  'scenarios/fetchScenarios',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await scenarioService.getScenarios(projectId);
      return response.data.scenarios;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch failure scenarios');
    }
  }
);

export const triggerScenarioStart = createAsyncThunk(
  'scenarios/triggerScenarioStart',
  async ({ projectId, scenarioId, deploymentId }, { rejectWithValue }) => {
    try {
      const response = await scenarioService.startScenario(projectId, scenarioId, deploymentId);
      return response.data.attempt;
    } catch (err) {
      return rejectWithValue(err.message || 'Scenario injection failed');
    }
  }
);

export const fetchScenarioAttempts = createAsyncThunk(
  'scenarios/fetchScenarioAttempts',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await scenarioService.getScenarioAttempts(projectId);
      return response.data.attempts;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch scenario attempts');
    }
  }
);

export const cancelAttempt = createAsyncThunk(
  'scenarios/cancelAttempt',
  async ({ projectId, attemptId }, { rejectWithValue }) => {
    try {
      const response = await scenarioService.cancelScenarioAttempt(projectId, attemptId);
      return response.data.attempt;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to cancel scenario attempt');
    }
  }
);

const initialState = {
  scenarios: [],
  activeAttempt: null,
  attemptsHistory: [],
  loading: false,
  actionLoading: false,
  error: null,
};

export const scenarioSlice = createSlice({
  name: 'scenarios',
  initialState,
  reducers: {
    clearScenarioErrors: (state) => {
      state.error = null;
    },
    clearActiveAttempt: (state) => {
      state.activeAttempt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Scenarios
      .addCase(fetchScenarios.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchScenarios.fulfilled, (state, action) => {
        state.loading = false;
        state.scenarios = action.payload;
      })
      .addCase(fetchScenarios.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Start Scenario
      .addCase(triggerScenarioStart.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(triggerScenarioStart.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.activeAttempt = action.payload;
        state.attemptsHistory.unshift(action.payload);
      })
      .addCase(triggerScenarioStart.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Fetch Attempts History
      .addCase(fetchScenarioAttempts.fulfilled, (state, action) => {
        state.attemptsHistory = action.payload;
        if (action.payload.length > 0) {
          const active = action.payload.find((a) => a.status === 'active' || a.status === 'injecting');
          if (active) state.activeAttempt = active;
        }
      })

      // Cancel Attempt
      .addCase(cancelAttempt.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(cancelAttempt.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.activeAttempt = null;
        const index = state.attemptsHistory.findIndex((a) => a._id === action.payload._id);
        if (index !== -1) {
          state.attemptsHistory[index] = action.payload;
        }
      })
      .addCase(cancelAttempt.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearScenarioErrors, clearActiveAttempt } = scenarioSlice.actions;
export default scenarioSlice.reducer;
