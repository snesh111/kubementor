import { useSelector, useDispatch } from 'react-redux';
import {
  loginThunk,
  registerThunk,
  googleLoginThunk,
  githubLoginThunk,
  demoLoginThunk,
  fetchProfileThunk,
  updateProfileThunk,
  logout,
  clearAuthError,
} from '../redux/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, loading, isInitializing, error } = useSelector(
    (state) => state.auth
  );

  return {
    user,
    token,
    isAuthenticated,
    loading,
    isInitializing,
    error,
    login: (credentials) => dispatch(loginThunk(credentials)),
    register: (userData) => dispatch(registerThunk(userData)),
    googleLogin: (googlePayload) => dispatch(googleLoginThunk(googlePayload)),
    githubLogin: (githubPayload) => dispatch(githubLoginThunk(githubPayload)),
    demoLogin: () => dispatch(demoLoginThunk()),
    fetchProfile: () => dispatch(fetchProfileThunk()),
    updateProfile: (profileData) => dispatch(updateProfileThunk(profileData)),
    logout: () => dispatch(logout()),
    clearError: () => dispatch(clearAuthError()),
  };
};

export default useAuth;
