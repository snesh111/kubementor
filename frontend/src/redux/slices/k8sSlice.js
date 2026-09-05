import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  namespaces: ['default', 'kube-system'],
  selectedNamespace: 'default',
  resources: {
    pods: [],
    deployments: [],
    services: [],
    events: [],
  },
  clusterStatus: 'connected',
  loading: false,
  error: null,
};

export const k8sSlice = createSlice({
  name: 'k8s',
  initialState,
  reducers: {
    setSelectedNamespace: (state, action) => {
      state.selectedNamespace = action.payload;
    },
    setResources: (state, action) => {
      state.resources = { ...state.resources, ...action.payload };
    },
    setClusterStatus: (state, action) => {
      state.clusterStatus = action.payload;
    },
    setK8sLoading: (state, action) => {
      state.loading = action.payload;
    },
    setK8sError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setSelectedNamespace,
  setResources,
  setClusterStatus,
  setK8sLoading,
  setK8sError,
} = k8sSlice.actions;

export default k8sSlice.reducer;
