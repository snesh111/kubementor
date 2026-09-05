import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  FileText,
  FileCode2,
  UploadCloud,
  Box,
  AlertTriangle,
  Cpu,
  TrendingUp,
  Edit2,
  Trash2,
  AlertCircle,
  Eye,
  RefreshCw,
  Copy,
  Check,
  X,
  Play,
  Shield,
  Zap,
  Activity,
  CheckCircle2,
  History,
  ChevronRight,
  Filter,
  Rocket,
  Layers,
  StopCircle,
  Server,
  Flame,
  Bomb,
  WifiOff,
  Lock,
  RotateCcw,
  Target,
  FileSearch,
  Bot,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  Send,
  CheckSquare,
  XCircle,
  AlertOctagon,
  ArrowRight,
  Award,
} from 'lucide-react';

import useProjects from '../hooks/useProjects';
import useProjectFiles from '../hooks/useProjectFiles';
import useAnalyzer from '../hooks/useAnalyzer';
import useSandbox from '../hooks/useSandbox';
import useScenarios from '../hooks/useScenarios';
import useContextCollector from '../hooks/useContextCollector';
import useAIMentor from '../hooks/useAIMentor';
import useValidation from '../hooks/useValidation';

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate, formatBytes } from '../utils/helpers';
import * as yaml from 'js-yaml';

