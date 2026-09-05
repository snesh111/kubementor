import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import projectFileService from '../../services/projectFileService';

export const fetchProjectFiles = createAsyncThunk(
  'file/fetchProjectFiles',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await projectFileService.getFiles(projectId);
      return response.data.files;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch project files');
    }
  }
);

export const fetchFileDetails = createAsyncThunk(
  'file/fetchFileDetails',
  async ({ projectId, fileId }, { rejectWithValue }) => {
    try {
      const response = await projectFileService.getFileDetails(projectId, fileId);
      return response.data.file;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch file details');
    }
  }
);

export const uploadProjectFile = createAsyncThunk(
  'file/uploadProjectFile',
  async ({ projectId, formData }, { rejectWithValue }) => {
    try {
      const response = await projectFileService.uploadFile(projectId, formData);
      return response.data.file;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to upload file');
    }
  }
);

export const replaceProjectFile = createAsyncThunk(
  'file/replaceProjectFile',
  async ({ projectId, fileId, formData }, { rejectWithValue }) => {
    try {
      const response = await projectFileService.replaceFile(projectId, fileId, formData);
      return response.data.file;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to replace file');
    }
  }
);

export const deleteProjectFile = createAsyncThunk(
  'file/deleteProjectFile',
  async ({ projectId, fileId }, { rejectWithValue }) => {
    try {
      await projectFileService.deleteFile(projectId, fileId);
      return fileId;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete file');
    }
  }
);

const initialState = {
  files: [],
  activeFile: null,
  loading: false,
  activeFileLoading: false,
  actionLoading: false,
  error: null,
  actionError: null,
};

export const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    clearFileErrors: (state) => {
      state.error = null;
      state.actionError = null;
    },
    clearActiveFile: (state) => {
      state.activeFile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Files List
      .addCase(fetchProjectFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload;
      })
      .addCase(fetchProjectFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch File Details
      .addCase(fetchFileDetails.pending, (state) => {
        state.activeFileLoading = true;
        state.activeFile = null;
      })
      .addCase(fetchFileDetails.fulfilled, (state, action) => {
        state.activeFileLoading = false;
        state.activeFile = action.payload;
      })
      .addCase(fetchFileDetails.rejected, (state, action) => {
        state.activeFileLoading = false;
        state.actionError = action.payload;
      })

      // Upload File
      .addCase(uploadProjectFile.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(uploadProjectFile.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.files.unshift(action.payload);
      })
      .addCase(uploadProjectFile.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // Replace File
      .addCase(replaceProjectFile.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(replaceProjectFile.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.files.findIndex((f) => f._id === action.payload._id);
        if (index !== -1) {
          state.files[index] = action.payload;
        }
        if (state.activeFile && state.activeFile._id === action.payload._id) {
          state.activeFile = action.payload;
        }
      })
      .addCase(replaceProjectFile.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // Delete File
      .addCase(deleteProjectFile.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deleteProjectFile.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.files = state.files.filter((f) => f._id !== action.payload);
        if (state.activeFile && state.activeFile._id === action.payload) {
          state.activeFile = null;
        }
      })
      .addCase(deleteProjectFile.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const { clearFileErrors, clearActiveFile } = fileSlice.actions;
export default fileSlice.reducer;
