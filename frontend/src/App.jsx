import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Scenarios from './pages/Scenarios';
import Analyzer from './pages/Analyzer';
import Deployment from './pages/Deployment';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

export const App = () => {
  return (
    <Routes>
      {/* Protected App Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetails />} />
        <Route path="profile" element={<Profile />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="scenarios" element={<Scenarios />} />
        <Route path="analyzer" element={<Analyzer />} />
        <Route path="deployment" element={<Deployment />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>
    </Routes>
  );
};

export default App;
