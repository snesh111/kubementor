import React, { useState } from 'react';
import {
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Terminal,
  Copy,
  Check,
  Flame,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Layers,
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

export const ScenarioLearningGuide = ({ scenario }) => {
  const [activeTab, setActiveTab] = useState('concept');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});

  if (!scenario) {
    return (
      <div className="p-4 text-center text-slate-400 text-xs">
        Select a failure scenario to view the learning guide.
      </div>
    );
  }

  const concept = scenario.concept || {};
  const playbook = concept.troubleshootingPlaybook || [];
  const whyList = concept.whyItHappens || [];
  const mistakes = concept.commonMistakes || [];
  const proTips = concept.proTips || [];

  const handleCopy = (text, index) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleStepCompleted = (stepNumber) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-800/40 rounded-xl p-4 shadow-lg shadow-black/40">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
              <BookOpen className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-100">{scenario.name} Masterclass</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-900/40 text-blue-300 border border-blue-700/50">
              {scenario.category}
            </span>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
              {scenario.difficulty} Lab
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {scenario.description || concept.whatIsIt}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('concept')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'concept'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Concept & Lifecycle
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('why')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'why'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-400" /> Root Causes & Outage Impact
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('playbook')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'playbook'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Diagnostic Playbook ({playbook.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('protips')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'protips'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Traps & Pro Tips
        </button>
      </div>

      {/* Tab 1: Concept & Lifecycle */}
      {activeTab === 'concept' && (
        <div className="space-y-4">
          <Card className="bg-slate-900/90 border-slate-800">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" /> What is {scenario.name}?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {concept.whatIsIt || scenario.description}
            </p>

            {concept.whenItHappens && (
              <div className="mt-3 pt-3 border-t border-slate-800/80">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                  When Kubernetes triggers it:
                </h4>
                <p className="text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                  {concept.whenItHappens}
                </p>
              </div>
            )}
          </Card>

          <Card className="bg-slate-900/90 border-slate-800">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Target Kubernetes Resource Scope
            </h3>
            <div className="flex flex-wrap gap-2">
              {scenario.supportedResourceKinds?.map((kind) => (
                <span
                  key={kind}
                  className="text-xs font-mono px-2.5 py-1 rounded bg-indigo-950/50 text-indigo-300 border border-indigo-800/50 font-semibold"
                >
                  {kind}
                </span>
              ))}
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-950 text-slate-400 border border-slate-800">
                Injection: {scenario.injectionType}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Root Causes & Outage Impact */}
      {activeTab === 'why' && (
        <div className="space-y-4">
          {/* Outage impact */}
          {concept.productionImpact && (
            <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                  Real-World Production Impact
                </h4>
              </div>
              <p className="text-xs text-rose-200 leading-relaxed">
                {concept.productionImpact}
              </p>
            </div>
          )}

          {/* Root causes */}
          <Card className="bg-slate-900/90 border-slate-800">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Common Real-World Causes
            </h3>
            <div className="space-y-2.5">
              {whyList.map((reason, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80"
                >
                  <span className="w-5 h-5 shrink-0 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-bold flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{reason}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Diagnostic Playbook */}
      {activeTab === 'playbook' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Step-by-step troubleshooting workflow</span>
            <span className="font-mono text-emerald-400">
              {Object.values(completedSteps).filter(Boolean).length} / {playbook.length} Done
            </span>
          </div>

          {playbook.map((step, idx) => {
            const isDone = Boolean(completedSteps[step.stepNumber || idx + 1]);
            return (
              <Card
                key={idx}
                className={`transition-all ${
                  isDone
                    ? 'bg-slate-950/40 border-emerald-900/40 opacity-80'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleStepCompleted(step.stepNumber || idx + 1)}
                    className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center transition-all mt-0.5 ${
                      isDone
                        ? 'bg-emerald-500 text-slate-950'
                        : 'border border-slate-700 hover:border-emerald-500 text-slate-400'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span className="text-xs font-mono font-bold">{step.stepNumber || idx + 1}</span>}
                  </button>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h4
                      className={`text-xs font-bold ${
                        isDone ? 'line-through text-slate-400' : 'text-slate-200'
                      }`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {step.description}
                    </p>

                    {step.command && (
                      <div className="flex items-center justify-between bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300">
                        <span className="truncate">{step.command}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(step.command, idx)}
                          className="ml-2 text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-900 transition-colors"
                          title="Copy command"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tab 4: Traps & Pro Tips */}
      {activeTab === 'protips' && (
        <div className="space-y-4">
          {/* Common Mistakes */}
          <Card className="bg-slate-900/90 border-slate-800">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Common Beginner Pitfalls
            </h3>
            <ul className="space-y-2">
              {mistakes.map((mistake, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Pro Tips */}
          <Card className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border-indigo-900/40">
            <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-indigo-400" /> Senior SRE & DevOps Pro Tips
            </h3>
            <ul className="space-y-2">
              {proTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-indigo-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ScenarioLearningGuide;
