import React from 'react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
        <p>&copy; {new Date().getFullYear()} KubeMentor Platform. Built for DevOps & K8s Engineers.</p>
        <div className="flex items-center gap-4 text-slate-400">
          <a href="#" className="hover:text-cyan-400 transition-colors">Documentation</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">API Reference</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
