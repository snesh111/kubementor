import React from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Upload, Rocket } from 'lucide-react';

export const Deployment = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Deployment Simulator</h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload or compose Kubernetes manifest files to simulate deployment dry-runs and detect potential runtime issues before pushing to production.
        </p>
      </div>

      <Card title="Upload Kubernetes Manifest">
        <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center space-y-4 hover:border-cyan-500/50 transition-colors cursor-pointer">
          <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">Drag and drop your .yaml or .yml manifest</p>
            <p className="text-xs text-slate-500 mt-1">Supports Pod, Deployment, Service & Ingress specs</p>
          </div>
          <Button variant="secondary" size="sm">
            Select File
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Deployment;
