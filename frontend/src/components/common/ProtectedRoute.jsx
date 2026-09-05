import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProfileThunk } from '../../redux/slices/authSlice';
import LoadingSpinner from './LoadingSpinner';

export const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, token, user, isInitializing, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user && !isInitializing) {
      dispatch(fetchProfileThunk());
    }
  }, [token, user, isInitializing, dispatch]);

  if (isInitializing || (token && !user && loading)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner label="Authenticating session..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
