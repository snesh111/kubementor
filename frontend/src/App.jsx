import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfileThunk } from './redux/slices/authSlice';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LearnCatalog from './pages/LearnCatalog';
import Skills from './pages/Skills';
import TopicRoadmap from './pages/TopicRoadmap';
import LabWorkspace from './pages/LabWorkspace';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Profile from './pages/Profile';
import ProgressDashboard from './pages/ProgressDashboard';
import BYOASetup from './pages/BYOASetup';
import Dashboard from './pages/Dashboard';
import Analyzer from './pages/Analyzer';
import Deployment from './pages/Deployment';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

export const App = () => {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchProfileThunk());
    }
  }, [token, user, dispatch]);
  return (
    <Routes>
      {/* Full-screen Interactive Lab Workspace (Protected) */}
      <Route
        path="lab/:labId"
        element={
          <ProtectedRoute>
            <LabWorkspace />
          </ProtectedRoute>
        }
      />

      {/* Main Layout (Public Landing & Catalog + Protected Inner Pages) */}
      <Route element={<MainLayout />}>
        {/* Public Landing & Catalog Routes */}
        <Route path="/" element={<Navigate to="/learn" replace />} />
        <Route path="learn" element={<LearnCatalog />} />
        <Route path="skills" element={<Skills />} />
        <Route path="skills/:trackId" element={<TopicRoadmap />} />
        <Route path="track/:trackId" element={<TopicRoadmap />} />
        <Route path="scenarios" element={<Navigate to="/learn" replace />} />

        {/* Protected Inner Features */}
        <Route
          path="progress"
          element={
            <ProtectedRoute>
              <ProgressDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="byoa"
          element={
            <ProtectedRoute>
              <BYOASetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />
        <Route
          path="projects/:id"
          element={
            <ProtectedRoute>
              <ProjectDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="analyzer"
          element={
            <ProtectedRoute>
              <Analyzer />
            </ProtectedRoute>
          }
        />
        <Route
          path="deployment"
          element={
            <ProtectedRoute>
              <Deployment />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Standalone Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>
    </Routes>
  );
};

export default App;

