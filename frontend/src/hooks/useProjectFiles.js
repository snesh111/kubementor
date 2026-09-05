import { useSelector, useDispatch } from 'react-redux';
import {
  fetchProjectFiles,
  fetchFileDetails,
  uploadProjectFile,
  replaceProjectFile,
  deleteProjectFile,
  clearFileErrors,
  clearActiveFile,
} from '../redux/slices/fileSlice';

export const useProjectFiles = () => {
  const dispatch = useDispatch();
  const {
    files,
    activeFile,
    loading,
    activeFileLoading,
    actionLoading,
    error,
    actionError,
  } = useSelector((state) => state.file);

  return {
    files,
    activeFile,
    loading,
    activeFileLoading,
    actionLoading,
    error,
    actionError,
    loadFiles: (projectId) => dispatch(fetchProjectFiles(projectId)),
    loadFileDetails: (projectId, fileId) => dispatch(fetchFileDetails({ projectId, fileId })),
    uploadFile: (projectId, formData) => dispatch(uploadProjectFile({ projectId, formData })),
    replaceFile: (projectId, fileId, formData) => dispatch(replaceProjectFile({ projectId, fileId, formData })),
    removeFile: (projectId, fileId) => dispatch(deleteProjectFile({ projectId, fileId })),
    clearErrors: () => dispatch(clearFileErrors()),
    resetActiveFile: () => dispatch(clearActiveFile()),
  };
};

export default useProjectFiles;
