import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Terminal,
  Search,
  Filter,
  Sparkles,
  Layers,
  Wrench,
  Settings,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Play,
  Clock,
  BookOpen,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

import labService from '../services/labService';
import PracticeCategory from '../components/learn/PracticeCategory';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

const FALLBACK_CATALOG = [
  {
    categoryId: 'basics',
    categoryName: 'Kubernetes Basics',
    description: 'Master core building blocks: Pod lifecycle, declarative Deployments, and L4 Services.',
    items: [
      {
        id: 'topic-pods',
        slug: 'topic-pods',
        name: 'Pods & Multi-Container Pods',
        description: 'Atomic scheduling unit in Kubernetes. Learn container specifications, shared networking, and lifecycle states.',
        difficulty: 'Beginner',
        estTime: '10 mins',
        status: 'Coming Soon',
        isLive: false,
        category: 'Kubernetes Basics',
        iconName: 'Box',
      },
      {
        id: 'topic-deployments',
        slug: 'topic-deployments',
        name: 'Deployments & Rolling Updates',
        description: 'Declaratively manage replica sets, zero-downtime rolling updates, pod revisions, and rollbacks.',
        difficulty: 'Beginner',
        estTime: '15 mins',
        status: 'Coming Soon',
        isLive: false,
        category: 'Kubernetes Basics',
        iconName: 'Layers',
      },
      {
        id: 'topic-services',
        slug: 'topic-services',
        name: 'Services & Cluster Networking',
        description: 'Expose workloads internally and externally via ClusterIP, NodePort, and LoadBalancer with selector discovery.',
        difficulty: 'Beginner',
        estTime: '15 mins',
        status: 'Coming Soon',
        isLive: false,
        category: 'Kubernetes Basics',
        iconName: 'Network',
      },
    ],
  },
  {
    categoryId: 'configuration',
    categoryName: 'Configuration',
    description: 'Decouple runtime parameters and sensitive keys from container images.',
    items: [
      {
        id: 'topic-configmaps',
        slug: 'topic-configmaps',
        name: 'ConfigMaps & Environment Injection',
        description: 'Inject configuration key-value pairs, property files, and mounted volumes into running containers.',
        difficulty: 'Beginner',
        estTime: '10 mins',
        status: 'Coming Soon',
        isLive: false,
        category: 'Configuration',
        iconName: 'FileText',
      },
      {
        id: 'topic-secrets',
        slug: 'topic-secrets',
        name: 'Secrets & Credential Management',
        description: 'Store sensitive data such as API tokens, passwords, and TLS certificates with base64 encoding and volume mounts.',
        difficulty: 'Intermediate',
        estTime: '12 mins',
        status: 'Coming Soon',
        isLive: false,
        category: 'Configuration',
        iconName: 'KeyRound',
      },
    ],
  },
  {
    categoryId: 'troubleshooting',
    categoryName: 'Troubleshooting',
    description: 'Real-world failure simulations. Diagnose live outages, investigate evidence, and fix configurations.',
    items: [
      {
        id: 'crash-loop-backoff',
        slug: 'crash-loop-backoff',
        scenarioId: 'crash-loop-backoff',
        name: 'CrashLoopBackOff with Exit Code 1',
        description: 'Web microservice container crashes immediately on boot due to missing mandatory configuration variables.',
        difficulty: 'Beginner',
        estTime: '15 mins',
        expectedFailure: 'CrashLoopBackOff (exit code 1)',
        status: 'Available',
        isLive: true,
        category: 'Troubleshooting',
        iconName: 'Bomb',
      },
      {
        id: 'image-pull-backoff',
        slug: 'image-pull-backoff',
        scenarioId: 'image-pull-backoff',
        name: 'ImagePullBackOff Tag Mismatch',
        description: 'Pod fails to download container image from registry due to a non-existent tag.',
        difficulty: 'Beginner',
        estTime: '10 mins',
        expectedFailure: 'ImagePullBackOff',
        status: 'Available',
        isLive: true,
        category: 'Troubleshooting',
        iconName: 'StopCircle',
      },
      {
        id: 'oom-killed',
        slug: 'oom-killed',
        scenarioId: 'oom-killed',
        name: 'Out of Memory (OOMKilled) Exit 137',
        description: 'Container exceeds cgroup memory limits, causing Linux kernel OOM Killer to terminate process.',
        difficulty: 'Intermediate',
        estTime: '15 mins',
        expectedFailure: 'OOMKilled (exit code 137)',
        status: 'Available',
        isLive: true,
        category: 'Troubleshooting',
        iconName: 'Flame',
      },
      {
        id: 'missing-configmap',
        slug: 'missing-configmap',
        scenarioId: 'missing-configmap',
        name: 'Missing ConfigMap / Secret Ref',
        description: 'Pod specification references non-existent ConfigMap, causing CreateContainerConfigError.',
        difficulty: 'Beginner',
        estTime: '10 mins',
        expectedFailure: 'CreateContainerConfigError',
        status: 'Available',
        isLive: true,
        category: 'Troubleshooting',
        iconName: 'FileText',
      },
      {
        id: 'service-connectivity',
        slug: 'service-connectivity',
        scenarioId: 'service-connectivity',
        name: 'Service Selector Label Mismatch',
        description: 'Service selector labels do not match pod metadata labels, dropping all incoming network traffic.',
        difficulty: 'Intermediate',
        estTime: '15 mins',
        expectedFailure: 'Empty Endpoints (502/503)',
        status: 'Available',
        isLive: true,
        category: 'Troubleshooting',
        iconName: 'WifiOff',
      },
      {
        id: 'ingress-tls-failure',
        slug: 'ingress-tls-failure',
        scenarioId: 'ingress-tls-failure',
        name: 'Ingress TLS Secret Missing',
        description: 'Ingress references missing TLS Secret, causing browser SSL handshake failures.',
        difficulty: 'Advanced',
        estTime: '20 mins',
        expectedFailure: 'TLSSecretNotFound',
        status: 'Available',
        isLive: true,
        category: 'Troubleshooting',
        iconName: 'Lock',
      },
    ],
  },
];

