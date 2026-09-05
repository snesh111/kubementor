import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import aiService from '../../services/aiService';

export const fetchDiagnosis = createAsyncThunk(
  'ai/fetchDiagnosis',
  async ({ projectId, attemptId }, { rejectWithValue }) => {
    try {
      const response = await aiService.diagnose(projectId, attemptId);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to generate AI diagnosis');
    }
  }
);

export const requestHint = createAsyncThunk(
  'ai/requestHint',
  async ({ projectId, attemptId, level }, { rejectWithValue }) => {
    try {
      const response = await aiService.getHint(projectId, attemptId, level);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to request hint');
    }
  }
);

export const sendChatMessage = createAsyncThunk(
  'ai/sendChatMessage',
  async ({ projectId, attemptId, message }, { rejectWithValue }) => {
    try {
      const response = await aiService.sendMessage(projectId, attemptId, message);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to send message to AI Mentor');
    }
  }
);

export const fetchChatHistory = createAsyncThunk(
  'ai/fetchChatHistory',
  async ({ projectId, attemptId }, { rejectWithValue }) => {
    try {
      const response = await aiService.getChatHistory(projectId, attemptId);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch conversation history');
    }
  }
);

const initialState = {
  diagnosis: null,
  activeHintLevel: 1,
  activeHint: null,
  messages: [],
  loading: false,
  hintLoading: false,
  chatLoading: false,
  error: null,
};

export const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    clearAIError: (state) => {
      state.error = null;
    },
    resetAIMentor: (state) => {
      state.diagnosis = null;
      state.activeHint = null;
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Diagnosis
      .addCase(fetchDiagnosis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDiagnosis.fulfilled, (state, action) => {
        state.loading = false;
        state.diagnosis = action.payload?.aiResponse || null;
      })
      .addCase(fetchDiagnosis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Request Hint
      .addCase(requestHint.pending, (state) => {
        state.hintLoading = true;
        state.error = null;
      })
      .addCase(requestHint.fulfilled, (state, action) => {
        state.hintLoading = false;
        state.activeHintLevel = action.payload?.hintLevel || 1;
        state.activeHint = action.payload?.aiResponse?.hint || null;
      })
      .addCase(requestHint.rejected, (state, action) => {
        state.hintLoading = false;
        state.error = action.payload;
      })

      // Send Chat Message
      .addCase(sendChatMessage.pending, (state) => {
        state.chatLoading = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.chatLoading = false;
        const aiResp = action.payload?.aiResponse;
        if (aiResp) {
          state.messages.push({
            role: 'assistant',
            content: aiResp.diagnosis?.summary || aiResp.likelyCause || aiResp.hint || 'Mentor Response',
            confidence: aiResp.diagnosis?.confidence,
            evidence: aiResp.evidence || [],
            createdAt: new Date().toISOString(),
          });
        }
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.chatLoading = false;
        state.error = action.payload;
      })

      // Fetch Chat History
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.messages = action.payload?.messages || [];
      });
  },
});

export const { clearAIError, resetAIMentor } = aiSlice.actions;
export default aiSlice.reducer;
