import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FolderKanban,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  ExternalLink,
  AlertCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import useProjects from '../hooks/useProjects';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate } from '../utils/helpers';

export const Projects = () => {
  const navigate = useNavigate();
  const {
    projects,
    loading,
    actionLoading,
    error,
    actionError,
    loadProjects,
    addProject,
    editProject,
    removeProject,
    clearErrors,
  } = useProjects();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'draft',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadProjects();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name || formData.name.trim().length < 3) {
      errs.name = 'Project name must be at least 3 characters long.';
    } else if (formData.name.trim().length > 100) {
      errs.name = 'Project name cannot exceed 100 characters.';
    }

    if (formData.description && formData.description.length > 500) {
      errs.description = 'Description cannot exceed 500 characters.';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openCreateModal = () => {
    setFormData({ name: '', description: '', status: 'draft' });
    setFormErrors({});
    clearErrors();
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = await addProject(formData);
    if (!result.error) {
      setIsCreateOpen(false);
      setFormData({ name: '', description: '', status: 'draft' });
    }
  };

  const openEditModal = (project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status || 'draft',
    });
    setFormErrors({});
    clearErrors();
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || !selectedProject) return;

    const result = await editProject(selectedProject._id, formData);
    if (!result.error) {
      setIsEditOpen(false);
      setSelectedProject(null);
    }
  };

  const openDeleteModal = (project) => {
    setSelectedProject(project);
    clearErrors();
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProject) return;
    const result = await removeProject(selectedProject._id);
    if (!result.error) {
      setIsDeleteOpen(false);
      setSelectedProject(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      analyzed: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      deployed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      archived: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };

    return (
      <span
        className={`text-xs px-2.5 py-1 rounded-full font-mono font-medium border capitalize ${
          styles[status] || styles.draft
        }`}
      >
        {status || 'draft'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-cyan-400" /> My Projects
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your Kubernetes troubleshooting and deployment simulation workspaces.
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal} className="shrink-0">
          <Plus className="w-4 h-4" /> Create Project
        </Button>
      </div>

      {/* Global Error Banner */}
      {(error || actionError) && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error || actionError}</span>
          </div>
          <button onClick={clearErrors} className="hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner label="Fetching project workspace..." size="lg" />
      ) : !Array.isArray(projects) || projects.length === 0 ? (
        /* Empty State */
        <Card className="text-center py-16 px-4">
          <div className="w-16 h-16 bg-slate-800/60 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4 border border-slate-700">
            <FolderKanban className="w-8 h-8 text-cyan-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">No Projects Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 mb-6">
            You don't have any DevOps troubleshooting projects created yet. Start by creating a project workspace to analyze manifests and run simulations.
          </p>
          <Button variant="primary" onClick={openCreateModal}>
            <Plus className="w-4 h-4" /> Create Your First Project
          </Button>
        </Card>
      ) : (
        /* Projects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(Array.isArray(projects) ? projects : []).map((project) => (
            <Card
              key={project._id}
              className="flex flex-col justify-between hover:border-slate-700 transition-all duration-200 group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-base font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  {getStatusBadge(project.status)}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed min-h-[40px] line-clamp-2 mb-4">
                  {project.description || 'No description provided for this project.'}
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800/80">
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Created: {formatDate(project.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Updated: {formatDate(project.updatedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/projects/${project._id}`)}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Details
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditModal(project)}
                    title="Edit Project"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-300" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openDeleteModal(project)}
                    className="hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-400"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Create Project */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Project">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g. Production Ingress Microservices"
              className={`w-full bg-slate-950 border ${
                formErrors.name ? 'border-rose-500' : 'border-slate-800'
              } rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors`}
            />
            {formErrors.name && <p className="text-xs text-rose-400 mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description <span className="text-slate-500">(Optional)</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Describe the scope, clusters, or target Kubernetes environment..."
              className={`w-full bg-slate-950 border ${
                formErrors.description ? 'border-rose-500' : 'border-slate-800'
              } rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors`}
            />
            {formErrors.description && (
              <p className="text-xs text-rose-400 mt-1">{formErrors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Initial Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="draft">Draft</option>
              <option value="analyzed">Analyzed</option>
              <option value="deployed">Deployed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={actionLoading}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Project */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Project">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full bg-slate-950 border ${
                formErrors.name ? 'border-rose-500' : 'border-slate-800'
              } rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors`}
            />
            {formErrors.name && <p className="text-xs text-rose-400 mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`w-full bg-slate-950 border ${
                formErrors.description ? 'border-rose-500' : 'border-slate-800'
              } rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors`}
            />
            {formErrors.description && (
              <p className="text-xs text-rose-400 mt-1">{formErrors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Project Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="draft">Draft</option>
              <option value="analyzed">Analyzed</option>
              <option value="deployed">Deployed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={actionLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Delete */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Delete Project">
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Are you sure you want to delete <strong className="text-white">{selectedProject?.name}</strong>? This action is permanent and cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              isLoading={actionLoading}
            >
              Delete Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Projects;
