import React from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { AlertTriangle, Play, CheckCircle } from 'lucide-react';

export const Scenarios = () => {
  const scenariosList = [
    {
      id: 'scen-1',
      title: 'Fix ImagePullBackOff Error',
      difficulty: 'Beginner',
      description: 'The web-frontend pod is stuck in ImagePullBackOff due to an incorrect container image tag.',
      solved: true,
    },
    {
      id: 'scen-2',
      title: 'Debug OOMKilled Container',
      difficulty: 'Intermediate',
      description: 'The worker pod is constantly crashing due to insufficient memory resource limits.',
      solved: false,
    },
    {
      id: 'scen-3',
      title: 'Resolve Service Selector Misconfiguration',
      difficulty: 'Advanced',
      description: 'Backend services are unreachable because the Service labels do not match Pod labels.',
      solved: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Troubleshooting Scenarios</h1>
        <p className="text-sm text-slate-400 mt-1">
          Select a DevOps simulation scenario to test and improve your Kubernetes debugging skills.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenariosList.map((scen) => (
          <Card key={scen.id} className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    scen.difficulty === 'Beginner'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : scen.difficulty === 'Intermediate'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {scen.difficulty}
                </span>
                {scen.solved ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> Solved
                  </span>
                ) : null}
              </div>
              <h3 className="text-base font-semibold text-slate-200 mb-2">{scen.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{scen.description}</p>
            </div>
            <Button variant="primary" size="sm" className="w-full">
              <Play className="w-3.5 h-3.5" /> Start Simulation
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Scenarios;
