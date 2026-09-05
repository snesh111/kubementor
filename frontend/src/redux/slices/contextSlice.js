import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import contextService from '../../services/contextService';

export const fetchContext = createAsyncThunk(
  'context/fetchContext',
  async ({ projectId, attemptId }, { rejectWithValue }) => {
    try {
      const response = await contextService.getContext(projectId, attemptId);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch context snapshot');
    }
  }
);

export const recollectContext = createAsyncThunk(
  'context/recollectContext',
  async ({ projectId, attemptId }, { rejectWithValue }) => {
    try {
      const response = await contextService.refreshContext(projectId, attemptId);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to refresh context snapshot');
    }
  }
);

const initialState = {
  currentSnapshot: null,
  loading: false,
  refreshing: false,
  error: null,
};

export const contextSlice = createSlice({
  name: 'context',
  initialState,
  reducers: {
    clearContextError: (state) => {
      state.error = null;
    },
    clearContextSnapshot: (state) => {
      state.currentSnapshot = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Context
      .addCase(fetchContext.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContext.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSnapshot = action.payload;
      })
      .addCase(fetchContext.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Refresh Context
      .addCase(recollectContext.pending, (state) => {
        state.refreshing = true;
        state.error = null;
      })
      .addCase(recollectContext.fulfilled, (state, action) => {
        state.refreshing = false;
        state.currentSnapshot = action.payload;
      })
      .addCase(recollectContext.rejected, (state, action) => {
        state.refreshing = false;
        state.error = action.payload;
      });
  },
});

export const { clearContextError, clearContextSnapshot } = contextSlice.actions;
export default contextSlice.reducer;
