import React from 'react';
import { Terminal, Play, GitBranch, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRunReport: () => void;
  isRunningReport: boolean;
  repoName: string;
  currentBranch: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onRunReport,
  isRunningReport,
  repoName,
  currentBranch,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-slate-200 sticky top-0 z-50">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a 
          href="#home" 
          onClick={(e) => { e.preventDefault(); setActiveTab('terminal'); }}
          className="flex items-center gap-2.5 text-base font-bold tracking-tight text-white hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-mono text-sm font-semibold">
            VVA
          </div>
          <span>VVA Orchestrator</span>
        </a>
        <span className="hidden lg:inline text-xs text-slate-500">·</span>
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <GitBranch className="w-3.5 h-3.5 text-slate-500" />
          <span>{repoName}</span>
          <span className="text-slate-600">/</span>
          <span className="text-indigo-300">{currentBranch}</span>
        </div>
      </div>

      {/* Zone 2: 5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('terminal')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'terminal' ? 'text-white border-indigo-500 font-semibold' : 'border-transparent'
          }`}
        >
          CLI Terminal
        </button>
        <button
          onClick={() => setActiveTab('collector')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'collector' ? 'text-white border-indigo-500 font-semibold' : 'border-transparent'
          }`}
        >
          Git Collector
        </button>
        <button
          onClick={() => setActiveTab('ai-engine')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'ai-engine' ? 'text-white border-indigo-500 font-semibold' : 'border-transparent'
          }`}
        >
          AI Engine
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'documents' ? 'text-white border-indigo-500 font-semibold' : 'border-transparent'
          }`}
        >
          Doc Generator
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'architecture' ? 'text-white border-indigo-500 font-semibold' : 'border-transparent'
          }`}
        >
          Architecture
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'team' ? 'text-white border-indigo-500 font-semibold' : 'border-transparent'
          }`}
        >
          Team &amp; Viva
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onRunReport}
          disabled={isRunningReport}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 shadow-sm ${
            isRunningReport 
              ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95'
          }`}
        >
          {isRunningReport ? (
            <>
              <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span>Orchestrating...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run vva report</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
