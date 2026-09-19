import React from 'react';
import { Layers, Settings, Wrench, ShieldAlert, Sparkles } from 'lucide-react';
import PracticeCard from './PracticeCard';

export const PracticeCategory = ({ category, masteryMap, onStartLab, onViewDetails }) => {
  const getCategoryIcon = (categoryId) => {
    switch (categoryId) {
      case 'basics':
        return <Layers className="w-5 h-5 text-cyan-400" />;
      case 'configuration':
        return <Settings className="w-5 h-5 text-amber-400" />;
      case 'troubleshooting':
        return <Wrench className="w-5 h-5 text-rose-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-indigo-400" />;
    }
  };

  const liveCount = (category.items || []).filter((i) => i.isLive !== false && i.status === 'Available').length;
  const totalCount = (category.items || []).length;

  return (
    <div className="space-y-4">
      {/* Category Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
            {getCategoryIcon(category.categoryId)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">{category.categoryName}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {liveCount > 0 ? `${liveCount} Live Labs` : 'In Development'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{category.description}</p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-500">
          {totalCount} Practice {totalCount === 1 ? 'Topic' : 'Topics'}
        </div>
      </div>

      {/* Grid of Practice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(category.items || []).map((item) => (
          <PracticeCard
            key={item.id || item.slug}
            item={item}
            masteryState={masteryMap ? masteryMap[item.scenarioId || item.slug || item.id] : item.masteryState}
            onStartLab={onStartLab}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
};

export default PracticeCategory;
