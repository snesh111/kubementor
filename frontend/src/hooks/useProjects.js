import { useSelector, useDispatch } from 'react-redux';
import {
  fetchProjects,
  fetchProjectById,
  createProject,
  updateProject,
  deleteProject,
  clearProjectError,
  clearCurrentProject,
} from '../redux/slices/projectSlice';

export const useProjects = () => {
  const dispatch = useDispatch();
  const { projects, currentProject, loading, actionLoading, error, actionError } = useSelector(
    (state) => state.project
  );

  return {
    projects,
    currentProject,
    loading,
    actionLoading,
    error,
    actionError,
    loadProjects: () => dispatch(fetchProjects()),
    loadProjectById: (id) => dispatch(fetchProjectById(id)),
    addProject: (data) => dispatch(createProject(data)),
    editProject: (id, data) => dispatch(updateProject({ id, data })),
    removeProject: (id) => dispatch(deleteProject(id)),
    clearErrors: () => dispatch(clearProjectError()),
    resetCurrentProject: () => dispatch(clearCurrentProject()),
  };
};

export default useProjects;
