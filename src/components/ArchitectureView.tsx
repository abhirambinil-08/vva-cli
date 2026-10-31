import React, { useState } from 'react';
import { Layers, ArrowRight, GitBranch, Cpu, FileText, Folder, Terminal, CheckCircle2, AlertCircle, FileCode } from 'lucide-react';

interface StageInfo {
  id: string;
  number: string;
  title: string;
  owner: string;
  technology: string;
  description: string;
  input: string;
  output: string;
  codeSnippet: string;
  errorHandling: string;
}

export const ArchitectureView: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<string>('stage-2');

  const stages: StageInfo[] = [
    {
      id: 'stage-1',
      number: '01',
      title: 'Developer Git Workflow',
      owner: 'Software Developer',
      technology: 'Git CLI / IDE',
      description: 'The developer works normally, modifying code and creating commits. VVA requires no deviation from standard Git practices.',
      input: 'Developer edits, git add ., git commit -m "..."',
      output: 'Git commit hash, updated branch reflog, commit trees',
      codeSnippet: `git add src/tickets/ticket.controller.js
git commit -m "Add ticket filtering and status query parameters"`,
      errorHandling: 'Developer continues regular workflow; commits remain local or remote.'
    },
    {
      id: 'stage-2',
      number: '02',
      title: 'VVA CLI & Orchestration Layer',
      owner: 'Person 1 · Abhiram Binil',
      technology: 'Node.js (ES Modules), Child Process',
      description: 'Coordinates the entire system: verifies repository validity, checks if .vva is initialized, manages CLI arguments, and coordinates data flow between stages.',
      input: 'vva report --commit <hash> --format all',
      output: 'Process execution stream, logging, workflow orchestration',
      codeSnippet: `// src/commands/report.js
import { GitCollector } from '../core/collector.js';
import { runPythonModule } from '../core/python.js';

export async function reportCommand(options) {
  const repo = await GitCollector.detectRepository();
  const projectData = await GitCollector.collectCommitData(options.commit);
  await saveJson('.vva/output/project-data.json', projectData);
  
  // Invoke Python AI Engine
  await runPythonModule('ai/ai_engine.py', ['--input', '.vva/output/project-data.json']);
  
  // Invoke Python Document Generator
  await runPythonModule('document-engine/document_generator.py', ['--format', options.format]);
}`,
      errorHandling: 'Detects missing .git folders, uncommitted detached HEAD states, missing Python binaries, and reports clear human-readable remediation messages.'
    },
    {
      id: 'stage-3',
      number: '03',
      title: 'Git Data Collector',
      owner: 'Person 1 · Abhiram Binil',
      technology: 'Git CLI (git log, show, diff, rev-parse)',
      description: 'Extracts commit-specific file versions, diffs, author metadata, and detects file status flags (A=Added, M=Modified, D=Deleted). Crucially retrieves the parent revision for deleted files.',
      input: 'Target commit hash, worktree path',
      output: '.vva/output/project-data.json',
      codeSnippet: `// Commit-Specific File Snapshot Extraction
export async function getCommittedFileVersion(commitHash, filePath, status) {
  if (status === 'D') {
    // Deleted file: inspect parent commit (commitHash~1)
    return await execGit(\`show \${commitHash}~1:\${filePath}\`);
  }
  // Added or Modified: inspect target commit
  return await execGit(\`show \${commitHash}:\${filePath}\`);
}`,
      errorHandling: 'Handles initial root commits without parents (`--root` flag), skips binary blobs, truncates massive diffs exceeding 1MB limit.'
    },
    {
      id: 'stage-4',
      number: '04',
      title: 'Python AI Engine',
      owner: 'Person 2 · Vishnu G Pillai',
      technology: 'Python 3.11, NVIDIA API (meta/llama-3.1-70b)',
      description: 'Reads project-data.json, constructs a rigorous system prompt, queries NVIDIA AI endpoint, and enforces strict JSON schema extraction with anti-hallucination boundaries.',
      input: '.vva/output/project-data.json',
      output: '.vva/output/ai-response.json',
      codeSnippet: `import json, requests, os

def analyze_changes(project_data):
    prompt = f"""
    Analyze the Git commit: {project_data['commitMessage']}
    Diff patch:
    {project_data['diff']}
    
    Return strict JSON with fields:
    title, summary, changedComponents, technicalChanges, technologies, observationsAndLimitations.
    Only cite facts supported by the diff patch. Do not guess untested capabilities.
    """
    
    response = requests.post(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {os.getenv('NVIDIA_API_KEY')}"},
        json={"model": "meta/llama-3.1-70b-instruct", "messages": [{"role": "user", "content": prompt}]}
    )
    return json.loads(response.json()['choices'][0]['message']['content'])`,
      errorHandling: 'Validates returned JSON with pydantic; retries on schema deviation; catches API rate-limits with backoff.'
    },
    {
      id: 'stage-5',
      number: '05',
      title: 'Python Document Engine',
      owner: 'Person 3 · Vinay Bisht',
      technology: 'Python, ReportLab, python-docx, python-pptx',
      description: 'Transforms structured AI response JSON into beautifully styled, standardized deliverables: PDF technical reports, editable Word documents (DOCX), and presentation slides (PPTX).',
      input: '.vva/output/ai-response.json, reusable templates',
      output: 'PDF reports, DOCX synopses, PPTX slide decks',
      codeSnippet: `# document_generator.py
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from docx import Document
from pptx import Presentation

def generate_pdf(ai_data, output_path):
    # Builds multi-page structured ReportLab flowable
    ...
def generate_docx(ai_data, output_path):
    # Generates academic synopsis document
    ...
def generate_pptx(ai_data, output_path):
    # Creates 4-slide executive presentation
    ...`,
      errorHandling: 'Gracefully wraps overflowing bullet text, validates target folder permissions, enforces fallback fonts if system fonts are unavailable.'
    },
    {
      id: 'stage-6',
      number: '06',
      title: 'Output Artifacts & CLI Feedback',
      owner: 'VVA Orchestrator',
      technology: 'File System (.vva/output/)',
      description: 'Saves all generated documents into the repository’s .vva/output directory and prints summary paths and success confirmation to the developer.',
      input: 'Compiled document files',
      output: 'Ready-to-submit files for academic evaluation, code review, or client presentations',
      codeSnippet: `[Stage 4/4] Document Engine: Completed ✓
✓ Generation Complete! Created output artifacts in .vva/output:
  → PDF Technical Report:    .vva/output/MiniDesk_e8f190c_report.pdf
  → DOCX Project Synopsis:   .vva/output/MiniDesk_e8f190c_synopsis.doc
  → PowerPoint Presentation: .vva/output/MiniDesk_e8f190c_slides.pptx`,
      errorHandling: 'Confirms file existence, outputs byte sizes, logs timestamps to .vva/logs/orchestrator.log.'
    }
  ];

  const current = stages.find(s => s.id === selectedStage) || stages[1];

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 py-4 w-full flex flex-col gap-6">
      {/* Header */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Section 3 &amp; 7 · System Architecture
          </span>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>VVA End-to-End Orchestration Architecture Pipeline</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Interactive pipeline showing data transitions from Developer Git operations to AI analysis and final formatted document compilation.
          </p>
        </div>

        <div className="text-xs font-mono text-indigo-300 bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
          Git Records → AI Explains → Doc Engine Presents → VVA Coordinates
        </div>
      </div>

      {/* Visual Pipeline Stepper */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {stages.map((stg) => {
          const isSelected = stg.id === selectedStage;
          return (
            <button
              key={stg.id}
              onClick={() => setSelectedStage(stg.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className={`text-[10px] font-mono font-bold block mb-1 ${
                isSelected ? 'text-indigo-400' : 'text-slate-500'
              }`}>
                STAGE {stg.number}
              </span>
              <h3 className="text-xs font-semibold text-slate-200 line-clamp-1 mb-1">
                {stg.title}
              </h3>
              <span className="text-[10px] text-slate-400 truncate block">
                {stg.owner.split('·')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Stage Detail Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Explanations & Specs */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-indigo-400">STAGE {current.number}</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-semibold">{current.owner}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              {current.title}
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {current.description}
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Technology Stack &amp; Libraries
              </span>
              <span className="font-mono text-indigo-300 text-[11px]">{current.technology}</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Input Data Contract
              </span>
              <code className="text-slate-200 text-[11px]">{current.input}</code>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Output Artifact / Payload
              </span>
              <code className="text-emerald-400 text-[11px]">{current.output}</code>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block mb-1">
                Robust Error Handling Strategy
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">{current.errorHandling}</p>
            </div>
          </div>
        </div>

        {/* Right Col: Code Snippet / Implementation Spec */}
        <div className="lg:col-span-7 flex flex-col bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-300">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Implementation Implementation Spec</span>
            </span>
            <span>VVA Coordination Protocol</span>
          </div>

          <pre className="flex-1 overflow-x-auto text-slate-300 whitespace-pre leading-relaxed p-2">
            {current.codeSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
};
