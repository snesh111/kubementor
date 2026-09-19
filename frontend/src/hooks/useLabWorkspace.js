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
  const [isProvisioning, setIsProvisioning] = useState(true);
  const [provisioningStep, setProvisioningStep] = useState(1);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState(null);
  const inFlightRef = useRef(false);

  const startOrResumeLab = useCallback(async () => {
    if (!labId || inFlightRef.current) return;
    inFlightRef.current = true;

    setIsProvisioning(true);
    setError(null);
    setProvisioningStep(1);

    // Simulate animated step progression while backend orchestrates
    const stepTimer1 = setTimeout(() => setProvisioningStep(2), 400);
    const stepTimer2 = setTimeout(() => setProvisioningStep(3), 900);
    const stepTimer3 = setTimeout(() => setProvisioningStep(4), 1500);

    try {
      // 1. Try to fetch existing active session
      let res = null;
      try {
        res = await labService.getLabSession(labId);
      } catch (getErr) {
        // No active session found, start new lab
      }

      const existingSession =
        res?.data?.session || res?.session || res?.data?.data?.session || (res?.labId ? res : null);

      if (existingSession) {
        setProvisioningStep(5);
        setSession(existingSession);
        setIsProvisioning(false);
        inFlightRef.current = false;
        return;
      }

      // 2. Provision new lab session
      const startRes = await labService.startLab(labId);
      const newSession =
        startRes?.data?.session ||
        startRes?.session ||
        startRes?.data?.data?.session ||
        (startRes?.labId ? startRes : null);

      if (newSession) {
        setProvisioningStep(5);
        setTimeout(() => {
          setSession(newSession);
          setIsProvisioning(false);
          inFlightRef.current = false;
        }, 300);
      } else {
        throw new Error('Could not parse lab session response.');
      }
    } catch (err) {
      console.error('[useLabWorkspace] Provisioning error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to provision lab workspace.');
      setIsProvisioning(false);
      inFlightRef.current = false;
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
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
      }
    } catch (err) {
      console.error('[useLabWorkspace] Reset error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to reset lab environment.');
    } finally {
      setIsResetting(false);
    }
  }, [labId]);

  useEffect(() => {
    startOrResumeLab();
  }, [startOrResumeLab]);

  return {
    session,
    isProvisioning,
    provisioningStep,
    isResetting,
    error,
    startOrResumeLab,
    resetLab,
    setSession,
  };
};

export default useLabWorkspace;
