import React from 'react';
import { NavLink } from 'react-router-dom';
import KubeMentorBrandLogo from './KubeMentorBrandLogo';

export const Footer = () => {
  return (
    <footer className="border-t border-[#1e293b]/70 bg-[#000000] pt-14 pb-8 px-6 text-xs text-slate-400 font-sans relative z-10 select-none">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Top Multi-Column Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="col-span-2 space-y-3">
            <NavLink to="/learn" className="inline-flex items-center group">
              <KubeMentorBrandLogo size="sm" showText={true} />
            </NavLink>
            <p className="text-xs text-slate-400 font-normal leading-relaxed max-w-sm">
              Hands-on labs on real isolated Kubernetes clusters.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-200">
              Product
            </h4>
            <ul className="space-y-2 text-xs font-mono text-slate-400">
              <li>
                <NavLink to="/learn" className="hover:text-emerald-400 transition-colors">
                  Catalog
                </NavLink>
              </li>
              <li>
                <NavLink to="/skills/troubleshooting" className="hover:text-emerald-400 transition-colors">
                  Roadmaps
                </NavLink>
              </li>
              <li>
                <NavLink to="/skills" className="hover:text-emerald-400 transition-colors">
                  Skills
                </NavLink>
              </li>
              <li>
                <NavLink to="/byoa" className="hover:text-emerald-400 transition-colors">
                  Playground
                </NavLink>
              </li>
              <li>
                <NavLink to="/analyzer" className="hover:text-emerald-400 transition-colors">
                  AI Mentor
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-200">
              Platform
            </h4>
            <ul className="space-y-2 text-xs font-mono text-slate-400">
              <li>
                <a
                  href="https://kubernetes.io/docs/home/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-cyan-400 transition-colors"
                >
                  K8s Docs
                </a>
              </li>
              <li>
                <NavLink to="/progress" className="hover:text-emerald-400 transition-colors">
                  Mastery Index
                </NavLink>
              </li>
              <li>
                <NavLink to="/deployment" className="hover:text-emerald-400 transition-colors">
                  Sandboxes
                </NavLink>
              </li>
              <li>
                <NavLink to="/profile" className="hover:text-emerald-400 transition-colors">
                  Telemetry
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Social / Community Links */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-200">
              Community
            </h4>
            <ul className="space-y-2 text-xs font-mono text-slate-400">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://kubernetes.io/community/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Kubernetes
                </a>
              </li>
              <li>
                <NavLink to="/learn" className="hover:text-emerald-400 transition-colors">
                  Incident Drills
                </NavLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar matching screenshot */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-500">
          <div>&copy; 2026 kubementor</div>
          <div className="text-slate-400">runs on real machines</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
