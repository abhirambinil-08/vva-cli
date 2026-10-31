import React, { useState } from 'react';
import { Users, GraduationCap, CheckCircle2, Clock, HelpCircle, ChevronDown, ChevronUp, Terminal, Cpu, FileText } from 'lucide-react';

export const TeamVivaView: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const teamMembers = [
    {
      name: 'Abhiram Binil',
      role: 'Person 1 · Lead Orchestrator',
      tech: 'Node.js · Git · Orchestration',
      email: 'Abhirambinil1@gmail.com',
      avatarBg: 'from-indigo-600 to-blue-700',
      icon: Terminal,
      responsibilities: [
        'Command Line Interface (CLI) implementation: vva init, status, report, watch',
        'Repository detection and commit metadata collection via Git commands',
        'Commit-specific code extractor and parent diff comparison',
        'Handling deleted files (D) by extracting parent commit snapshots',
        'Subprocess orchestration: spawning Python AI & Doc engines from Node.js',
        'JSON contract serialization (.vva/output/project-data.json)'
      ],
      vivaFocus: 'Be prepared to explain Git commit isolation, IPC between Node.js and Python, and why analyzing the latest working tree instead of the exact commit is catastrophic.'
    },
    {
      name: 'Vishnu G Pillai',
      role: 'Person 2 · AI Intelligence Lead',
      tech: 'Python · AI · NVIDIA API',
      email: 'vishnu.pillai@example.com',
      avatarBg: 'from-emerald-600 to-teal-700',
      icon: Cpu,
      responsibilities: [
        'Python AI engine integration with NVIDIA API (meta/llama-3.1-70b-instruct)',
        'Prompt engineering for structured technical extraction from diff patches',
        'Strict JSON output contract enforcement matching Section 5 schema',
        'Anti-hallucination guardrails: separating verifiable code facts from commit assumptions',
        'Large diff payload management and context pruning'
      ],
      vivaFocus: 'Be prepared to explain prompt engineering techniques, how you force the model to output strict JSON, and how you ensure the AI does not hallucinate features not present in the diff.'
    },
    {
      name: 'Vinay Bisht',
      role: 'Person 3 · Document Systems Lead',
      tech: 'Python · Document Generation',
      email: 'vinay.bisht@example.com',
      avatarBg: 'from-amber-600 to-orange-700',
      icon: FileText,
      responsibilities: [
        'Multi-format document generation pipelines: PDF, DOCX, PowerPoint',
        'ReportLab Python module for pixel-accurate technical PDF reports',
        'python-docx library for editable academic project synopses',
        'python-pptx library for automated 4-slide presentation decks',
        'Consistent layout templating, metadata headers, and pagination math'
      ],
      vivaFocus: 'Be prepared to explain the templating architecture, how structured AI JSON fields map to presentation slides and report tables, and handling variable length text.'
    }
  ];

  const vivaQuestions = [
    {
      q: '1. Why do commit-specific file versions matter? Why not just read the latest files from the repository?',
      a: 'If a developer wants documentation for Commit B (e.g., "Modify login validation") which occurred between Commit A ("Add login") and Commit C ("Fix bug in login"), inspecting the latest file on disk from Commit C would explain code that was not even written yet during Commit B! VVA strictly queries `git show <commit-hash>:<file>` to extract the exact committed snapshot or the parent commit for deleted files.'
    },
    {
      q: '2. How does VVA handle deleted files (Git status "D")?',
      a: 'When a file is deleted in a commit, it no longer exists at that commit. If the collector tries to view it, it gets an error. VVA detects the "D" status and inspects the parent commit (`<commit-hash>~1:<file>`) to retrieve what was deleted and pair it with the deletion diff patch so the AI can explain what legacy feature was removed.'
    },
    {
      q: '3. How does the Node.js orchestrator communicate with the Python AI and Document modules?',
      a: 'VVA uses a clean file-and-stream based IPC (Inter-Process Communication). Node.js serializes repository context into `.vva/output/project-data.json`, then spawns the Python worker (`python ai/ai_engine.py --input .vva/output/project-data.json`). Python parses the JSON, calls the NVIDIA API, outputs `.vva/output/ai-response.json`, which is then passed to the Python document engine.'
    },
    {
      q: '4. How does the AI Engine prevent hallucinations from vague commit messages?',
      a: 'Commit messages can be deceptive (e.g., a commit message saying "Implement full banking security" might just be a single regex change). The AI engine is grounded by passing both the commit message AND the actual unified git diff. The system prompt instructs the model to only cite technical changes verified in the patch lines (`+` / `-`) and to explicitly flag limitations or unverified assumptions in `observationsAndLimitations`.'
    },
    {
      q: '5. What happens if a commit diff is huge (e.g., 50,000 lines or binary files)?',
      a: 'VVA enforces engineering bounds: it filters out binary files (images, compiled binaries), ignores vendor folders (like `node_modules/`), and enforces `maxDiffSizeBytes` (default 1MB). If a diff exceeds the cap, it truncates non-essential files, appends a truncation warning notice, and summarizes the changed file list.'
    },
    {
      q: '6. What is the difference between `vva status`, `vva report`, and `vva watch`?',
      a: '`vva status` is a lightweight diagnostic query verifying Git health, current branch, uncommitted files, and `.vva` initialization. `vva report` executes the full 4-stage pipeline (collect -> build JSON -> call AI -> generate documents). `vva watch` is a persistent daemon that listens for new commit hooks or HEAD reflog transitions and triggers the report pipeline automatically.'
    }
  ];

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 py-4 w-full flex flex-col gap-6">
      {/* Top Banner */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Section 10 &amp; 14 · Project Architecture Governance
          </span>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Team Responsibilities &amp; Viva Examination Defense Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete role distribution, milestone verification checklist, and core viva evaluation questions.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
          <GraduationCap className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300 font-medium">Viva Defense Ready</span>
        </div>
      </div>

      {/* 3 Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {teamMembers.map((member, idx) => {
          const Icon = member.icon;
          return (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${member.avatarBg} flex items-center justify-center text-white shadow-md`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{member.name}</h3>
                    <span className="text-[11px] font-mono text-indigo-300 block">{member.tech}</span>
                  </div>
                </div>

                <div className="mb-3 text-[11px] text-slate-400 font-medium bg-slate-950 p-2 rounded border border-slate-800/80">
                  {member.role}
                </div>

                <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Assigned Responsibilities:
                </h4>
                <ul className="space-y-1.5 mb-4 text-xs text-slate-300">
                  {member.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-slate-400 leading-snug">
                      <span className="text-emerald-400 shrink-0">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded text-[11px] text-indigo-200/90 leading-relaxed">
                <strong className="text-indigo-400 block mb-0.5">Viva Defense Spotlight:</strong>
                {member.vivaFocus}
              </div>
            </div>
          );
        })}
      </div>

      {/* Section 14 Milestone Status Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Section 14: Engineering Verification Status Matrix</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
            <span className="text-emerald-400 font-semibold block mb-2 text-xs">
              ✓ Implemented &amp; Tested Milestones (Node.js &amp; Core)
            </span>
            <div className="space-y-1.5 text-slate-300 text-[11px]">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> CLI initialization (vva init) and status commands</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Git repository detection and branch resolution</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Commit metadata and file list extraction</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Unified git diff parsing and line metrics</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Project-data.json payload serialization</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Deleted file parent version retrieval logic</div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
            <span className="text-cyan-400 font-semibold block mb-2 text-xs">
              ✓ Orchestrated Integrated Pipeline Milestones
            </span>
            <div className="space-y-1.5 text-slate-300 text-[11px]">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Strict schema validation for AI response JSON</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Multi-format document exporter (PDF · DOCX · PPTX)</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> End-to-end vva report command execution</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Interactive commit watcher (vva watch) daemon</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Custom commit simulation and edge-case testing</div>
            </div>
          </div>
        </div>
      </div>

      {/* Viva Q&A Accordion */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>Core Viva Examination Questions &amp; Technical Answers</span>
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Click any question to inspect the technical rationale expected by viva examiners:
        </p>

        <div className="space-y-2.5">
          {vivaQuestions.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-3.5 text-left flex items-center justify-between text-xs font-semibold text-slate-200 hover:text-indigo-300"
                >
                  <span>{item.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3.5 text-xs text-slate-300 leading-relaxed border-t border-slate-850 pt-2">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
