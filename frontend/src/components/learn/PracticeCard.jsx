import {
  Bomb,
  StopCircle,
  Flame,
  FileText,
  WifiOff,
  Lock,
  AlertTriangle,
  Box,
  Layers,
  Network,
  KeyRound,
  Play,
  Clock,
  Sparkles,
  LockKeyhole,
  BookOpen,
  Trophy,
  CheckCircle2,
  RotateCcw,
  Target,
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

export const PracticeCard = ({ item, masteryState, onStartLab, onViewDetails }) => {
  const isLive = item.isLive !== false && item.status === 'Available';
  const effectiveMastery = masteryState || item.masteryState;

  const getIcon = (name) => {
    switch (name) {
      case 'Bomb':
        return <Bomb className="w-5 h-5 text-rose-400" />;
      case 'StopCircle':
        return <StopCircle className="w-5 h-5 text-amber-400" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-red-400" />;
      case 'FileText':
        return <FileText className="w-5 h-5 text-yellow-400" />;
      case 'WifiOff':
        return <WifiOff className="w-5 h-5 text-blue-400" />;
      case 'Lock':
        return <Lock className="w-5 h-5 text-purple-400" />;
      case 'Box':
        return <Box className="w-5 h-5 text-cyan-400" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-indigo-400" />;
      case 'Network':
        return <Network className="w-5 h-5 text-emerald-400" />;
      case 'KeyRound':
        return <KeyRound className="w-5 h-5 text-orange-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case 'Beginner':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Intermediate':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Advanced':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <Card
      className={`flex flex-col justify-between transition-all group ${
        isLive
          ? 'hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-950/20 bg-[#080d14] border-[#1e293b]'
          : 'opacity-75 bg-[#05080e]/60 border-slate-850'
      }`}
    >
      <div className="space-y-4">
        {/* Top meta row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getDifficultyBadge(item.difficulty)}`}>
              {item.difficulty}
            </span>
            {effectiveMastery && (
              effectiveMastery === 'MASTERED' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-mono font-bold">
                  <Trophy className="w-3 h-3 text-purple-400" /> Mastered
                </span>
              ) : effectiveMastery === 'COMPLETED' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completed
                </span>
              ) : effectiveMastery === 'PRACTICING' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold">
                  <RotateCcw className="w-3 h-3 text-amber-400" /> Practicing
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#000000] text-slate-500 border border-slate-800 text-[10px] font-mono">
                  Not Started
                </span>
              )
            )}
          </div>

          {isLive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Lab
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#000000] text-slate-400 border border-slate-800 text-[10px] font-mono">
              <LockKeyhole className="w-3 h-3 text-slate-500" />
              Coming Soon
            </span>
          )}
        </div>

        {/* Title & Icon */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#000000] border border-slate-800 shrink-0 group-hover:border-emerald-500/30 transition-colors">
            {getIcon(item.iconName)}
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors leading-snug font-mono">
              {item.name}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans line-clamp-2">
              {item.description}
            </p>
          </div>
        </div>

        {/* Target condition / failure tag */}
        {item.expectedFailure && (
          <div className="p-2 bg-[#000000] rounded-lg border border-slate-800 text-[11px] flex items-center justify-between">
            <span className="text-slate-500 font-mono text-[10px] uppercase">Target Failure:</span>
            <span className="font-mono font-bold text-amber-300 truncate max-w-[160px]">{item.expectedFailure}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 mt-4 border-t border-[#1e293b]/80 flex items-center gap-2">
        {isLive ? (
          <>
            {onViewDetails && (
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 text-xs font-semibold hover:border-emerald-500/30 hover:text-emerald-300"
                onClick={() => onViewDetails(item)}
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Details
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              className="flex-1 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-950/40"
              onClick={() => onStartLab(item)}
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Start Lab
            </Button>
          </>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled
            className="w-full text-xs text-slate-500 border-slate-800 bg-[#000000] cursor-not-allowed"
          >
            <LockKeyhole className="w-3.5 h-3.5" /> Practice Available in Next Update
          </Button>
        )}
      </div>
    </Card>
  );
};

export default PracticeCard;
