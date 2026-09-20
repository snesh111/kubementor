import React from 'react';
import WorkbenchTabs from './WorkbenchTabs';
import TerminalPane from './TerminalPane';
import YamlEditorPane from './YamlEditorPane';
import ScratchpadPane from './ScratchpadPane';
import AIMentorPane from './AIMentorPane';

export const WorkspaceLabPane = ({
  scenario,
  session,
  activeTab,
  onSelectTab,
  splitPercent,
  onSetSplitPercent,
}) => {
  return (
    <div className="w-full h-full bg-[#000000] flex flex-col overflow-hidden select-none">
      {/* Tab bar */}
      <WorkbenchTabs
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        splitPercent={splitPercent}
        onSetSplitPercent={onSetSplitPercent}
      />

      {/* Tab Contents Area */}
      <div className="flex-1 overflow-hidden p-3 flex flex-col select-text">
        {/* TAB 1: REAL INTERACTIVE TERMINAL (kept mounted for session continuity) */}
        <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'terminal' ? 'flex' : 'hidden'}`}>
          <TerminalPane session={session} />
        </div>

        {/* TAB 2: YAML MANIFEST EDITOR */}
        {activeTab === 'editor' && (
          <YamlEditorPane session={session} onSelectTab={onSelectTab} />
        )}

        {/* TAB 3: PERSISTENT INVESTIGATION SCRATCHPAD */}
        {activeTab === 'scratchpad' && (
          <ScratchpadPane session={session} onSelectTab={onSelectTab} />
        )}

        {/* TAB 4: AI MENTOR */}
        {activeTab === 'aimentor' && (
          <AIMentorPane session={session} onSelectTab={onSelectTab} />
        )}
      </div>
    </div>
  );
};

export default WorkspaceLabPane;
