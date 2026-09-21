import React from 'react';
import {
  Terminal,
  FileCode2,
  Edit3,
  Bot,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export const WorkbenchTabs = ({
  activeTab,
  onSelectTab,
  splitPercent,
  onSetSplitPercent,
}) => {
  const tabs = [
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'editor', label: 'YAML Editor', icon: FileCode2 },
    { id: 'scratchpad', label: 'Scratchpad', icon: Edit3 },
    { id: 'aimentor', label: 'AI Mentor', icon: Bot },
  ];

  return (
    <div className="flex items-center justify-between bg-[#000000] border-b border-[#1e293b]/80 px-3 py-1.5 overflow-x-auto select-none shrink-0 font-sans">
      {/* Tab Selectors */}
      <div className="flex items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#0a0e17] text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Side: Maximize/Minimize Layout Controls */}
      {onSetSplitPercent && (
        <div className="hidden md:flex items-center pl-3 border-l border-slate-800/80">
          <button
            type="button"
            onClick={() => onSetSplitPercent(splitPercent <= 15 ? 48 : 0)}
            title={splitPercent <= 15 ? 'Restore Split View' : 'Maximize Workbench (Full Screen)'}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              splitPercent <= 15
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-[#080d14] text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {splitPercent <= 15 ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkbenchTabs;
