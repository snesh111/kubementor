import { useSelector, useDispatch } from 'react-redux';
import { setSelectedNamespace, setResources, setClusterStatus } from '../redux/slices/k8sSlice';

export const useKubernetes = () => {
  const dispatch = useDispatch();
  const { namespaces, selectedNamespace, resources, clusterStatus, loading, error } = useSelector(
    (state) => state.k8s
  );

  return {
    namespaces,
    selectedNamespace,
    resources,
    clusterStatus,
    loading,
    error,
    changeNamespace: (ns) => dispatch(setSelectedNamespace(ns)),
    updateResources: (res) => dispatch(setResources(res)),
    updateStatus: (status) => dispatch(setClusterStatus(status)),
  };
};

export default useKubernetes;
