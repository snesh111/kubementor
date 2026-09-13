import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LearnCatalog from './pages/LearnCatalog';
import LabWorkspace from './pages/LabWorkspace';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Analyzer from './pages/Analyzer';
import Deployment from './pages/Deployment';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

export const App = () => {
  return (
    <Routes>
      {/* Full-screen Interactive Lab Workspace */}
      <Route
        path="lab/:labId"
        element={
          <ProtectedRoute>
            <LabWorkspace />
          </ProtectedRoute>
        }
      />

      {/* Protected App Routes with Standard MainLayout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/learn" replace />} />
        <Route path="learn" element={<LearnCatalog />} />
        <Route path="scenarios" element={<Navigate to="/learn" replace />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetails />} />
        <Route path="profile" element={<Profile />} />
        <Route path="dashboard" element={<Dashboard />} />
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
