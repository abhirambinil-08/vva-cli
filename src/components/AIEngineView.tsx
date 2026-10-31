import React, { useState } from 'react';
import { Cpu, CheckCircle2, AlertTriangle, Sparkles, Code2, Eye, ShieldCheck, Copy, Check } from 'lucide-react';
import { Repository, GitCommit, AIStructuredResponse, VVAConfig, ProjectDataJSON } from '../types/vva';
import { buildProjectDataJSON, generateStructuredAIResponse } from '../utils/orchestrator';

interface AIEngineViewProps {
  currentRepo: Repository;
  selectedCommit: GitCommit;
  vvaConfig: VVAConfig;
  lastAIResponse: AIStructuredResponse | null;
  onUpdateAIResponse: (response: AIStructuredResponse) => void;
}

export const AIEngineView: React.FC<AIEngineViewProps> = ({
  currentRepo,
  selectedCommit,
  vvaConfig,
  lastAIResponse,
  onUpdateAIResponse,
}) => {
  const [provider, setProvider] = useState<'nvidia' | 'gemini'>(vvaConfig.aiProvider);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const projectData: ProjectDataJSON = buildProjectDataJSON(currentRepo, selectedCommit, vvaConfig);
  const activeResponse: AIStructuredResponse = lastAIResponse || generateStructuredAIResponse(projectData, provider);

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const resp = generateStructuredAIResponse(projectData, provider);
      onUpdateAIResponse(resp);
      setIsAnalyzing(false);
    }, 600);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(activeResponse, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 py-4 w-full flex flex-col gap-4">
      {/* Top Engine Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Person 2 Module · Python AI Engine
          </span>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>NVIDIA API / LLM Code Intelligence Engine</span>
            </h1>
            <span className="text-xs text-slate-400">by Vishnu G Pillai</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setProvider('nvidia')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                provider === 'nvidia' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              NVIDIA API (meta/llama-3.1-70b)
            </button>
            <button
              onClick={() => setProvider('gemini')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                provider === 'gemini' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gemini API (gemini-2.5-flash)
            </button>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors shadow-sm disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Interpreting Diff...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Re-Analyze with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Left = Structured JSON Contract & Schema Validation, Right = Interpreted Output & Anti-Hallucination Guardrails */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left Column: Output Contract JSON */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div>
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>Structured Output Contract (JSON)</span>
              </h2>
              <span className="text-[11px] text-slate-400">Strict schema from Section 5</span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Validation Chips */}
          <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px] text-slate-400 font-mono">
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> title
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> summary
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> changedComponents
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> technicalChanges
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> technologies
            </span>
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-y-auto max-h-[540px] font-mono text-xs">
            <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(activeResponse, null, 2)}
            </pre>
          </div>
        </div>

        {/* Right Column: Interpreted Technical Meaning & Anti-Hallucination Guardrails */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col space-y-4">
          {/* Card: Interpreted Feature & Changes */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-indigo-400 uppercase tracking-wider">
                Extracted Feature Intent
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Model: {activeResponse.model} ({activeResponse.processingTimeMs}ms)
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">
              {activeResponse.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {activeResponse.summary}
            </p>
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800 text-xs text-slate-300">
              <strong className="text-slate-200">Core Purpose:</strong> {activeResponse.purposeAndRationale}
            </div>
          </div>

          {/* Card: Technical Changes Breakdown */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2.5">
              Verified Technical Changes ({activeResponse.technicalChanges.length})
            </h4>
            <div className="space-y-2">
              {activeResponse.technicalChanges.map((tc, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{tc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5 Anti-Hallucination Guardrail: Facts in Code vs Assumptions */}
          <div className="bg-slate-950 border border-amber-900/40 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Anti-Hallucination &amp; Grounding Guardrails</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Per Section 5 of the VVA specification: <em>"The AI should distinguish facts visible in the code from assumptions about the developer's intent. For example, it should not claim that a feature is secure or fully tested merely because a commit mentions authentication."</em>
            </p>

            <div className="space-y-2 text-xs">
              {activeResponse.observationsAndLimitations.map((obs, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-amber-950/20 border border-amber-900/30 rounded text-amber-200/90 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{obs}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Technologies Detected */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-2">
              Identified Technology Stack
            </span>
            <div className="flex flex-wrap gap-2">
              {activeResponse.technologies.map(tech => (
                <span key={tech} className="px-2.5 py-1 text-xs font-mono bg-slate-900 text-indigo-300 rounded border border-slate-800">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
