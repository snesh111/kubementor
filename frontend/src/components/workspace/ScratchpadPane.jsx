import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Edit3,
  Search,
  Lightbulb,
  Target,
  Wrench,
  CheckCircle2,
  AlertCircle,
  FileText,
  Save,
  Loader2,
  Clock,
  Terminal,
  FileCode2,
  Sparkles,
} from 'lucide-react';
import Button from '../common/Button';
import labService from '../../services/labService';

const DEBOUNCE_MS = 1000;

export const ScratchpadPane = ({ session, onSelectTab }) => {
  const labId = session?.labId;

  const [notes, setNotes] = useState({
    evidence: '',
    hypothesis: '',
    rootCause: '',
    plannedFix: '',
    result: '',
    generalNotes: '',
  });

  const [savedNotes, setSavedNotes] = useState({
    evidence: '',
    hypothesis: '',
    rootCause: '',
    plannedFix: '',
    result: '',
    generalNotes: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  const debounceTimerRef = useRef(null);
  const notesRef = useRef(notes);
  notesRef.current = notes;

  // Check if current form is modified from saved
  const isDirty =
    notes.evidence !== savedNotes.evidence ||
    notes.hypothesis !== savedNotes.hypothesis ||
    notes.rootCause !== savedNotes.rootCause ||
    notes.plannedFix !== savedNotes.plannedFix ||
    notes.result !== savedNotes.result ||
    notes.generalNotes !== savedNotes.generalNotes;

  // Load notes from backend
  const fetchNotes = useCallback(async () => {
    if (!labId) return;
    try {
      setLoading(true);
      setSaveError(null);
      const res = await labService.getLabNotes(labId);
      const data = res?.data?.data?.notes || res?.data?.notes || res?.notes || res?.data || res || {};

      const loaded = {
        evidence: data.evidence || '',
        hypothesis: data.hypothesis || '',
        rootCause: data.rootCause || '',
        plannedFix: data.plannedFix || '',
        result: data.result || '',
        generalNotes: data.generalNotes || '',
      };

      setNotes(loaded);
      setSavedNotes(loaded);
      if (data.lastSavedAt) {
        setLastSavedTime(new Date(data.lastSavedAt).toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to load investigation notes:', err);
      setSaveError('Unable to load your investigation notes.');
    } finally {
      setLoading(false);
    }
  }, [labId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Execute save to backend
  const saveNotesToBackend = async (dataToSave = notesRef.current) => {
    if (!labId || saving) return;

    try {
      setSaving(true);
      setSaveError(null);
      const res = await labService.saveLabNotes(labId, dataToSave);
      const savedDoc = res?.data?.data?.notes || res?.data?.notes || res?.notes || res?.data || res || {};

      const updated = {
        evidence: savedDoc.evidence || '',
        hypothesis: savedDoc.hypothesis || '',
        rootCause: savedDoc.rootCause || '',
        plannedFix: savedDoc.plannedFix || '',
        result: savedDoc.result || '',
        generalNotes: savedDoc.generalNotes || '',
      };

      setSavedNotes(updated);
      setLastSavedTime(new Date().toLocaleTimeString());
      setSuccessToast('Notes saved');
      setTimeout(() => setSuccessToast(null), 2500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Notes could not be saved.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Trigger debounced autosave on change
  const handleChange = (field, value) => {
    setNotes((prev) => {
      const next = { ...prev, [field]: value };
      notesRef.current = next;
      return next;
    });

    setSaveError(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveNotesToBackend(notesRef.current);
    }, DEBOUNCE_MS);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center p-8 space-y-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading investigation notes...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#000000] rounded-xl border border-[#1e293b]/80 flex flex-col overflow-hidden font-sans text-xs shadow-2xl">
      {/* 1. HEADER & METHODOLOGY BANNER */}
      <div className="bg-[#000000] px-4 py-2.5 border-b border-[#1e293b]/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wide">
              Root-Cause Investigation Scratchpad
            </h4>
            <p className="text-[10px] text-slate-400">
              Structured Diagnostic Workspace — Auto-saved to Cloud
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab('terminal')}
            className="px-2 py-1 rounded bg-[#080d14] border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-emerald-400 text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
            title="Inspect terminal output"
          >
            <Terminal className="w-3 h-3" />
            <span className="hidden sm:inline">Terminal</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab('editor')}
            className="px-2 py-1 rounded bg-[#080d14] border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-emerald-400 text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
            title="Edit YAML manifests"
          >
            <FileCode2 className="w-3 h-3" />
            <span className="hidden sm:inline">YAML</span>
          </button>
        </div>
      </div>

      {/* 2. ERROR BANNER */}
      {saveError && (
        <div className="bg-rose-950/80 border-b border-rose-800 px-3.5 py-2 flex items-center justify-between text-rose-300 text-xs shrink-0 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-mono text-[11px]">{saveError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            className="text-rose-400 hover:text-rose-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. SCROLLABLE INVESTIGATION FIELDS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#000000]">
        {/* Step 1: Observed Evidence */}
        <div className="space-y-1.5 bg-[#080d14] p-3.5 rounded-xl border border-[#1e293b]/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Observed Evidence & Telemetry</span>
            </label>
            <span className="text-[10px] font-mono text-slate-500">
              {notes.evidence.length} / 10,000
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            What anomalies did you observe in <code className="text-emerald-400">kubectl get pods</code>, <code className="text-emerald-400">kubectl describe</code>, or <code className="text-emerald-400">kubectl logs</code>?
          </p>
          <textarea
            rows={3}
            value={notes.evidence}
            onChange={(e) => handleChange('evidence', e.target.value)}
            placeholder="e.g. Pod is in CrashLoopBackOff state. Logs show container exiting with code 1 after startup..."
            className="w-full bg-[#000000] border border-[#1e293b] rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono leading-relaxed"
          />
        </div>

        {/* Step 2: Working Hypothesis */}
        <div className="space-y-1.5 bg-[#080d14] p-3.5 rounded-xl border border-[#1e293b]/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold font-mono text-amber-300 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Working Hypothesis</span>
            </label>
            <span className="text-[10px] font-mono text-slate-500">
              {notes.hypothesis.length} / 10,000
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            What do you hypothesize is causing this behavior based on your findings?
          </p>
          <textarea
            rows={2}
            value={notes.hypothesis}
            onChange={(e) => handleChange('hypothesis', e.target.value)}
            placeholder="e.g. The application container is configured with an invalid startup command override in the Deployment spec..."
            className="w-full bg-[#000000] border border-[#1e293b] rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
          />
        </div>

        {/* Step 3: Suspected Root Cause */}
        <div className="space-y-1.5 bg-[#080d14] p-3.5 rounded-xl border border-[#1e293b]/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold font-mono text-rose-300 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-rose-400" />
              <span>3. Suspected Root Cause</span>
            </label>
            <span className="text-[10px] font-mono text-slate-500">
              {notes.rootCause.length} / 10,000
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            What specific misconfiguration line, resource limit, or missing secret/configmap is the root cause?
          </p>
          <textarea
            rows={2}
            value={notes.rootCause}
            onChange={(e) => handleChange('rootCause', e.target.value)}
            placeholder="e.g. deployment.yaml line 16 has command: ['/bin/sh', '-c', 'sleep 2 && exit 1'] which causes instant process termination..."
            className="w-full bg-[#000000] border border-[#1e293b] rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
          />
        </div>

        {/* Step 4: Planned Fix */}
        <div className="space-y-1.5 bg-[#080d14] p-3.5 rounded-xl border border-[#1e293b]/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold font-mono text-cyan-300 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-cyan-400" />
              <span>4. Planned Fix & Manifest Changes</span>
            </label>
            <span className="text-[10px] font-mono text-slate-500">
              {notes.plannedFix.length} / 10,000
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            What changes do you plan to make in the YAML Editor tab before re-deploying?
          </p>
          <textarea
            rows={2}
            value={notes.plannedFix}
            onChange={(e) => handleChange('plannedFix', e.target.value)}
            placeholder="e.g. Remove the failing command array from deployment.yaml and re-deploy to isolated sandbox..."
            className="w-full bg-[#000000] border border-[#1e293b] rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
          />
        </div>

        {/* Step 5: Result & Outcome */}
        <div className="space-y-1.5 bg-[#080d14] p-3.5 rounded-xl border border-[#1e293b]/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold font-mono text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>5. Result & Verification</span>
            </label>
            <span className="text-[10px] font-mono text-slate-500">
              {notes.result.length} / 10,000
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            What happened after deploying your fix? Did the failure clear in the terminal?
          </p>
          <textarea
            rows={2}
            value={notes.result}
            onChange={(e) => handleChange('result', e.target.value)}
            placeholder="e.g. Deployed manifest fix. Observed pod transitioning to Running with 1/1 Ready and 0 restarts in kubectl get pods..."
            className="w-full bg-[#000000] border border-[#1e293b] rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
          />
        </div>

        {/* Step 6: General Notes */}
        <div className="space-y-1.5 bg-[#080d14] p-3.5 rounded-xl border border-[#1e293b]/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold font-mono text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>6. General Notes & Observations</span>
            </label>
            <span className="text-[10px] font-mono text-slate-500">
              {notes.generalNotes.length} / 20,000
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Freeform scratchpad for command outputs, architecture notes, and key takeaways.
          </p>
          <textarea
            rows={4}
            value={notes.generalNotes}
            onChange={(e) => handleChange('generalNotes', e.target.value)}
            placeholder="Record CLI outputs, describe snippets, or key learnings here..."
            className="w-full bg-[#000000] border border-[#1e293b] rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono leading-relaxed"
          />
        </div>
      </div>

      {/* 4. ACTION FOOTER & AUTOSAVE STATUS BAR */}
      <div className="p-2.5 bg-[#000000] border-t border-[#1e293b]/80 flex items-center justify-between shrink-0 font-sans">
        <div className="flex items-center gap-2 text-xs">
          {saving ? (
            <span className="flex items-center gap-1 text-slate-400 font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>Saving...</span>
            </span>
          ) : isDirty ? (
            <span className="flex items-center gap-1 text-amber-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Unsaved changes</span>
            </span>
          ) : successToast ? (
            <span className="flex items-center gap-1 text-emerald-400 font-mono animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{successToast}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Saved</span>
              {lastSavedTime && (
                <span className="text-slate-500 text-[10px] ml-1">({lastSavedTime})</span>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => saveNotesToBackend(notes)}
            disabled={!isDirty || saving}
            className="text-xs font-mono flex items-center gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Notes</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScratchpadPane;
