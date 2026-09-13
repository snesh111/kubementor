import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  FileCode2,
  Save,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import Button from '../common/Button';
import labService from '../../services/labService';

export const YamlEditorPane = ({ session, onSelectTab }) => {
  const labId = session?.labId;
  const namespace = session?.namespace || 'kubementor-sandbox';

  const [files, setFiles] = useState([]);
  const [activeFilename, setActiveFilename] = useState('deployment.yaml');
  const [fileContents, setFileContents] = useState({}); // { [filename]: currentText }
  const [savedContents, setSavedContents] = useState({}); // { [filename]: savedText }
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);
  const [deploymentResult, setDeploymentResult] = useState(null);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Load files from backend
  const fetchFiles = useCallback(async () => {
    if (!labId) return;
    try {
      setLoadingFiles(true);
      setValidationError(null);
      const res = await labService.getLabFiles(labId);
      const fileList = res.data?.data?.files || [];
      setFiles(fileList);

      const contentsMap = {};
      fileList.forEach((f) => {
        contentsMap[f.originalName] = f.content;
      });

      setFileContents(contentsMap);
      setSavedContents(contentsMap);

      if (fileList.length > 0 && (!activeFilename || !contentsMap[activeFilename])) {
        setActiveFilename(fileList[0].originalName);
      }
    } catch (err) {
      console.error('Failed to load lab files:', err);
      setValidationError('Failed to fetch lab manifest files. Please retry.');
    } finally {
      setLoadingFiles(false);
    }
  }, [labId, activeFilename]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const currentContent = fileContents[activeFilename] || '';
  const currentSaved = savedContents[activeFilename] || '';
  const isDirty = currentContent !== currentSaved;
  const anyDirty = Object.keys(fileContents).some(
    (fname) => fileContents[fname] !== savedContents[fname]
  );

  // Handle editor text change
  const handleEditorChange = (value) => {
    setFileContents((prev) => ({
      ...prev,
      [activeFilename]: value || '',
    }));
    setValidationError(null);
    setSaveSuccessMsg(null);
  };

  // Save active file
  const handleSave = async (filenameToSave = activeFilename) => {
    if (!labId || saving) return false;
    const contentToSave = fileContents[filenameToSave] ?? '';

    try {
      setSaving(true);
      setValidationError(null);
      setSaveSuccessMsg(null);

      const res = await labService.saveLabFile(labId, filenameToSave, contentToSave);
      const savedDoc = res.data?.data?.file;

      setSavedContents((prev) => ({
        ...prev,
        [filenameToSave]: savedDoc?.content || contentToSave,
      }));

      setSaveSuccessMsg(`Saved ${filenameToSave}`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save manifest';
      setValidationError(msg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Save all modified files
  const handleSaveAll = async () => {
    const dirtyFiles = Object.keys(fileContents).filter(
      (fname) => fileContents[fname] !== savedContents[fname]
    );

    for (const fname of dirtyFiles) {
      const ok = await handleSave(fname);
      if (!ok) return false;
    }
    return true;
  };

  // Deploy saved manifests
  const handleDeploy = async () => {
    if (!labId || deploying) return;

    if (anyDirty) {
      setShowUnsavedPrompt(true);
      return;
    }

    executeDeployment();
  };

  const executeDeployment = async () => {
    setShowUnsavedPrompt(false);
    try {
      setDeploying(true);
      setValidationError(null);
      setDeploymentResult(null);

      const res = await labService.deployLab(labId);
      const result = res.data?.data?.deploymentResult;
      setDeploymentResult(result);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Deployment execution failed';
      setValidationError(msg);
      setDeploymentResult({
        status: 'failed',
        message: msg,
        observedFailure: 'ExecutionError',
      });
    } finally {
      setDeploying(false);
    }
  };

  const handleSaveAndDeploy = async () => {
    setShowUnsavedPrompt(false);
    const ok = await handleSaveAll();
    if (ok) {
      executeDeployment();
    }
  };

  // Keyboard shortcut: Ctrl+S or Cmd+S
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (isDirty) {
        handleSave();
      }
    }
  };

  if (loadingFiles) {
    return (
      <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center p-8 space-y-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading lab manifests...</p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 bg-slate-950 rounded-xl border border-slate-800 flex flex-col overflow-hidden font-sans text-xs shadow-2xl relative"
      onKeyDown={handleKeyDown}
    >
      {/* 1. FILE TABS HEADER */}
      <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[70%]">
          {files.map((file) => {
            const fname = file.originalName;
            const fileDirty = fileContents[fname] !== savedContents[fname];
            const isActive = activeFilename === fname;

            return (
              <button
                key={fname}
                type="button"
                onClick={() => {
                  setActiveFilename(fname);
                  setValidationError(null);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-slate-950 text-cyan-400 border border-slate-800 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{fname}</span>
                {fileDirty && (
                  <span
                    className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
                    title="Unsaved changes"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            Ctrl+S to save
          </span>
          <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            YAML Manifest
          </span>
        </div>
      </div>

      {/* 2. VALIDATION ERROR BANNER */}
      {validationError && (
        <div className="bg-rose-950/80 border-b border-rose-800 px-3 py-2 flex items-start gap-2 text-rose-300 text-xs shrink-0 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-mono text-[11px] leading-snug break-words">
            {validationError}
          </div>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className="text-rose-400 hover:text-rose-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. MONACO CODE EDITOR BODY */}
      <div className="flex-1 overflow-hidden relative">
        <Editor
          height="100%"
          language="yaml"
          theme="vs-dark"
          value={currentContent}
          onChange={handleEditorChange}
          options={{
            fontSize: 13,
            lineNumbers: 'on',
            minimap: { enabled: false },
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 },
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
          }}
        />
      </div>

      {/* 4. DEPLOYMENT RESULT OVERLAY / CARD */}
      {deploymentResult && (
        <div className="border-t border-slate-800 bg-slate-900/95 p-3.5 space-y-2.5 shrink-0 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {deploymentResult.status === 'fixed' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Workload Recovered</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Still Failing ({deploymentResult.observedFailure || 'Unresolved'})</span>
                </div>
              )}

              <span className="text-[11px] font-mono text-slate-400">
                Applied to <span className="text-slate-200 font-bold">{namespace}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectTab && onSelectTab('terminal')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Observe in Terminal</span>
              </button>
              <button
                type="button"
                onClick={() => setDeploymentResult(null)}
                className="text-slate-400 hover:text-slate-200 text-xs px-1"
              >
                ✕
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {deploymentResult.message}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px] font-mono text-slate-400 border-t border-slate-800/60">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-cyan-400" /> YAML Validated
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-cyan-400" /> RBAC Enforced
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-cyan-400" /> Manifest Applied
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" /> State Evaluated
            </span>
          </div>
        </div>
      )}

      {/* 5. UNSAVED CHANGES MODAL PROMPT */}
      {showUnsavedPrompt && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 max-w-sm w-full space-y-3 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-amber-400 font-bold font-mono">
              <AlertCircle className="w-4 h-4" />
              <span>Unsaved Changes</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              You have modified manifest files that are not saved yet. Would you like to save them before deploying?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUnsavedPrompt(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAndDeploy}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
              >
                Save & Deploy
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. ACTION FOOTER & STATUS BAR */}
      <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between shrink-0 font-sans">
        <div className="flex items-center gap-2 text-xs">
          {saving ? (
            <span className="flex items-center gap-1 text-slate-400 font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" /> Saving...
            </span>
          ) : isDirty ? (
            <span className="flex items-center gap-1 text-amber-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Unsaved changes
            </span>
          ) : saveSuccessMsg ? (
            <span className="flex items-center gap-1 text-emerald-400 font-mono animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {saveSuccessMsg}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleSave()}
            disabled={!isDirty || saving}
            className="text-xs font-mono flex items-center gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDeploy}
            disabled={deploying}
            className="text-xs font-mono flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20"
          >
            {deploying ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deploying...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Deploy</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default YamlEditorPane;