export const ProjectDetails = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  // Custom Hooks
  const {
    currentProject,
    loading: projectLoading,
    actionLoading: projectActionLoading,
    error: projectError,
    loadProjectById,
    editProject,
    removeProject,
    resetCurrentProject,
  } = useProjects();

  const {
    files,
    activeFile,
    loading: filesLoading,
    activeFileLoading,
    actionLoading: fileActionLoading,
    error: fileError,
    actionError: fileActionError,
    loadFiles,
    loadFileDetails,
    uploadFile,
    replaceFile,
    removeFile,
    clearErrors: clearFileErrors,
    resetActiveFile,
  } = useProjectFiles();

  const {
    currentReport,
    history: analyzerHistory,
    analyzing,
    error: analyzerError,
    analyzeFiles,
    loadHistory: loadAnalyzerHistory,
    loadReport,
    clearError: clearAnalyzerErrors,
  } = useAnalyzer();

  const {
    activeDeployment,
    liveStatus,
    history: sandboxHistory,
    deploying,
    statusLoading: sandboxStatusLoading,
    actionLoading: sandboxActionLoading,
    error: sandboxError,
    deploy: deployToSandbox,
    loadHistory: loadSandboxHistory,
    loadStatus: loadSandboxLiveStatus,
    stopSandbox,
    clearErrors: clearSandboxErrors,
  } = useSandbox();

  const {
    scenarios,
    activeAttempt,
    attemptsHistory,
    loading: scenariosLoading,
    actionLoading: scenarioActionLoading,
    error: scenarioError,
    loadScenarios,
    startScenario,
    loadAttempts,
    cancelScenario,
    clearErrors: clearScenarioErrors,
  } = useScenarios();

  const {
    currentSnapshot,
    loading: contextLoading,
    refreshing: contextRefreshing,
    error: contextError,
    loadContext,
    refreshDiagnosisContext,
  } = useContextCollector();

  const {
    diagnosis,
    activeHintLevel,
    activeHint,
    messages,
    loading: aiLoading,
    hintLoading,
    chatLoading,
    error: aiError,
    loadDiagnosis,
    getHintLevel,
    sendUserMessage,
    loadHistory: loadChatHistory,
  } = useAIMentor();

  const {
    latestResult: validationResult,
    history: validationHistory,
    validating,
    error: validationError,
    validateSolution,
    loadLatestResult: loadValidationResult,
    loadHistory: loadValidationHistory,
  } = useValidation();

  // Project Modals State
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [projectFormData, setProjectFormData] = useState({ name: '', description: '', status: 'draft' });

  // File Modals State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteFileOpen, setIsDeleteFileOpen] = useState(false);

  // Sandbox Inspection Modal State
  const [isSandboxModalOpen, setIsSandboxModalOpen] = useState(false);

  // Selection States
  const [selectedFileItem, setSelectedFileItem] = useState(null);
  const [selectedUploadFile, setSelectedUploadFile] = useState(null);
  const [pasteContent, setPasteContent] = useState('');
  const [uploadFilename, setUploadFilename] = useState('');
  const [localValidationError, setLocalValidationError] = useState('');
  const [copied, setCopied] = useState(false);

  // File Checkboxes
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('All');

  // Chat Input State
  const [chatInputText, setChatInputText] = useState('');

  // Animation Step States
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0);
  const [deployStepIndex, setDeployStepIndex] = useState(0);
  const [valStepIndex, setValStepIndex] = useState(0);

  const analysisSteps = [
    'Retrieving Kubernetes manifests...',
    'Parsing multi-document YAML with js-yaml...',
    'Evaluating Security, Reliability, Performance & Best Practice rules...',
    'Calculating weighted category scores & generating report...',
  ];

  const deploySteps = [
    'Preparing manifests & checking kind whitelist...',
    'Enforcing deterministic sandbox namespace isolation...',
    'Creating sandbox namespace & applying ResourceQuota...',
    'Applying Deployments, Services, ConfigMaps, Secrets & Ingresses...',
    'Inspecting pod readiness & status...',
  ];

  const validationSteps = [
    'Redeploying modified manifests into sandbox namespace...',
    'Waiting for Kubernetes workload stabilization...',
    'Collecting fresh runtime telemetry (NEW ContextSnapshot)...',
    'Comparing BEFORE vs AFTER telemetry states...',
    'Evaluating scenario validation rules...',
  ];

  useEffect(() => {
    if (projectId) {
      loadProjectById(projectId);
      loadFiles(projectId);
      loadAnalyzerHistory(projectId);
      loadSandboxHistory(projectId);
      loadScenarios(projectId);
      loadAttempts(projectId);
    }
    return () => {
      resetCurrentProject();
      resetActiveFile();
    };
  }, [projectId]);

  // Auto-select YAML files
  useEffect(() => {
    if (files && files.length > 0) {
      const yamlIds = files.filter((f) => f.fileType === 'yaml').map((f) => f._id);
      setSelectedFileIds(yamlIds);
    }
  }, [files]);

  // Auto load context, AI diagnosis, and validation history when activeAttempt changes
  useEffect(() => {
    if (activeAttempt && activeAttempt._id && activeAttempt.status !== 'cancelled') {
      loadContext(projectId, activeAttempt._id);
      loadDiagnosis(projectId, activeAttempt._id);
      loadChatHistory(projectId, activeAttempt._id);
      loadValidationResult(projectId, activeAttempt._id);
      loadValidationHistory(projectId, activeAttempt._id);
    }
  }, [activeAttempt?._id]);

  // Validation Progress Animation
  useEffect(() => {
    let interval;
    if (validating) {
      setValStepIndex(0);
      interval = setInterval(() => {
        setValStepIndex((prev) => (prev < validationSteps.length - 1 ? prev + 1 : prev));
      }, 700);
    }
    return () => clearInterval(interval);
  }, [validating]);

  // Handlers
  const handleRunAnalysis = async () => {
    if (selectedFileIds.length === 0) return;
    clearAnalyzerErrors();
    await analyzeFiles(projectId, selectedFileIds);
  };

  const handleRunDeploy = async () => {
    if (selectedFileIds.length === 0) return;
    clearSandboxErrors();
    const result = await deployToSandbox(projectId, selectedFileIds);
    if (!result.error && result.payload?._id) {
      await loadSandboxLiveStatus(projectId, result.payload._id);
    }
  };

  const handleStartScenario = async (scenarioId) => {
    if (!activeDeployment) return;
    clearScenarioErrors();
    const result = await startScenario(projectId, scenarioId, activeDeployment._id);
    if (!result.error && result.payload?._id) {
      await loadSandboxLiveStatus(projectId, activeDeployment._id);
      await loadContext(projectId, result.payload._id);
      await loadDiagnosis(projectId, result.payload._id);
    }
  };

  const handleRunValidation = async () => {
    if (!activeAttempt) return;
    const result = await validateSolution(projectId, activeAttempt._id, selectedFileIds);
    if (!result.error && result.payload?.afterSnapshotId) {
      await loadContext(projectId, activeAttempt._id);
      await loadDiagnosis(projectId, activeAttempt._id);
      await loadAttempts(projectId);
    }
  };

  const handleRefreshContext = async () => {
    if (activeAttempt) {
      await refreshDiagnosisContext(projectId, activeAttempt._id);
      await loadDiagnosis(projectId, activeAttempt._id);
    }
  };

  const handleRequestHintLevel = async (level) => {
    if (activeAttempt) {
      await getHintLevel(projectId, activeAttempt._id, level);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInputText || chatInputText.trim().length === 0 || !activeAttempt) return;
    const msg = chatInputText;
    setChatInputText('');
    await sendUserMessage(projectId, activeAttempt._id, msg);
  };

  const handleCancelScenario = async () => {
    if (activeAttempt) {
      await cancelScenario(projectId, activeAttempt._id);
      if (activeDeployment) {
        await loadSandboxLiveStatus(projectId, activeDeployment._id);
      }
    }
  };

  const handleOpenSandboxModal = async () => {
    if (activeDeployment) {
      setIsSandboxModalOpen(true);
      await loadSandboxLiveStatus(projectId, activeDeployment._id);
    }
  };

  const handleRefreshSandboxStatus = async () => {
    if (activeDeployment) {
      await loadSandboxLiveStatus(projectId, activeDeployment._id);
    }
  };

  const handleStopSandbox = async () => {
    if (activeDeployment) {
      await stopSandbox(projectId, activeDeployment._id);
    }
  };

  const toggleFileCheckbox = (fileId) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  // Project Edit Handlers
  const openEditProjectModal = () => {
    if (!currentProject) return;
    setProjectFormData({
      name: currentProject.name,
      description: currentProject.description || '',
      status: currentProject.status || 'draft',
    });
    setIsEditProjectOpen(true);
  };

  const handleEditProjectSubmit = async (e) => {
    e.preventDefault();
    const result = await editProject(currentProject._id, projectFormData);
    if (!result.error) {
      setIsEditProjectOpen(false);
    }
  };

  const handleDeleteProjectConfirm = async () => {
    const result = await removeProject(currentProject._id);
    if (!result.error) {
      navigate('/projects');
    }
  };

  // File Validation Helper
  const validateFileSelection = (fileObj, textContent, filenameStr) => {
    setLocalValidationError('');
    const targetName = fileObj ? fileObj.name : filenameStr || 'manifest.yaml';
    const lowerName = targetName.toLowerCase();
    const isYaml = lowerName.endsWith('.yaml') || lowerName.endsWith('.yml');
    const isDockerfile =
      lowerName === 'dockerfile' ||
      lowerName.startsWith('dockerfile.') ||
      lowerName.endsWith('.dockerfile') ||
      lowerName.endsWith('.containerfile');

    if (!isYaml && !isDockerfile) {
      setLocalValidationError('File type not supported. Allowed extensions: .yaml, .yml, Dockerfile.');
      return false;
    }

    const size = fileObj ? fileObj.size : Buffer.byteLength(textContent || '', 'utf8');
    if (size > 5 * 1024 * 1024) {
      setLocalValidationError('File exceeds the 5 MB limit.');
      return false;
    }

    if (!fileObj && (!textContent || textContent.trim().length === 0)) {
      setLocalValidationError('Please select a file or paste manifest code.');
      return false;
    }

    if (isYaml && textContent) {
      try {
        yaml.loadAll(textContent);
      } catch (err) {
        setLocalValidationError(`Invalid YAML syntax: ${err.message}`);
        return false;
      }
    }

    if (isDockerfile && textContent) {
      const hasFrom = /^\s*FROM\s+\S+/im.test(textContent);
      if (!hasFrom) {
        setLocalValidationError('Invalid Dockerfile: Missing required FROM instruction.');
        return false;
      }
    }

    return true;
  };

  // Upload Handlers
  const openUploadModal = () => {
    setSelectedUploadFile(null);
    setPasteContent('');
    setUploadFilename('deployment.yaml');
    setLocalValidationError('');
    clearFileErrors();
    setIsUploadOpen(true);
  };

  const handleFileDrop = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedUploadFile(file);
      setUploadFilename(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        setPasteContent(text);
        validateFileSelection(file, text, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!validateFileSelection(selectedUploadFile, pasteContent, uploadFilename)) return;

    const formData = new FormData();
    if (selectedUploadFile) {
      formData.append('file', selectedUploadFile);
    } else {
      const blob = new Blob([pasteContent], { type: 'text/plain' });
      formData.append('file', blob, uploadFilename || 'manifest.yaml');
    }

    const result = await uploadFile(projectId, formData);
    if (!result.error) {
      setIsUploadOpen(false);
      setSelectedUploadFile(null);
      setPasteContent('');
    }
  };

  // Replace Handlers
  const openReplaceModal = (fileItem) => {
    setSelectedFileItem(fileItem);
    setSelectedUploadFile(null);
    setPasteContent('');
    setUploadFilename(fileItem.originalName);
    setLocalValidationError('');
    clearFileErrors();
    setIsReplaceOpen(true);
  };

  const handleReplaceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFileItem) return;
    if (!validateFileSelection(selectedUploadFile, pasteContent, uploadFilename)) return;

    const formData = new FormData();
    if (selectedUploadFile) {
      formData.append('file', selectedUploadFile);
    } else {
      const blob = new Blob([pasteContent], { type: 'text/plain' });
      formData.append('file', blob, uploadFilename);
    }

    const result = await replaceFile(projectId, selectedFileItem._id, formData);
    if (!result.error) {
      setIsReplaceOpen(false);
      setSelectedFileItem(null);
    }
  };

  // View Handler
  const openViewModal = async (fileItem) => {
    setSelectedFileItem(fileItem);
    resetActiveFile();
    setIsViewOpen(true);
    await loadFileDetails(projectId, fileItem._id);
  };

  const handleCopyCode = () => {
    if (activeFile?.content) {
      navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Delete Handler
  const openDeleteFileModal = (fileItem) => {
    setSelectedFileItem(fileItem);
    clearFileErrors();
    setIsDeleteFileOpen(true);
  };

  const handleDeleteFileConfirm = async () => {
    if (!selectedFileItem) return;
    const result = await removeFile(projectId, selectedFileItem._id);
    if (!result.error) {
      setIsDeleteFileOpen(false);
      setSelectedFileItem(null);
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
        className={`text-xs px-3 py-1 rounded-full font-mono font-medium border capitalize ${
          styles[status] || styles.draft
        }`}
      >
        {status || 'draft'}
      </span>
    );
  };

  const getSeverityBadgeClass = (severity) => {
    switch ((severity || '').toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30';
      case 'LOW':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getDifficultyBadgeClass = (difficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Intermediate':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Advanced':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getScoreColorClass = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getSandboxStatusBadge = (statusStr) => {
    const status = (statusStr || 'stopped').toLowerCase();
    if (status === 'running') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> 🟢 Running
        </span>
      );
    }
    if (status === 'deploying' || status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> 🟡 Deploying
        </span>
      );
    }
    if (status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-rose-400"></span> 🔴 Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/30 text-xs font-mono font-bold">
        <span className="w-2 h-2 rounded-full bg-slate-500"></span> ⚪ Stopped
      </span>
    );
  };

  const getValidationBadge = (statusStr) => {
    const status = (statusStr || 'FAIL').toUpperCase();
    if (status === 'PASS') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
          <CheckSquare className="w-3.5 h-3.5" /> ✅ PASSED
        </span>
      );
    }
    if (status === 'PARTIAL') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold">
          <AlertOctagon className="w-3.5 h-3.5" /> 🟡 PARTIAL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-mono font-bold">
        <XCircle className="w-3.5 h-3.5" /> ❌ FAILED
      </span>
    );
  };

  if (projectLoading) {
    return (
      <div className="py-16">
        <LoadingSpinner label="Loading project workspace..." size="lg" />
      </div>
    );
  }

  if (projectError || !currentProject) {
    return (
      <div className="space-y-6">
        <Link to="/projects" className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Projects List
        </Link>
        <Card className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-100">Project Not Found or Access Denied</h2>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {projectError || "The project you requested does not exist or you don't have permission to view it."}
          </p>
          <Button variant="primary" onClick={() => navigate('/projects')}>
            Return to Projects List
          </Button>
        </Card>
      </div>
    );
  }

  const filteredFindings = currentReport?.findings
    ? currentReport.findings.filter((f) => severityFilter === 'All' || f.severity === severityFilter)
    : [];

  const summary = currentSnapshot?.summary;
  const comp = validationResult?.comparison;
  const analysisComp = currentReport?.comparison;

  return (
    <div className="space-y-8">
      {/* Top Navigation */}
      <div>
        <Link
          to="/projects"
          className="text-xs text-slate-400 hover:text-cyan-400 inline-flex items-center gap-2 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects List
        </Link>

        {/* SECTION 1: PROJECT INFORMATION */}
        <div className="glass-card p-6 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100">{currentProject.name}</h1>
              {getStatusBadge(currentProject.status)}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {currentProject.description || 'No description provided for this project workspace.'}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono pt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Created: {formatDate(currentProject.createdAt)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Last Updated: {formatDate(currentProject.updatedAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-800">
            <Button variant="secondary" size="sm" onClick={openEditProjectModal}>
              <Edit2 className="w-3.5 h-3.5" /> Edit Project
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsDeleteProjectOpen(true)}
              className="hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        </div>
      </div>

      {/* SECTION 2: PROJECT FILES MANAGEMENT */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-cyan-400" /> Project Files
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload and manage Kubernetes manifests (.yaml, .yml) and Dockerfiles.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={openUploadModal} className="shrink-0">
            <Plus className="w-4 h-4" /> Upload File
          </Button>
        </div>

        {(fileError || fileActionError) && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fileError || fileActionError}</span>
            </div>
            <button onClick={clearFileErrors} className="hover:text-rose-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {filesLoading ? (
          <LoadingSpinner label="Loading project manifests..." size="md" />
        ) : files.length === 0 ? (
          <Card className="text-center py-12 px-4 border-dashed border-slate-800">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mx-auto text-slate-500 mb-3 border border-slate-800">
              <FileCode2 className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">No Files Uploaded Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Upload your deployment.yaml, service.yaml, or Dockerfile to start analysis.
            </p>
            <Button variant="primary" size="sm" onClick={openUploadModal}>
              <Plus className="w-4 h-4" /> Upload First File
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => {
              const isDocker = file.fileType === 'dockerfile';
              return (
                <Card
                  key={file._id}
                  className="flex flex-col justify-between hover:border-slate-700 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2 rounded-lg ${
                            isDocker
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          }`}
                        >
                          {isDocker ? <Box className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors line-clamp-1">
                            {file.originalName}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400">
                            {isDocker ? 'Dockerfile' : 'Kubernetes YAML'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 mb-4">
                      <span>Size: {formatBytes(file.size)}</span>
                      <span>•</span>
                      <span>Updated: {formatDate(file.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => openViewModal(file)}
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" /> View
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openReplaceModal(file)}
                      title="Replace File"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-300" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openDeleteFileModal(file)}
                      className="hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-400"
                      title="Delete File"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: KUBERNETES READINESS ANALYZER (MODULE 10 - EXPLAINABLE DEPLOYMENT SCORING!) */}
      <div className="space-y-6 pt-4 border-t border-slate-800">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" /> Intelligent Deployment Scoring & Explainability
            </h2>
            {analyzerHistory.length > 0 && (
              <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
                Reports Run: {analyzerHistory.length}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Execute deterministic weighted analysis (Security 30%, Reliability 30%, Performance 20%, Best Practices 20%) with explainable score deductions and before/after improvements.
          </p>
        </div>

        {analyzerError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{analyzerError}</span>
            </div>
            <button onClick={clearAnalyzerErrors} className="hover:text-rose-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <Card className="bg-slate-900/80 border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-200">Select Manifest Files to Analyze</h3>
              {files.filter((f) => f.fileType === 'yaml').length === 0 ? (
                <p className="text-xs text-slate-400">
                  No .yaml or .yml files uploaded yet. Please upload manifest files above first.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  {files
                    .filter((f) => f.fileType === 'yaml')
                    .map((file) => (
                      <label
                        key={file._id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono cursor-pointer transition-all ${
                          selectedFileIds.includes(file._id)
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFileIds.includes(file._id)}
                          onChange={() => toggleFileCheckbox(file._id)}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20"
                        />
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        {file.originalName}
                      </label>
                    ))}
                </div>
              )}
            </div>

            <Button
              variant="primary"
              onClick={handleRunAnalysis}
              disabled={analyzing || selectedFileIds.length === 0}
              isLoading={analyzing}
              className="shrink-0"
            >
              <Play className="w-4 h-4 fill-current" /> Analyze Deployment
            </Button>
          </div>
        </Card>

        {analyzing && (
          <Card className="text-center py-8 space-y-4 border-cyan-500/30 bg-slate-900/90">
            <div className="w-10 h-10 border-3 border-slate-700 border-t-cyan-400 rounded-full animate-spin mx-auto"></div>
            <div>
              <p className="text-sm font-semibold text-slate-100">{analysisSteps[analysisStepIndex]}</p>
              <p className="text-xs text-slate-400 mt-1">Executing deterministic security & reliability rules...</p>
            </div>
          </Card>
        )}

        {currentReport && !analyzing && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* BEFORE / AFTER SCORE DELTA CARD (MODULE 10) */}
            {analysisComp && (
              <Card className="glass-card border-cyan-500/30 bg-cyan-500/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/20 pb-3">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">Score Improvement Delta</h4>
                      <p className="text-xs text-slate-400 font-mono">
                        Before: {analysisComp.beforeScore} / 100 → After: {analysisComp.afterScore} / 100
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                      analysisComp.improved
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    }`}
                  >
                    {analysisComp.delta} Points
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 font-mono text-xs">
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-emerald-400 font-bold block mb-1">✅ Fixed Issues ({analysisComp.fixedCount})</span>
                    {analysisComp.fixedIssues.map((f, i) => (
                      <div key={i} className="text-slate-300 truncate text-[11px]">• {f.title}</div>
                    ))}
                    {analysisComp.fixedCount === 0 && <span className="text-slate-500 text-[11px]">None</span>}
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-rose-400 font-bold block mb-1">❌ Still Present ({analysisComp.remainingCount})</span>
                    {analysisComp.remainingIssues.map((f, i) => (
                      <div key={i} className="text-slate-300 truncate text-[11px]">• {f.title}</div>
                    ))}
                    {analysisComp.remainingCount === 0 && <span className="text-slate-500 text-[11px]">None</span>}
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-amber-400 font-bold block mb-1">⚠️ New Issues ({analysisComp.newCount})</span>
                    {analysisComp.newIssues.map((f, i) => (
                      <div key={i} className="text-slate-300 truncate text-[11px]">• {f.title}</div>
                    ))}
                    {analysisComp.newCount === 0 && <span className="text-slate-500 text-[11px]">None</span>}
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2 glass-card p-6 border border-slate-800 flex flex-col justify-between text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-cyan-400">
                  <Activity className="w-32 h-32" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Overall Deployment Quality Score
                  </span>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <span
                      className={`text-5xl font-extrabold font-mono px-5 py-2 rounded-2xl border ${getScoreColorClass(
                        currentReport.overallScore
                      )}`}
                    >
                      {currentReport.overallScore}
                    </span>
                    <span className="text-xl font-bold text-slate-500 font-mono">/ 100</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80">
                  <p className="text-xs font-semibold text-slate-300">
                    Status:{' '}
                    {currentReport.overallScore >= 80 ? (
                      <span className="text-emerald-400 font-bold">Production Ready</span>
                    ) : currentReport.overallScore >= 60 ? (
                      <span className="text-amber-400 font-bold">Needs Improvement</span>
                    ) : (
                      <span className="text-rose-400 font-bold">High Deployment Risk</span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    Analyzed {currentReport.analyzedFiles?.length || 0} file(s) • Report v1.0.0
                  </p>
                </div>
              </div>

              {/* VISUAL CATEGORY BARS */}
              <div className="lg:col-span-3 grid grid-cols-2 gap-4">
                <div className="glass-card p-4 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-cyan-400" /> Security (30%)
                    </span>
                    <span className="text-sm font-bold font-mono text-cyan-300">
                      {currentReport.categoryScores?.security} / 100
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-cyan-500 h-full transition-all duration-500"
                      style={{ width: `${currentReport.categoryScores?.security || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="glass-card p-4 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-blue-400" /> Reliability (30%)
                    </span>
                    <span className="text-sm font-bold font-mono text-blue-300">
                      {currentReport.categoryScores?.reliability} / 100
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-blue-500 h-full transition-all duration-500"
                      style={{ width: `${currentReport.categoryScores?.reliability || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="glass-card p-4 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-purple-400" /> Performance (20%)
                    </span>
                    <span className="text-sm font-bold font-mono text-purple-300">
                      {currentReport.categoryScores?.performance} / 100
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-purple-500 h-full transition-all duration-500"
                      style={{ width: `${currentReport.categoryScores?.performance || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="glass-card p-4 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Best Practices (20%)
                    </span>
                    <span className="text-sm font-bold font-mono text-emerald-300">
                      {currentReport.categoryScores?.bestPractices} / 100
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${currentReport.categoryScores?.bestPractices || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <Card title="Explainable Score Deduction Breakdown" subtitle="Detailed audit of score reductions per category">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-semibold text-cyan-400">Security</span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {currentReport.categoryScores?.security}/100
                    </span>
                  </div>
                  {currentReport.categoryDeductions?.security?.length === 0 ? (
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> No deductions
                    </p>
                  ) : (
                    currentReport.categoryDeductions?.security?.map((d, i) => (
                      <div key={i} className="text-[11px] flex items-center justify-between text-slate-400">
                        <span className="truncate max-w-[140px]">{d.title}</span>
                        <span className="text-rose-400 font-mono font-bold">-{d.deduction}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-semibold text-blue-400">Reliability</span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {currentReport.categoryScores?.reliability}/100
                    </span>
                  </div>
                  {currentReport.categoryDeductions?.reliability?.length === 0 ? (
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> No deductions
                    </p>
                  ) : (
                    currentReport.categoryDeductions?.reliability?.map((d, i) => (
                      <div key={i} className="text-[11px] flex items-center justify-between text-slate-400">
                        <span className="truncate max-w-[140px]">{d.title}</span>
                        <span className="text-rose-400 font-mono font-bold">-{d.deduction}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-semibold text-purple-400">Performance</span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {currentReport.categoryScores?.performance}/100
                    </span>
                  </div>
                  {currentReport.categoryDeductions?.performance?.length === 0 ? (
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> No deductions
                    </p>
                  ) : (
                    currentReport.categoryDeductions?.performance?.map((d, i) => (
                      <div key={i} className="text-[11px] flex items-center justify-between text-slate-400">
                        <span className="truncate max-w-[140px]">{d.title}</span>
                        <span className="text-rose-400 font-mono font-bold">-{d.deduction}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-semibold text-emerald-400">Best Practices</span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {currentReport.categoryScores?.bestPractices}/100
                    </span>
                  </div>
                  {currentReport.categoryDeductions?.bestPractices?.length === 0 ? (
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> No deductions
                    </p>
                  ) : (
                    currentReport.categoryDeductions?.bestPractices?.map((d, i) => (
                      <div key={i} className="text-[11px] flex items-center justify-between text-slate-400">
                        <span className="truncate max-w-[140px]">{d.title}</span>
                        <span className="text-rose-400 font-mono font-bold">-{d.deduction}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>

            <Card
              title={`Explainable Findings Audit (${filteredFindings.length})`}
              subtitle="Categorized rule violations with why it matters and recommended fixes"
              headerAction={
                <div className="flex items-center gap-1 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  {['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setSeverityFilter(sev)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                        severityFilter === sev
                          ? 'bg-slate-700 text-white font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              }
            >
              {filteredFindings.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No findings matching the selected filter severity.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFindings.map((finding, index) => (
                    <div
                      key={index}
                      className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                            {finding.ruleId || 'RULE-001'}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${getSeverityBadgeClass(
                              finding.severity
                            )}`}
                          >
                            {finding.severity}
                          </span>
                          <h4 className="text-sm font-semibold text-slate-200">{finding.title}</h4>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono">
                          <span className="text-slate-400">{finding.resource}</span>
                          {finding.deduction > 0 && (
                            <span className="text-rose-400 font-bold">-{finding.deduction} pts</span>
                          )}
                        </div>
                      </div>

                      {finding.why && (
                        <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-xs text-slate-300">
                          <span className="font-semibold text-amber-300">Why it matters: </span>
                          {finding.why}
                        </div>
                      )}

                      {finding.recommendation && (
                        <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800/60 text-xs text-cyan-300 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-200">How to improve: </span>
                            {finding.recommendation}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {currentReport.recommendations?.length > 0 && (
              <Card title="Prioritized Resolution Guide" subtitle="Actions to improve readiness score">
                <ol className="space-y-2 list-decimal list-inside text-xs text-slate-300 font-sans leading-relaxed">
                  {currentReport.recommendations.map((rec, i) => (
                    <li key={i} className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                      <span className="text-slate-200 font-medium">{rec}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            )}

            {analyzerHistory.length > 0 && (
              <Card title="Analysis Report History" subtitle="Previous deployment analysis runs">
                <div className="space-y-2">
                  {analyzerHistory.map((hist) => (
                    <button
                      key={hist._id}
                      onClick={() => loadReport(projectId, hist._id)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        currentReport._id === hist._id
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <History className="w-4 h-4 text-cyan-400" />
                        <div>
                          <p className="text-xs font-semibold text-slate-200">
                            Report #{hist._id.slice(-6)}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Analyzed {hist.analyzedFiles?.length || 0} file(s) • {formatDate(hist.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${getScoreColorClass(
                            hist.overallScore
                          )}`}
                        >
                          Score: {hist.overallScore}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* SECTION 4: KUBERNETES SANDBOX */}
      <div className="space-y-6 pt-4 border-t border-slate-800">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-cyan-400" /> Kubernetes Sandbox Environment
            </h2>
            {activeDeployment && (
              <div>{getSandboxStatusBadge(liveStatus?.overallStatus || activeDeployment.status)}</div>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Deploy analyzed manifests into an isolated Kubernetes sandbox namespace.
          </p>
        </div>

        {sandboxError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{sandboxError}</span>
            </div>
            <button onClick={clearSandboxErrors} className="hover:text-rose-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <Card className="bg-slate-900/80 border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-200">Select Files & Initiate Sandbox Deployment</h3>
              {files.filter((f) => f.fileType === 'yaml').length === 0 ? (
                <p className="text-xs text-slate-400">
                  No .yaml or .yml files uploaded yet. Please upload manifest files above first.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  {files
                    .filter((f) => f.fileType === 'yaml')
                    .map((file) => (
                      <label
                        key={file._id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono cursor-pointer transition-all ${
                          selectedFileIds.includes(file._id)
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFileIds.includes(file._id)}
                          onChange={() => toggleFileCheckbox(file._id)}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20"
                        />
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        {file.originalName}
                      </label>
                    ))}
                </div>
              )}
            </div>

            <Button
              variant="primary"
              onClick={handleRunDeploy}
              disabled={deploying || selectedFileIds.length === 0}
              isLoading={deploying}
              className="shrink-0 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500"
            >
              <Rocket className="w-4 h-4 fill-current" /> Deploy to Sandbox
            </Button>
          </div>
        </Card>

        {deploying && (
          <Card className="text-center py-8 space-y-4 border-emerald-500/30 bg-slate-900/90">
            <div className="w-10 h-10 border-3 border-slate-700 border-t-emerald-400 rounded-full animate-spin mx-auto"></div>
            <div>
              <p className="text-sm font-semibold text-slate-100">{deploySteps[deployStepIndex]}</p>
              <p className="text-xs text-slate-400 mt-1">Applying isolated sandbox namespace & resource limits...</p>
            </div>
          </Card>
        )}

        {activeDeployment && !deploying && (
          <div className="space-y-4">
            <Card className="glass-card border border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Active Sandbox Namespace:
                    </span>
                    <span className="text-sm font-bold font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20">
                      {activeDeployment.namespace}
                    </span>
                    {getSandboxStatusBadge(liveStatus?.overallStatus || activeDeployment.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 font-mono pt-1">
                    <span>Deployments: {liveStatus?.deploymentsCount || 1}</span>
                    <span>•</span>
                    <span>Services: {liveStatus?.servicesCount || 1}</span>
                    <span>•</span>
                    <span>Pods: {liveStatus?.podsCount || 2}</span>
                    <span>•</span>
                    <span>Started: {formatDate(activeDeployment.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Button variant="primary" size="sm" onClick={handleOpenSandboxModal}>
                    <Server className="w-3.5 h-3.5" /> View Live Status & Pods
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleStopSandbox}
                    isLoading={sandboxActionLoading}
                    className="hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-400"
                  >
                    <StopCircle className="w-3.5 h-3.5" /> Stop Sandbox
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* SECTION 5: FAILURE SCENARIO ENGINE, AI MENTOR & SOLUTION VALIDATION */}
      <div className="space-y-6 pt-4 border-t border-slate-800">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" /> Controlled Failure Scenarios & Solution Validation
            </h2>
            {attemptsHistory.length > 0 && (
              <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
                Attempts Logged: {attemptsHistory.length}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Inject controlled real-world DevOps failures into your sandbox, troubleshoot root causes, and validate your YAML fixes against live K8s telemetry.
          </p>
        </div>

        {scenarioError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{scenarioError}</span>
            </div>
            <button onClick={clearScenarioErrors} className="hover:text-rose-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Active Scenario Banner */}
        {activeAttempt && activeAttempt.status !== 'cancelled' && (
          <Card className="glass-card border-amber-500/40 bg-amber-500/5 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-mono font-bold animate-pulse">
                    🔥 SCENARIO ACTIVE
                  </span>
                  <h3 className="text-base font-bold text-slate-100">{activeAttempt.scenarioName}</h3>
                </div>
                <p className="text-xs text-slate-300">
                  Target Expected State:{' '}
                  <strong className="font-mono text-amber-300">{activeAttempt.expectedState}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunValidation}
                  isLoading={validating}
                  disabled={validating}
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Redeploy & Validate Fix
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCancelScenario}
                  isLoading={scenarioActionLoading}
                  className="hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-400 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Cancel & Restore
                </Button>
              </div>
            </div>

            {/* VALIDATION PROGRESS ANIMATION */}
            {validating && (
              <Card className="text-center py-6 space-y-3 border-emerald-500/30 bg-slate-950/90">
                <div className="w-8 h-8 border-3 border-slate-700 border-t-emerald-400 rounded-full animate-spin mx-auto"></div>
                <div>
                  <p className="text-xs font-bold text-slate-100">{validationSteps[valStepIndex]}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Evaluating real Kubernetes runtime state against scenario validation rules...</p>
                </div>
              </Card>
            )}

            {/* SOLUTION VALIDATION RESULT PANEL */}
            {validationResult && !validating && (
              <div className="p-5 bg-slate-950 border border-emerald-500/30 rounded-2xl space-y-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100">Solution Validation Result</h3>
                      <p className="text-xs text-slate-400 font-mono">
                        Validated at {formatDate(validationResult.validatedAt)} (Attempt #{validationResult.attemptNumber || 1})
                      </p>
                    </div>
                  </div>

                  <div>{getValidationBadge(validationResult.status)}</div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans">{validationResult.summary}</p>

                {/* Validation Checks */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Executed Validation Checks</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(validationResult.checks || []).map((chk, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-200">{chk.name}</p>
                          <p className="text-[10px] text-slate-500">
                            Expected: {String(chk.expected)} | Actual: {String(chk.actual)}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            chk.status === 'PASS'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {chk.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BEFORE vs AFTER Telemetry Comparison */}
                {comp && (
                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
                    <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> BEFORE vs AFTER Telemetry State Comparison
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[11px]">
                      <div className="p-2 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase block">Status</span>
                        <span className="text-rose-400 line-through">{comp.observedStatus?.before}</span>
                        <ArrowRight className="w-3 h-3 inline mx-1 text-slate-600" />
                        <span className="text-emerald-400 font-bold">{comp.observedStatus?.after}</span>
                      </div>
                      <div className="p-2 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase block">Pod Readiness</span>
                        <span className="text-rose-400 line-through">{comp.podReady?.before ? 'Ready' : 'Unready'}</span>
                        <ArrowRight className="w-3 h-3 inline mx-1 text-slate-600" />
                        <span className="text-emerald-400 font-bold">{comp.podReady?.after ? 'Ready' : 'Unready'}</span>
                      </div>
                      <div className="p-2 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase block">Exit Code</span>
                        <span className="text-rose-400 line-through">Code: {comp.exitCode?.before}</span>
                        <ArrowRight className="w-3 h-3 inline mx-1 text-slate-600" />
                        <span className="text-emerald-400 font-bold">Code: {comp.exitCode?.after}</span>
                      </div>
                      <div className="p-2 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase block">Service Endpoints</span>
                        <span className="text-slate-400">{comp.endpointCount?.before}</span>
                        <ArrowRight className="w-3 h-3 inline mx-1 text-slate-600" />
                        <span className="text-cyan-400 font-bold">{comp.endpointCount?.after}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SYSTEM DIAGNOSIS CONTEXT TELEMETRY PANEL */}
            <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-cyan-400" /> System Diagnosis Context (v1.0 Telemetry)
                </h4>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRefreshContext}
                  isLoading={contextRefreshing}
                  className="text-xs font-mono"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh Diagnosis Context
                </Button>
              </div>

              {contextLoading ? (
                <LoadingSpinner label="Collecting Kubernetes runtime telemetry..." size="sm" />
              ) : summary ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Observed Status</span>
                    <span className="font-bold text-rose-400 text-sm">🔴 {summary.observedStatus}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Container Restarts</span>
                    <span className="font-bold text-amber-300 text-sm">{summary.restartCount} restarts</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Exit Code / Reason</span>
                    <span className="font-bold text-yellow-300 text-sm">
                      Code: {summary.exitCode} ({summary.waitingReason})
                    </span>
                  </div>
                  <div className="md:col-span-3 p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block mb-1">Recent Kubernetes Event</span>
                    <span className="text-cyan-300 text-xs">{summary.recentEvent}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Context telemetry being collected automatically...</p>
              )}
            </div>

            {/* CONTEXT-AWARE AI MENTOR PANEL */}
            <div className="p-5 bg-slate-950 border border-cyan-500/30 rounded-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">KubeMentor AI Mentor</h3>
                    <p className="text-xs text-slate-400">Context-Grounded DevOps Troubleshooting Assistant</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">Confidence:</span>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-mono font-bold uppercase border ${
                      diagnosis?.diagnosis?.confidence === 'high'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {diagnosis?.diagnosis?.confidence || 'High'}
                  </span>
                </div>
              </div>

              {aiLoading ? (
                <LoadingSpinner label="AI Mentor reasoning over ContextSnapshot..." size="md" />
              ) : diagnosis ? (
                <div className="space-y-4">
                  {/* AI Grounded Diagnosis */}
                  <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <HelpCircle className="w-4 h-4" /> AI Grounded Diagnosis & Validation Explanation
                    </h4>
                    <p className="text-sm text-slate-200 leading-relaxed font-sans">
                      {diagnosis.diagnosis?.summary || diagnosis.likelyCause}
                    </p>
                  </div>

                  {/* Cited Evidence */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cited Telemetry Evidence
                      </h4>
                      <ul className="space-y-1.5 text-xs font-mono text-slate-300">
                        {(diagnosis.evidence || []).map((ev, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                            {ev}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Next Steps */}
                    <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <ChevronRight className="w-4 h-4 text-cyan-400" /> Suggested Next Steps
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                        {(diagnosis.nextSteps || []).map((step, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-cyan-400 font-bold">•</span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Progressive Hint System */}
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-400" /> Progressive Hint System
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400">
                        Current Level: {activeHintLevel} of 4
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { lvl: 1, label: 'L1: Direction' },
                        { lvl: 2, label: 'L2: Evidence' },
                        { lvl: 3, label: 'L3: Root Cause' },
                        { lvl: 4, label: 'L4: Suggested Fix' },
                      ].map((item) => (
                        <button
                          key={item.lvl}
                          onClick={() => handleRequestHintLevel(item.lvl)}
                          disabled={hintLoading}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                            activeHintLevel === item.lvl
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {activeHint && (
                      <div className="p-3 bg-slate-950 rounded-lg border border-amber-500/30 text-xs text-amber-200 leading-relaxed font-sans mt-2 animate-in fade-in">
                        <strong className="font-mono text-amber-400">Level {activeHintLevel} Hint: </strong>
                        {activeHint}
                      </div>
                    )}
                  </div>

                  {/* Interactive Conversation Timeline */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-purple-400" /> Ask AI Mentor
                    </h4>

                    {messages.length > 0 && (
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3 max-h-60 overflow-y-auto font-sans text-xs">
                        {messages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl max-w-[85%] ${
                              msg.role === 'user'
                                ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 ml-auto'
                                : 'bg-slate-900 border border-slate-800 text-slate-200'
                            }`}
                          >
                            <p className="text-[10px] font-mono text-slate-400 mb-1 uppercase font-bold">
                              {msg.role === 'user' ? 'You' : 'AI Mentor'}
                            </p>
                            <p className="leading-relaxed">{msg.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <form onSubmit={handleSendChatMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={chatInputText}
                        onChange={(e) => setChatInputText(e.target.value)}
                        placeholder="Ask a question about this scenario (e.g. Why is the exit code 1?)..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={chatLoading || !chatInputText}
                        isLoading={chatLoading}
                        className="shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" /> Send
                      </Button>
                    </form>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Initializing AI Mentor analysis...</p>
              )}
            </div>
          </Card>
        )}

        {!activeDeployment || activeDeployment.status === 'stopped' ? (
          <Card className="text-center py-8 border-dashed border-slate-800">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-semibold text-slate-200">Sandbox Deployment Required</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-3">
              Deploy your project manifests to the Kubernetes Sandbox above before starting failure scenarios.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((sc) => (
              <Card key={sc.scenarioId} className="flex flex-col justify-between hover:border-slate-700 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getDifficultyBadgeClass(
                        sc.difficulty
                      )}`}
                    >
                      {sc.difficulty}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {sc.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      {sc.scenarioId === 'crash-loop-backoff' && <Bomb className="w-4 h-4 text-rose-400" />}
                      {sc.scenarioId === 'image-pull-backoff' && <StopCircle className="w-4 h-4 text-amber-400" />}
                      {sc.scenarioId === 'oom-killed' && <Flame className="w-4 h-4 text-red-400" />}
                      {sc.scenarioId === 'missing-configmap' && <FileText className="w-4 h-4 text-yellow-400" />}
                      {sc.scenarioId === 'service-connectivity' && <WifiOff className="w-4 h-4 text-blue-400" />}
                      {sc.scenarioId === 'ingress-tls-failure' && <Lock className="w-4 h-4 text-purple-400" />}
                      {sc.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{sc.description}</p>
                  </div>

                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-300">
                    <span className="font-semibold text-slate-400">Target Failure: </span>
                    <span className="font-mono text-amber-300">{sc.expectedFailure}</span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => handleStartScenario(sc.scenarioId)}
                    disabled={scenarioActionLoading || (activeAttempt && activeAttempt.status !== 'cancelled')}
                    isLoading={scenarioActionLoading && activeAttempt?.scenarioId === sc.scenarioId}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Start Scenario
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Attempts History Timeline */}
        {attemptsHistory.length > 0 && (
          <Card title="Scenario Attempts History" subtitle="Recorded failure scenario attempts">
            <div className="space-y-2">
              {attemptsHistory.map((att) => (
                <div
                  key={att._id}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-slate-200">
                      {att.scenarioName} (Attempt #{att.attemptNumber || 1})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Started: {formatDate(att.createdAt)} • Expected: {att.expectedState}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] border font-bold capitalize ${
                      att.status === 'active'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : att.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                    }`}
                  >
                    {att.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* MODALS */}
      {/* LIVE SANDBOX INSPECTION VIEW */}
      <Modal isOpen={isSandboxModalOpen} onClose={() => setIsSandboxModalOpen(false)} title={`Sandbox Inspection: ${activeDeployment?.namespace}`}>
        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">Live Status:</span>
              {getSandboxStatusBadge(liveStatus?.overallStatus || activeDeployment?.status)}
            </div>
            <Button variant="secondary" size="sm" onClick={handleRefreshSandboxStatus} isLoading={sandboxStatusLoading}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
            </Button>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Box className="w-4 h-4 text-cyan-400" /> Pod Status ({liveStatus?.pods?.length || 0})
            </h4>
            <div className="space-y-2">
              {(liveStatus?.pods || []).map((pod, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-slate-200">{pod.name}</p>
                    <p className="text-[11px] text-slate-500">
                      Containers: {pod.containers?.map((c) => `${c.name} (${c.state})`).join(', ') || 'nginx'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">Restarts: {pod.restarts || 0}</span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] border font-bold ${
                        pod.phase === 'Running'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {pod.phase}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-400" /> Services ({liveStatus?.services?.length || 0})
            </h4>
            <div className="space-y-2">
              {(liveStatus?.services || []).map((svc, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-200">{svc.name}</p>
                    <p className="text-[11px] text-slate-500">ClusterIP: {svc.clusterIP}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      Type: {svc.type}
                    </span>
                    <span className="text-cyan-400">
                      Ports: {svc.ports?.map((p) => `${p.port}:${p.targetPort}`).join(', ') || '80:8080'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-purple-400" /> Kubernetes Events Timeline
            </h4>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 max-h-48 overflow-y-auto font-mono text-[11px]">
              {(liveStatus?.events || []).map((evt, idx) => (
                <div key={idx} className="flex items-start justify-between gap-2 border-b border-slate-900 pb-1.5">
                  <div className="flex items-start gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        evt.type === 'Warning' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-cyan-400'
                      }`}
                    >
                      {evt.reason}
                    </span>
                    <span className="text-slate-300">{evt.message}</span>
                  </div>
                  <span className="text-slate-500 shrink-0">{formatDate(evt.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsSandboxModalOpen(false)}>
              Close Status Inspection
            </Button>
          </div>
        </div>
      </Modal>

      {/* FILE MODALS */}
      {/* UPLOAD FILE */}
      <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Upload Project File">
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {localValidationError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{localValidationError}</span>
            </div>
          )}

          <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-cyan-500/50 transition-colors relative cursor-pointer bg-slate-950/40">
            <input
              type="file"
              onChange={handleFileDrop}
              accept=".yaml,.yml,Dockerfile"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-10 h-10 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-200">
              {selectedUploadFile ? selectedUploadFile.name : 'Click to select or drag and drop file'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports .yaml, .yml, Dockerfile (Max 5 MB)
            </p>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] font-mono text-slate-500 uppercase">OR Paste Content</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Target Filename</label>
            <input
              type="text"
              value={uploadFilename}
              onChange={(e) => setUploadFilename(e.target.value)}
              placeholder="deployment.yaml"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 mb-2"
            />
            <label className="block text-xs font-medium text-slate-300 mb-1">Raw Code Content</label>
            <textarea
              value={pasteContent}
              onChange={(e) => {
                setPasteContent(e.target.value);
                if (localValidationError) setLocalValidationError('');
              }}
              rows={6}
              placeholder="apiVersion: apps/v1&#10;kind: Deployment&#10;metadata:..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsUploadOpen(false)}
              disabled={fileActionLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={fileActionLoading}>
              Upload File
            </Button>
          </div>
        </form>
      </Modal>

      {/* REPLACE FILE */}
      <Modal isOpen={isReplaceOpen} onClose={() => setIsReplaceOpen(false)} title={`Replace ${selectedFileItem?.originalName}`}>
        <form onSubmit={handleReplaceSubmit} className="space-y-4">
          {localValidationError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{localValidationError}</span>
            </div>
          )}

          <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-cyan-500/50 transition-colors relative cursor-pointer bg-slate-950/40">
            <input
              type="file"
              onChange={handleFileDrop}
              accept=".yaml,.yml,Dockerfile"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-10 h-10 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <RefreshCw className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-200">
              {selectedUploadFile ? selectedUploadFile.name : 'Select new replacement file'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports .yaml, .yml, Dockerfile (Max 5 MB)
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Or Paste Replacement Content</label>
            <textarea
              value={pasteContent}
              onChange={(e) => {
                setPasteContent(e.target.value);
                if (localValidationError) setLocalValidationError('');
              }}
              rows={6}
              placeholder="Paste updated manifest text..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsReplaceOpen(false)}
              disabled={fileActionLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={fileActionLoading}>
              Replace File
            </Button>
          </div>
        </form>
      </Modal>

      {/* READ-ONLY CODE VIEWER */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title={`File Viewer: ${selectedFileItem?.originalName}`}>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
            <span>Type: {selectedFileItem?.fileType?.toUpperCase()}</span>
            <span>Size: {formatBytes(selectedFileItem?.size)}</span>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          {activeFileLoading ? (
            <LoadingSpinner label="Fetching file content..." size="md" />
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 max-h-[450px] overflow-y-auto font-mono text-xs text-cyan-300 shadow-2xl leading-relaxed whitespace-pre-wrap">
              {activeFile?.content || 'No content found for this file.'}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setIsViewOpen(false)}>
              Close Viewer
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE FILE CONFIRMATION */}
      <Modal isOpen={isDeleteFileOpen} onClose={() => setIsDeleteFileOpen(false)} title="Confirm Delete File">
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Are you sure you want to delete <strong className="text-white">{selectedFileItem?.originalName}</strong> from this project?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteFileOpen(false)}
              disabled={fileActionLoading}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteFileConfirm} isLoading={fileActionLoading}>
              Delete File
            </Button>
          </div>
        </div>
      </Modal>

      {/* EDIT PROJECT */}
      <Modal isOpen={isEditProjectOpen} onClose={() => setIsEditProjectOpen(false)} title="Edit Project Details">
        <form onSubmit={handleEditProjectSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Project Name</label>
            <input
              type="text"
              name="name"
              value={projectFormData.name}
              onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
            <textarea
              name="description"
              value={projectFormData.description}
              onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Project Status</label>
            <select
              name="status"
              value={projectFormData.status}
              onChange={(e) => setProjectFormData({ ...projectFormData, status: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="draft">Draft</option>
              <option value="analyzed">Analyzed</option>
              <option value="deployed">Deployed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsEditProjectOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={projectActionLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE PROJECT CONFIRMATION */}
      <Modal isOpen={isDeleteProjectOpen} onClose={() => setIsDeleteProjectOpen(false)} title="Confirm Delete Project">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete <strong className="text-white">{currentProject.name}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsDeleteProjectOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteProjectConfirm} isLoading={projectActionLoading}>
              Delete Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDetails;
