import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import projectService from '../../services/projectService';

export const fetchProjects = createAsyncThunk(
  'project/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await projectService.getProjects();
      return response.data.projects;
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
      return response.data.project;
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
      return response.data.project;
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
      return response.data.project;
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
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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
        state.projects.unshift(action.payload);
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
        const index = state.projects.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.currentProject && state.currentProject._id === action.payload._id) {
          state.currentProject = action.payload;
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
        state.projects = state.projects.filter((p) => p._id !== action.payload);
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
