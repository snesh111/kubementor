import React from 'react';
import Card from '../components/common/Card';
import ResourceCard from '../components/k8s/ResourceCard';
import TerminalView from '../components/k8s/TerminalView';
import { Cpu, AlertTriangle, CheckCircle, Activity } from 'lucide-react';

export const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">DevOps Control Center</h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor active simulation scenarios, Kubernetes cluster status, and AI diagnostics.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Cluster Status</p>
            <p className="text-lg font-bold text-slate-100">Healthy</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Active Incidents</p>
            <p className="text-lg font-bold text-slate-100">2 Pending</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Solved Scenarios</p>
            <p className="text-lg font-bold text-slate-100">14 / 20</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">AI Assistant</p>
            <p className="text-lg font-bold text-slate-100">Ready</p>
          </div>
        </Card>
      </div>

      {/* Cluster Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Live Pod Resources" subtitle="Current simulated pods in default namespace">
          <div className="space-y-3">
            <ResourceCard name="web-frontend-7c959779d-q8k2" type="Pod" status="Running" restarts={0} />
            <ResourceCard name="api-gateway-5569485b9-9xlp" type="Pod" status="CrashLoopBackOff" restarts={5} />
            <ResourceCard name="db-postgresql-0" type="Pod" status="Pending" restarts={0} />
          </div>
        </Card>

        <Card title="Live Diagnostics Terminal" subtitle="Container log tail output">
          <TerminalView logs="2026-08-04T11:20:01Z [INFO] Initializing API Service...\n2026-08-04T11:20:03Z [ERROR] Failed to connect to MongoDB: connection timed out\n2026-08-04T11:20:05Z [FATAL] Process exited with status code 1" />
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
