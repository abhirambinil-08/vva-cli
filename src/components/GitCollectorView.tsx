import React, { useState } from 'react';
import { GitBranch, GitCommit as GitCommitIcon, FileCode, Plus, Minus, Copy, Check, Info, FilePlus, FileEdit, Trash2, ShieldAlert } from 'lucide-react';
import { Repository, GitCommit, ChangedFile, ProjectDataJSON, VVAConfig } from '../types/vva';
import { buildProjectDataJSON } from '../utils/orchestrator';

interface GitCollectorViewProps {
  repositories: Repository[];
  currentRepo: Repository;
  onSelectRepo: (repo: Repository) => void;
  selectedCommit: GitCommit;
  onSelectCommit: (commit: GitCommit) => void;
  vvaConfig: VVAConfig;
  onAddNewCommit: (newCommit: GitCommit) => void;
}

export const GitCollectorView: React.FC<GitCollectorViewProps> = ({
  repositories,
  currentRepo,
  onSelectRepo,
  selectedCommit,
  onSelectCommit,
  vvaConfig,
  onAddNewCommit,
}) => {
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'diff' | 'committedContent' | 'projectJson'>('diff');
  const [copiedJson, setCopiedJson] = useState(false);
  const [showNewCommitModal, setShowNewCommitModal] = useState(false);

  // Custom Commit Creator state
  const [newMsg, setNewMsg] = useState('Refactor authentication middleware');
  const [newFile, setNewFile] = useState('src/middleware/auth.js');
  const [newStatus, setNewStatus] = useState<'A' | 'M' | 'D'>('M');
  const [newDiff, setNewDiff] = useState('@@ -1,4 +1,7 @@\n-const oldToken = req.headers["token"];\n+const bearer = req.headers.authorization;\n+const token = bearer ? bearer.replace("Bearer ", "") : null;\n+if (!token) return res.status(401).send();');
  const [newContent, setNewContent] = useState('export function authMiddleware(req, res, next) {\n  const bearer = req.headers.authorization;\n  const token = bearer ? bearer.replace("Bearer ", "") : null;\n  if (!token) return res.status(401).json({ error: "Missing token" });\n  next();\n}');

  const activeFile: ChangedFile | undefined = selectedCommit.changedFiles[activeFileIndex] || selectedCommit.changedFiles[0];

  const projectDataJson: ProjectDataJSON = buildProjectDataJSON(currentRepo, selectedCommit, vvaConfig);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(projectDataJson, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCreateCommit = (e: React.FormEvent) => {
    e.preventDefault();
    const hash = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newCommitObj: GitCommit = {
      hash,
      shortHash: hash.slice(0, 7),
      parentHash: selectedCommit.hash,
      author: 'Abhiram Binil',
      email: 'Abhirambinil1@gmail.com',
      date: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      message: newMsg,
      branch: currentRepo.currentBranch,
      diffSummary: {
        filesChanged: 1,
        insertions: newStatus === 'D' ? 0 : 4,
        deletions: newStatus === 'A' ? 0 : 2,
      },
      changedFiles: [
        {
          file: newFile,
          status: newStatus,
          additions: newStatus === 'D' ? 0 : 4,
          deletions: newStatus === 'A' ? 0 : 2,
          content: newContent,
          diff: newDiff,
        }
      ]
    };

    onAddNewCommit(newCommitObj);
    onSelectCommit(newCommitObj);
    setShowNewCommitModal(false);
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 py-4 w-full flex flex-col gap-4">
      {/* Top Bar: Repository Switcher & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <div className="flex items-center gap-4">
          <div>
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Active Repository
            </label>
            <div className="flex items-center gap-2">
              <select
                value={currentRepo.id}
                onChange={(e) => {
                  const found = repositories.find(r => r.id === e.target.value);
                  if (found) {
                    onSelectRepo(found);
                    onSelectCommit(found.commits[0]);
                    setActiveFileIndex(0);
                  }
                }}
                className="bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded px-3 py-1.5 font-medium outline-none focus:border-indigo-500"
              >
                {repositories.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="hidden sm:block border-l border-slate-800 pl-4">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Collector Role
            </span>
            <span className="text-xs text-indigo-300 font-semibold">
              Person 1: Abhiram Binil (Node.js &amp; Git Operations)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewCommitModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Simulate New Commit</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left = Commit History List, Right = Commit Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left Col: Commit Tree */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GitCommitIcon className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Git Commit History ({currentRepo.commits.length})
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">HEAD: {currentRepo.currentBranch}</span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1">
            {currentRepo.commits.map((commit) => {
              const isSelected = commit.hash === selectedCommit.hash;
              return (
                <div
                  key={commit.hash}
                  onClick={() => {
                    onSelectCommit(commit);
                    setActiveFileIndex(0);
                  }}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/60 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-mono font-semibold text-indigo-300">
                      {commit.shortHash}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {commit.date.split(' ')[0]}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-200 line-clamp-2 mb-2">
                    {commit.message}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{commit.author}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-emerald-400">+{commit.diffSummary.insertions}</span>
                      <span className="text-rose-400">-{commit.diffSummary.deletions}</span>
                      <span className="text-slate-500">·</span>
                      <span>{commit.changedFiles.length} file(s)</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section 4 Callout Box: Why Commit-Specific Versions Matter */}
          <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-1">
              <Info className="w-3.5 h-3.5" />
              <span>Commit-Specific Version Isolation</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              VVA analyzes the exact version at commit <code className="text-indigo-300">{selectedCommit.shortHash}</code>. It never mixes newer changes from subsequent commits or unrelated worktrees into the AI payload.
            </p>
          </div>
        </div>

        {/* Right Col: Commit Details & Inspector */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col">
          {/* Header info of selected commit */}
          <div className="border-b border-slate-800 pb-3 mb-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>{selectedCommit.message}</span>
              </h2>
              <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {selectedCommit.hash}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>Author: <strong className="text-slate-200">{selectedCommit.author}</strong></span>
              <span>·</span>
              <span>Parent: <code className="text-indigo-400">{selectedCommit.parentHash ? selectedCommit.parentHash.slice(0, 7) : 'None (initial commit)'}</code></span>
              <span>·</span>
              <span>Date: {selectedCommit.date}</span>
            </div>
          </div>

          {/* Changed Files Pill-bar */}
          <div className="mb-3">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
              Changed Files in this Commit ({selectedCommit.changedFiles.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {selectedCommit.changedFiles.map((f, idx) => {
                const isCurrent = idx === activeFileIndex;
                const statusColor = 
                  f.status === 'A' ? 'text-emerald-400 border-emerald-900/60 bg-emerald-950/20' :
                  f.status === 'M' ? 'text-cyan-400 border-cyan-900/60 bg-cyan-950/20' :
                  'text-rose-400 border-rose-900/60 bg-rose-950/20';

                return (
                  <button
                    key={f.file}
                    onClick={() => setActiveFileIndex(idx)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
                      isCurrent 
                        ? 'border-indigo-500 bg-slate-950 text-slate-100 shadow-sm' 
                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className={`px-1 py-0.2 rounded text-[10px] font-bold border ${statusColor}`}>
                      {f.status}
                    </span>
                    <span>{f.file}</span>
                    <span className="text-[10px] text-slate-500">
                      (+{f.additions}/-{f.deletions})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('diff')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  viewMode === 'diff' 
                    ? 'bg-slate-800 text-white' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Git Diff Patch
              </button>
              <button
                onClick={() => setViewMode('committedContent')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  viewMode === 'committedContent' 
                    ? 'bg-slate-800 text-white' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Committed File Version ({activeFile?.status === 'D' ? 'Pre-deletion' : 'Commit State'})
              </button>
              <button
                onClick={() => setViewMode('projectJson')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  viewMode === 'projectJson' 
                    ? 'bg-slate-800 text-white' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                .vva/output/project-data.json
              </button>
            </div>

            {viewMode === 'projectJson' && (
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded border border-slate-700 transition-colors"
              >
                {copiedJson ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Code Viewer Viewport */}
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-y-auto max-h-[500px] font-mono text-xs">
            {viewMode === 'diff' && activeFile && (
              <div className="space-y-0.5">
                <div className="text-slate-500 pb-1 border-b border-slate-800/80 mb-2">
                  diff --git a/{activeFile.file} b/{activeFile.file} ({activeFile.status === 'A' ? 'Added' : activeFile.status === 'M' ? 'Modified' : 'Deleted'})
                </div>
                {activeFile.diff.split('\n').map((line, i) => {
                  let lineClass = 'text-slate-300';
                  let bgClass = '';
                  if (line.startsWith('+')) {
                    lineClass = 'text-emerald-400';
                    bgClass = 'bg-emerald-950/20';
                  } else if (line.startsWith('-')) {
                    lineClass = 'text-rose-400';
                    bgClass = 'bg-rose-950/20';
                  } else if (line.startsWith('@@')) {
                    lineClass = 'text-cyan-400 font-semibold';
                    bgClass = 'bg-cyan-950/20';
                  }

                  return (
                    <div key={i} className={`px-2 py-0.5 rounded-sm ${bgClass} ${lineClass} whitespace-pre-wrap`}>
                      {line}
                    </div>
                  );
                })}
              </div>
            )}

            {viewMode === 'committedContent' && activeFile && (
              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-slate-500 pb-1 border-b border-slate-800 mb-2">
                  <span>File: {activeFile.file}</span>
                  {activeFile.status === 'D' && (
                    <span className="text-amber-400 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Captured from parent commit {selectedCommit.parentHash?.slice(0, 7)}
                    </span>
                  )}
                </div>
                {activeFile.content.split('\n').map((line, i) => (
                  <div key={i} className="flex gap-4 hover:bg-slate-900/60 px-1 py-0.5">
                    <span className="text-slate-600 select-none w-8 text-right shrink-0">{i + 1}</span>
                    <span className="text-slate-300 whitespace-pre-wrap">{line}</span>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'projectJson' && (
              <pre className="text-emerald-300/90 whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(projectDataJson, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Simulate New Commit */}
      {showNewCommitModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-5 shadow-2xl">
            <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Simulate New Commit in {currentRepo.name}</span>
            </h3>

            <form onSubmit={handleCreateCommit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Commit Message</label>
                <input
                  type="text"
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">File Path</label>
                  <input
                    type="text"
                    value={newFile}
                    onChange={(e) => setNewFile(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 outline-none focus:border-indigo-500 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">File State</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 outline-none focus:border-indigo-500"
                  >
                    <option value="M">Modified (M)</option>
                    <option value="A">Added (A)</option>
                    <option value="D">Deleted (D)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Git Diff Patch</label>
                <textarea
                  rows={4}
                  value={newDiff}
                  onChange={(e) => setNewDiff(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-slate-100 font-mono text-[11px] outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Committed File Content</label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-slate-100 font-mono text-[11px] outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewCommitModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
                >
                  Create &amp; Inspect Commit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
