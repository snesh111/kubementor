import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import k8sSandboxService from '../../services/k8sSandboxService';

export const executeDeploy = createAsyncThunk(
  'sandbox/executeDeploy',
  async ({ projectId, fileIds }, { rejectWithValue }) => {
    try {
      const response = await k8sSandboxService.deploy(projectId, fileIds);
      return response.data.deployment;
    } catch (err) {
      return rejectWithValue(err.message || 'Deployment execution failed');
    }
  }
);

export const fetchDeploymentHistory = createAsyncThunk(
  'sandbox/fetchDeploymentHistory',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await k8sSandboxService.getDeploymentHistory(projectId);
      return response.data.deployments;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch deployment history');
    }
  }
);

export const fetchSandboxStatus = createAsyncThunk(
  'sandbox/fetchSandboxStatus',
  async ({ projectId, deploymentId }, { rejectWithValue }) => {
    try {
      const response = await k8sSandboxService.getSandboxStatus(projectId, deploymentId);
      return response.data; // { deploymentRecord, liveStatus }
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch live sandbox status');
    }
  }
);

export const cleanupSandbox = createAsyncThunk(
  'sandbox/cleanupSandbox',
  async ({ projectId, deploymentId }, { rejectWithValue }) => {
    try {
      await k8sSandboxService.stopAndCleanup(projectId, deploymentId);
      return deploymentId;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to cleanup sandbox namespace');
    }
  }
);

const initialState = {
  activeDeployment: null,
  liveStatus: null,
  history: [],
  deploying: false,
  statusLoading: false,
  actionLoading: false,
  error: null,
};

export const sandboxSlice = createSlice({
  name: 'sandbox',
  initialState,
  reducers: {
    clearSandboxErrors: (state) => {
      state.error = null;
    },
    clearActiveDeployment: (state) => {
      state.activeDeployment = null;
      state.liveStatus = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Execute Deploy
      .addCase(executeDeploy.pending, (state) => {
        state.deploying = true;
        state.error = null;
      })
      .addCase(executeDeploy.fulfilled, (state, action) => {
        state.deploying = false;
        state.activeDeployment = action.payload;
        state.history.unshift(action.payload);
      })
      .addCase(executeDeploy.rejected, (state, action) => {
        state.deploying = false;
        state.error = action.payload;
      })

      // Fetch History
      .addCase(fetchDeploymentHistory.fulfilled, (state, action) => {
        state.history = action.payload;
        if (action.payload.length > 0 && !state.activeDeployment) {
          const latestActive = action.payload.find((d) => d.status !== 'stopped');
          if (latestActive) {
            state.activeDeployment = latestActive;
          }
        }
      })

      // Fetch Live Status
      .addCase(fetchSandboxStatus.pending, (state) => {
        state.statusLoading = true;
      })
      .addCase(fetchSandboxStatus.fulfilled, (state, action) => {
        state.statusLoading = false;
        state.activeDeployment = action.payload.deploymentRecord;
        state.liveStatus = action.payload.liveStatus;
      })
      .addCase(fetchSandboxStatus.rejected, (state, action) => {
        state.statusLoading = false;
        state.error = action.payload;
      })

      // Cleanup Sandbox
      .addCase(cleanupSandbox.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(cleanupSandbox.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (state.activeDeployment && state.activeDeployment._id === action.payload) {
          state.activeDeployment.status = 'stopped';
        }
        if (state.liveStatus) {
          state.liveStatus.overallStatus = 'stopped';
          state.liveStatus.pods = [];
          state.liveStatus.deployments = [];
        }
      })
      .addCase(cleanupSandbox.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSandboxErrors, clearActiveDeployment } = sandboxSlice.actions;
export default sandboxSlice.reducer;
