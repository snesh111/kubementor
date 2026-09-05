import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Cpu, Send, FileCode } from 'lucide-react';

export const Analyzer = () => {
  const [logInput, setLogInput] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">AI Log & YAML Analyzer</h1>
        <p className="text-sm text-slate-400 mt-1">
          Paste Kubernetes logs or manifest YAML to receive instant AI-powered root cause analysis and fix recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Input Manifest or Log Snippet">
          <div className="space-y-4">
            <textarea
              value={logInput}
              onChange={(e) => setLogInput(e.target.value)}
              placeholder="Paste raw kubectl logs or YAML spec here..."
              rows={12}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <Button variant="primary" className="w-full">
              <Cpu className="w-4 h-4" /> Run AI Analysis
            </Button>
          </div>
        </Card>

        <Card title="AI Diagnostic Findings">
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 min-h-[320px] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
                <FileCode className="w-4 h-4" /> Recommended Action
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Submit input on the left panel to trigger the AI troubleshooting engine.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analyzer;
