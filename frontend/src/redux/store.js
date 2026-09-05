import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import projectReducer from './slices/projectSlice';
import fileReducer from './slices/fileSlice';
import analyzerReducer from './slices/analyzerSlice';
import sandboxReducer from './slices/sandboxSlice';
import scenarioReducer from './slices/scenarioSlice';
import contextReducer from './slices/contextSlice';
import aiReducer from './slices/aiSlice';
import validationReducer from './slices/validationSlice';
import k8sReducer from './slices/k8sSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    project: projectReducer,
    file: fileReducer,
    analyzer: analyzerReducer,
    sandbox: sandboxReducer,
    scenario: scenarioReducer,
    context: contextReducer,
    ai: aiReducer,
    validation: validationReducer,
    k8s: k8sReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
