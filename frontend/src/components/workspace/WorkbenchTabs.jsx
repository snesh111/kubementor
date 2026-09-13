import React from 'react';
import { Terminal, FileCode2, Edit3, Bot } from 'lucide-react';

export const WorkbenchTabs = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'editor', label: 'YAML Editor', icon: FileCode2 },
    { id: 'scratchpad', label: 'Scratchpad', icon: Edit3 },
    { id: 'aimentor', label: 'AI Mentor', icon: Bot },
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-900/90 border-b border-slate-800 px-3 py-1.5 overflow-x-auto select-none shrink-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition-all shrink-0 ${
              isActive
                ? 'bg-slate-950 text-cyan-400 border border-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default WorkbenchTabs;
