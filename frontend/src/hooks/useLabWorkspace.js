import { useState, useEffect, useCallback, useRef } from 'react';
import labService from '../services/labService';

export const PROVISIONING_STEPS = [
  { id: 1, label: 'Initializing lab workspace session', desc: 'Validating practice topic and preparing internal workspace' },
  { id: 2, label: 'Ensuring isolated sandbox namespace', desc: 'Allocating dedicated tenant namespace and resource quota' },
  { id: 3, label: 'Deploying starter application', desc: 'Applying baseline Deployment, Service, and ConfigMap manifests' },
  { id: 4, label: 'Injecting failure scenario', desc: 'Triggering controlled failure condition in sandbox' },
  { id: 5, label: 'Collecting telemetry & diagnostics', desc: 'Grounding telemetry for CLI and AI mentor' },
];

export const useLabWorkspace = (labId) => {
  const [session, setSession] = useState(null);
  const [isLabStarted, setIsLabStarted] = useState(false);
  const [isStartingLab, setIsStartingLab] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisioningStep, setProvisioningStep] = useState(1);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState(null);
  const inFlightRef = useRef(false);

  // Initial load: Fetch existing session metadata if available without auto-starting timer/terminal
  useEffect(() => {
    let isMounted = true;
    const loadSessionPreview = async () => {
      if (!labId) return;
      try {
        const res = await labService.getLabSession(labId);
        const existingSession =
          res?.data?.session || res?.session || res?.data?.data?.session || (res?.labId ? res : null);
        if (isMounted && existingSession) {
          setSession(existingSession);
        }
      } catch (err) {
        // No session yet; session will be initialized on Start Lab
      }
    };

    setIsLabStarted(false);
    loadSessionPreview();

    return () => {
      isMounted = false;
    };
  }, [labId]);

  // Explicit action triggered when learner clicks "Start Lab"
  const startLabAction = useCallback(async () => {
    if (!labId || inFlightRef.current) return;
    inFlightRef.current = true;

    setIsStartingLab(true);
    setError(null);

    try {
      const startRes = await labService.startLab(labId);
      const newSession =
        startRes?.data?.session ||
        startRes?.session ||
        startRes?.data?.data?.session ||
        (startRes?.labId ? startRes : null);

      if (newSession) {
        setSession(newSession);
        setIsLabStarted(true);
      } else {
        throw new Error('Could not parse lab session response.');
      }
    } catch (err) {
      console.error('[useLabWorkspace] Start Lab error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to start lab environment.');
    } finally {
      setIsStartingLab(false);
      inFlightRef.current = false;
    }
  }, [labId]);

  const resetLab = useCallback(async () => {
    if (!labId) return;

    setIsResetting(true);
    setError(null);

    try {
      const res = await labService.resetLab(labId);
      const resetSession =
        res?.data?.session || res?.session || res?.data?.data?.session || (res?.labId ? res : null);
      if (resetSession) {
        setSession(resetSession);
        setIsLabStarted(true);
      }
    } catch (err) {
      console.error('[useLabWorkspace] Reset error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to reset lab environment.');
    } finally {
      setIsResetting(false);
    }
  }, [labId]);

  return {
    session,
    isLabStarted,
    isStartingLab,
    isProvisioning,
    provisioningStep,
    isResetting,
    error,
    startLabAction,
    startOrResumeLab: startLabAction,
    resetLab,
    setSession,
    setIsLabStarted,
  };
};

export default useLabWorkspace;
