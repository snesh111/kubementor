import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Terminal,
  ArrowLeft,
  Sparkles,
  Layers,
  Wrench,
  CheckCircle2,
  Play,
  FileCode2,
  Bot,
  AlertTriangle,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export const LabPlaceholder = () => {
  const { labId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <Link
        to="/learn"
        className="text-xs text-slate-400 hover:text-cyan-400 inline-flex items-center gap-2 transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Practice Catalog
      </Link>

      <Card className="p-8 border-cyan-500/30 bg-slate-950 space-y-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl text-white shadow-lg shadow-cyan-500/20">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold">
                PART 1 ACTIVATED
              </span>
              <span className="text-xs font-mono text-slate-400">Lab ID: {labId}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-100 mt-1">
              Interactive Lab Workspace Ready for Provisioning
            </h1>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          You have selected practice scenario <strong className="font-mono text-cyan-300">{labId}</strong>.
          Part 1 (Learner Practice Catalog & Unified Topic Navigation) is fully active and verified.
        </p>

        {/* 3-Pane Preview Card */}
        <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> Upcoming Workspace Architecture (Part 2 & 3):
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-cyan-400 font-bold block">1. Left Navigation</span>
              <p className="text-slate-400 text-[11px] font-sans">
                Curriculum tree, topic switching, and mission progress tracking.
              </p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-emerald-400 font-bold block">2. Center Mission</span>
              <p className="text-slate-400 text-[11px] font-sans">
                Concept breakdown, failure anatomy, and diagnostic investigation checklist.
              </p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-purple-400 font-bold block">3. Right Lab Workbench</span>
              <p className="text-slate-400 text-[11px] font-sans">
                Linux Terminal (`kubectl`), YAML Manifest Editor, Scratchpad, and AI Mentor.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <Button variant="secondary" onClick={() => navigate('/learn')}>
            <ArrowLeft className="w-4 h-4" /> Return to Practice Catalog
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/learn')}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-bold"
          >
            Explore Other Practice Scenarios
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default LabPlaceholder;
