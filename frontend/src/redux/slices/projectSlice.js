import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import projectService from '../../services/projectService';

export const fetchProjects = createAsyncThunk(
  'project/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await projectService.getProjects();
      const list =
        response?.data?.projects ||
        response?.projects ||
        (Array.isArray(response?.data) ? response.data : null) ||
        (Array.isArray(response) ? response : []);
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch projects');
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  'project/fetchProjectById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await projectService.getProjectById(id);
      const proj = response?.data?.project || response?.project || response?.data || response;
      return proj || null;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch project details');
    }
  }
);

export const createProject = createAsyncThunk(
  'project/createProject',
  async (projectData, { rejectWithValue }) => {
    try {
      const response = await projectService.createProject(projectData);
      const proj = response?.data?.project || response?.project || response?.data || response;
      return proj;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create project');
    }
  }
);

export const updateProject = createAsyncThunk(
  'project/updateProject',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await projectService.updateProject(id, data);
      const proj = response?.data?.project || response?.project || response?.data || response;
      return proj;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update project');
    }
  }
);

export const deleteProject = createAsyncThunk(
  'project/deleteProject',
  async (id, { rejectWithValue }) => {
    try {
      await projectService.deleteProject(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete project');
    }
  }
);

const initialState = {
  projects: [],
  currentProject: null,
  loading: false,
  actionLoading: false,
  error: null,
  actionError: null,
};

export const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    clearProjectError: (state) => {
      state.error = null;
      state.actionError = null;
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        if (!Array.isArray(state.projects)) {
          state.projects = [];
        }
      })

      // Fetch Project By ID
      .addCase(fetchProjectById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentProject = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Project
      .addCase(createProject.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload && typeof action.payload === 'object') {
          if (!Array.isArray(state.projects)) state.projects = [];
          state.projects.unshift(action.payload);
        }
      })
      .addCase(createProject.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // Update Project
      .addCase(updateProject.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload && action.payload._id && Array.isArray(state.projects)) {
          const index = state.projects.findIndex((p) => p._id === action.payload._id);
          if (index !== -1) {
            state.projects[index] = action.payload;
          }
          if (state.currentProject && state.currentProject._id === action.payload._id) {
            state.currentProject = action.payload;
          }
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // Delete Project
      .addCase(deleteProject.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (Array.isArray(state.projects)) {
          state.projects = state.projects.filter((p) => p._id !== action.payload);
        }
        if (state.currentProject && state.currentProject._id === action.payload) {
          state.currentProject = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const { clearProjectError, clearCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;