export const LearnCatalog = () => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState(FALLBACK_CATALOG);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await labService.getCatalog();
        if (res.data?.catalog && Array.isArray(res.data.catalog) && res.data.catalog.length > 0) {
          setCatalog(res.data.catalog);
        }
      } catch (err) {
        console.warn('Using fallback catalog:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  const handleStartLab = (item) => {
    navigate(`/lab/${item.scenarioId || item.slug || item.id}`);
  };

  const handleViewDetails = (item) => {
    setSelectedDetailItem(item);
  };

  // Filter categories and items based on search and tab selections
  const filteredCatalog = catalog
    .filter((cat) => {
      if (selectedCategoryTab === 'All') return true;
      if (selectedCategoryTab === 'Basics') return cat.categoryId === 'basics';
      if (selectedCategoryTab === 'Configuration') return cat.categoryId === 'configuration';
      if (selectedCategoryTab === 'Troubleshooting') return cat.categoryId === 'troubleshooting';
      return true;
    })
    .map((cat) => {
      const filteredItems = (cat.items || []).filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.expectedFailure && item.expectedFailure.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesDifficulty =
          selectedDifficulty === 'All' || item.difficulty === selectedDifficulty;

        return matchesSearch && matchesDifficulty;
      });

      return {
        ...cat,
        items: filteredItems,
      };
    })
    .filter((cat) => cat.items.length > 0);

  const totalLiveLabs = catalog.reduce(
    (acc, cat) => acc + (cat.items || []).filter((i) => i.isLive !== false && i.status === 'Available').length,
    0
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* HERO SECTION — WHAT DO YOU WANT TO PRACTICE */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold">
            <Terminal className="w-3.5 h-3.5" /> Hands-On Kubernetes Practice Labs
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Choose what you want to practice
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            Select a Kubernetes topic or real-world troubleshooting mission. Work directly with live cluster telemetry, investigate container failures, and fix YAML configurations.
          </p>
        </div>

        {/* Highlight feature pills */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-slate-800/80 mt-6">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{totalLiveLabs} Live Failure Labs</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Isolated Sandboxes</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Context AI Mentor</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Instant Solution Check</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, failure name, or keyword (e.g. CrashLoop, OOM, Service, Ingress)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-xs font-mono text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Difficulty:
            </span>
            {['All', 'Beginner', 'Intermediate', 'Advanced'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all border ${
                  selectedDifficulty === diff
                    ? 'bg-cyan-600 text-white border-cyan-500 font-bold shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-xs font-mono text-slate-400 mr-1">Practice Category:</span>
          {[
            { id: 'All', label: 'All Categories' },
            { id: 'Troubleshooting', label: 'Troubleshooting (Live Missions)' },
            { id: 'Basics', label: 'Kubernetes Basics' },
            { id: 'Configuration', label: 'Configuration' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryTab(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all border ${
                selectedCategoryTab === cat.id
                  ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* PRACTICE TRACKS ACCORDION / LIST */}
      {loading ? (
        <div className="py-16">
          <LoadingSpinner label="Loading practice catalog..." size="lg" />
        </div>
      ) : filteredCatalog.length === 0 ? (
        <div className="text-center py-16 bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl p-6">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-2 opacity-80" />
          <h3 className="text-base font-bold text-slate-200">No practice items found</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Try adjusting your search terms or clearing difficulty filters.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedDifficulty('All');
              setSelectedCategoryTab('All');
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {filteredCatalog.map((category) => (
            <PracticeCategory
              key={category.categoryId}
              category={category}
              onStartLab={handleStartLab}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* MISSION DETAILS MODAL */}
      <Modal
        isOpen={!!selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        title={selectedDetailItem ? `Mission Overview: ${selectedDetailItem.name}` : 'Mission Overview'}
      >
        {selectedDetailItem && (
          <div className="space-y-5">
            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Category: <strong className="text-slate-200">{selectedDetailItem.category}</strong></span>
              <span>•</span>
              <span className="text-slate-400">Difficulty: <strong className="text-emerald-400">{selectedDetailItem.difficulty}</strong></span>
              <span>•</span>
              <span className="text-slate-400">Estimated Time: <strong className="text-cyan-400">{selectedDetailItem.estTime || '15 mins'}</strong></span>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Mission Objective</h4>
              <p className="text-sm text-slate-200 leading-relaxed font-sans">
                {selectedDetailItem.description}
              </p>
            </div>

            {/* Target Failure details if present */}
            {selectedDetailItem.expectedFailure && (
              <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/30 space-y-1">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                  Simulated Kubernetes Failure Condition
                </span>
                <p className="text-xs font-mono text-amber-200">{selectedDetailItem.expectedFailure}</p>
              </div>
            )}

            {/* What you will do */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Your Practical Mission</h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">1.</span>
                  <span>Inspect the active failing pod state, container logs, and lifecycle events.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">2.</span>
                  <span>Identify the underlying root cause without breaking the sandbox cluster.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">3.</span>
                  <span>Correct the manifest configuration in the YAML editor and apply the fix.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">4.</span>
                  <span>Validate that all pods return to a healthy Running state.</span>
                </li>
              </ul>
            </div>

            {/* Footer CTA */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setSelectedDetailItem(null)}>
                Close
              </Button>
              {selectedDetailItem.isLive !== false ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    const item = selectedDetailItem;
                    setSelectedDetailItem(null);
                    handleStartLab(item);
                  }}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-bold"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Start Lab Now
                </Button>
              ) : (
                <span className="text-xs font-mono text-slate-500 italic">Coming Soon in Next Update</span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LearnCatalog;
