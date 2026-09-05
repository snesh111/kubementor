import React from 'react';
import { Box, Activity } from 'lucide-react';
import { getStatusColorClass } from '../../utils/helpers';

export const ResourceCard = ({ name, type = 'Pod', status = 'Running', namespace = 'default', restarts = 0 }) => {
  const badgeClass = getStatusColorClass(status);

  return (
    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-800 rounded-lg text-cyan-400">
          <Box className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-200 leading-tight">{name}</h4>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {type} • ns: {namespace}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
          Restarts: {restarts}
        </span>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${badgeClass}`}>
          {status}
        </span>
      </div>
    </div>
  );
};

export default ResourceCard;
