import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
  Zap,
  Target,
  Layers,
  Award,
  Terminal,
  Activity,
  Flame,
  Star,
} from 'lucide-react';
import progressService from '../services/progressService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

export const ProgressDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [topics, setTopics] = useState([]);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedTab, setSelectedTab] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryData, scenarioData, topicData, recentData, recData] = await Promise.all([
        progressService.getUserProgress().catch(() => ({})),
        progressService.getScenarioMasteryList().catch(() => []),
        progressService.getTopicProgressList().catch(() => []),
        progressService.getRecentPractice(10).catch(() => []),
        progressService.getRecommendations().catch(() => []),
      ]);

      const rawSummary = summaryData?.data || summaryData || {};
      const rawScenarios = Array.isArray(scenarioData?.data) ? scenarioData.data : Array.isArray(scenarioData) ? scenarioData : [];
      const rawTopics = Array.isArray(topicData?.data) ? topicData.data : Array.isArray(topicData) ? topicData : [];
      const rawRecent = Array.isArray(recentData?.data) ? recentData.data : Array.isArray(recentData) ? recentData : [];
      const rawRecs = Array.isArray(recData?.data) ? recData.data : Array.isArray(recData) ? recData : [];

      setSummary(rawSummary);
      setScenarios(rawScenarios);
      setTopics(rawTopics);
      setRecentAttempts(rawRecent);
      setRecommendations(rawRecs);
    } catch (err) {
      console.error('[ProgressDashboard] Failed to load progress:', err);
      setError(err.message || 'Failed to load learner progress data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getMasteryBadge = (state) => {
    switch (state) {
      case 'MASTERED':
        return {
          label: 'Mastered',
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          icon: Trophy,
          iconColor: 'text-purple-400',
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: CheckCircle2,
          iconColor: 'text-emerald-400',
        };
      case 'PRACTICING':
        return {
          label: 'Practicing',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: RotateCcw,
          iconColor: 'text-amber-400',
        };
      default:
        return {
          label: 'Not Started',
          bg: 'bg-slate-800/60 text-slate-400 border-slate-700/50',
          icon: Target,
          iconColor: 'text-slate-500',
        };
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

  const scenarioList = Array.isArray(scenarios) ? scenarios : [];
  const filteredScenarios = scenarioList.filter((s) => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'mastered') return s.masteryState === 'MASTERED';
    if (selectedTab === 'completed') return s.masteryState === 'COMPLETED';
    if (selectedTab === 'practicing') return s.masteryState === 'PRACTICING';
    if (selectedTab === 'not_started') return s.masteryState === 'NOT_STARTED';
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-mono text-cyan-400 animate-pulse">Calculating authoritative learner mastery...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> Validation-Authoritative Progress
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Learner Progress & <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Mastery</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Track your hands-on Kubernetes troubleshooting skills. Mastery is deterministically derived from verified runtime validation passes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/learn')}
              className="text-xs"
            >
              <Terminal className="w-4 h-4 mr-1.5 text-cyan-400" />
              Practice Catalog
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/byoa')}
              className="text-xs"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Test Custom App
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchData} className="text-xs text-rose-300 hover:bg-rose-500/20">
            Retry
          </Button>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-slate-900/60 border-slate-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>TOTAL SCENARIOS</span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-bold text-white">{summary?.totalScenarios || 0}</p>
          <div className="mt-2 text-[11px] text-slate-500 font-mono">Available Labs</div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>MASTERED</span>
            <Trophy className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-purple-400">{summary?.masteredScenarios || 0}</p>
          <div className="mt-2 text-[11px] text-purple-400/80 font-mono">
            {summary?.totalScenarios ? Math.round((summary.masteredScenarios / summary.totalScenarios) * 100) : 0}% Mastery Rate
          </div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>COMPLETED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-emerald-400">{summary?.completedScenarios || 0}</p>
          <div className="mt-2 text-[11px] text-emerald-400/80 font-mono">
            {summary?.completionPercentage || 0}% Completion
          </div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>PRACTICING</span>
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-amber-400">{summary?.practicingScenarios || 0}</p>
          <div className="mt-2 text-[11px] text-amber-400/80 font-mono">In Progress Labs</div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 p-4 flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>AVG BEST SCORE</span>
            <Award className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-blue-400">{summary?.averageScore || 0}%</p>
          <div className="mt-2 text-[11px] text-blue-400/80 font-mono">Across Validations</div>
        </Card>
      </div>

      {/* Recommended Next Practice & Topic Progress Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Next Practice */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Recommended Next Practice
            </h2>
            <span className="text-xs text-slate-400 font-mono">Deterministic Prioritization</span>
          </div>

          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.scenarioId}
                  className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getDifficultyBadge(rec.difficulty)}`}>
                        {rec.difficulty}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {rec.topic}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                        {rec.priorityReason}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {rec.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {rec.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/lab/${rec.scenarioId}`)}
                      className="whitespace-nowrap shadow-lg shadow-cyan-950/40"
                    >
                      <Play className="w-3.5 h-3.5 mr-1 fill-current" />
                      Start Practice
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-200">All available scenarios mastered!</p>
              <p className="text-xs text-slate-500 mt-1">Try testing your custom applications in BYOA.</p>
            </Card>
          )}
        </div>

        {/* Topic Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Topic Progress
            </h2>
          </div>

          <Card className="bg-slate-900/60 border-slate-800 p-5 space-y-5">
            {topics.length > 0 ? (
              topics.map((t) => (
                <div key={t.topic} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{t.topic}</span>
                    <span className="font-mono text-slate-400">
                      {t.completedScenarios}/{t.totalScenarios} Completed ({t.completionPercentage}%)
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                      style={{ width: `${(t.masteredScenarios / (t.totalScenarios || 1)) * 100}%` }}
                      title={`Mastered: ${t.masteredScenarios}`}
                    ></div>
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                      style={{ width: `${((t.completedScenarios - t.masteredScenarios) / (t.totalScenarios || 1)) * 100}%` }}
                      title={`Completed: ${t.completedScenarios - t.masteredScenarios}`}
                    ></div>
                    <div
                      className="h-full bg-amber-500/60"
                      style={{ width: `${(t.practicingScenarios / (t.totalScenarios || 1)) * 100}%` }}
                      title={`Practicing: ${t.practicingScenarios}`}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>{t.masteredScenarios} Mastered</span>
                    <span>Avg Score: {t.averageScore}%</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No topic data available.</p>
            )}
          </Card>
        </div>
      </div>

      {/* Scenario Mastery Catalog Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Scenario Mastery Status
            </h2>
            <p className="text-xs text-slate-400">Authoritative status for each hands-on troubleshooting scenario</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            {[
              { id: 'all', label: 'All' },
              { id: 'mastered', label: 'Mastered' },
              { id: 'completed', label: 'Completed' },
              { id: 'practicing', label: 'Practicing' },
              { id: 'not_started', label: 'Not Started' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScenarios.map((sc) => {
            const badge = getMasteryBadge(sc.masteryState);
            const BadgeIcon = badge.icon;
            return (
              <Card
                key={sc.scenarioId}
                className="bg-slate-900/60 border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition-all space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getDifficultyBadge(sc.difficulty)}`}>
                      {sc.difficulty}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${badge.bg}`}>
                      <BadgeIcon className={`w-3 h-3 ${badge.iconColor}`} />
                      {badge.label}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase">{sc.topic}</span>
                    <h3 className="text-base font-bold text-white mt-0.5 leading-snug">{sc.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{sc.description}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                      <p className="text-[10px] text-slate-500">ATTEMPTS</p>
                      <p className="font-bold text-slate-200">{sc.attempts || 0}</p>
                    </div>
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                      <p className="text-[10px] text-slate-500">PASSES</p>
                      <p className="font-bold text-emerald-400">{sc.passCount || 0}</p>
                    </div>
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                      <p className="text-[10px] text-slate-500">BEST SCORE</p>
                      <p className="font-bold text-cyan-400">{sc.bestScore || 0}%</p>
                    </div>
                  </div>

                  <Button
                    variant={sc.masteryState === 'MASTERED' ? 'secondary' : 'primary'}
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => navigate(`/lab/${sc.scenarioId}`)}
                  >
                    <Terminal className="w-3.5 h-3.5 mr-1.5" />
                    {sc.masteryState === 'NOT_STARTED' ? 'Start Lab' : 'Practice Lab'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Recent Validation Activity
          </h2>
          <span className="text-xs text-slate-400 font-mono">Authoritative Test History</span>
        </div>

        <Card className="bg-slate-900/60 border-slate-800 p-0 overflow-hidden">
          {recentAttempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Scenario</th>
                    <th className="px-5 py-3">Result</th>
                    <th className="px-5 py-3">Score</th>
                    <th className="px-5 py-3">Attempt #</th>
                    <th className="px-5 py-3">Summary</th>
                    <th className="px-5 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {recentAttempts.map((item) => (
                    <tr key={item.validationId || item._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-200">
                        {item.scenarioName || item.scenarioId}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            item.status === 'PASS'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : item.status === 'PARTIAL'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-100">
                        {item.score}%
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        #{item.attemptNumber || 1}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 font-sans max-w-xs truncate">
                        {item.summary || 'Validation completed'}
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-500">
                        {item.validatedAt ? new Date(item.validatedAt).toLocaleDateString() : 'Recent'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <p className="text-sm">No validation activity recorded yet.</p>
              <p className="text-xs mt-1">Start a practice lab and validate your solution to track progress.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProgressDashboard;
