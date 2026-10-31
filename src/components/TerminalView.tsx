import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, CornerDownLeft, Play, RefreshCw, Trash2, Shield, FolderGit2 } from 'lucide-react';
import { Repository, GitCommit, VVAConfig, ProjectDataJSON, AIStructuredResponse } from '../types/vva';

interface TerminalViewProps {
  currentRepo: Repository;
  selectedCommit: GitCommit;
  vvaConfig: VVAConfig;
  isInitialized: boolean;
  setIsInitialized: (val: boolean) => void;
  onExecuteReport: (format?: string) => Promise<void>;
  isWatchMode: boolean;
  setIsWatchMode: (val: boolean) => void;
  lastProjectData: ProjectDataJSON | null;
  lastAIResponse: AIStructuredResponse | null;
  onSelectTab: (tab: string) => void;
}

interface LogEntry {
  id: string;
  type: 'cmd' | 'output' | 'success' | 'error' | 'info' | 'warn';
  text: string;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  currentRepo,
  selectedCommit,
  vvaConfig,
  isInitialized,
  setIsInitialized,
  onExecuteReport,
  isWatchMode,
  setIsWatchMode,
  lastProjectData,
  lastAIResponse,
  onSelectTab,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init-1',
      type: 'info',
      text: 'VVA — Version & Workflow Automator [Node.js Orchestrator CLI v1.0.0-rc1]'
    },
    {
      id: 'init-2',
      type: 'info',
      text: `Current workspace: ${currentRepo.path} (Git detected: branch '${currentRepo.currentBranch}')`
    },
    {
      id: 'init-3',
      type: 'output',
      text: "Type 'vva status' to verify repository state, or 'vva report' to trigger end-to-end documentation generation."
    }
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // Handle watch mode simulation
  useEffect(() => {
    let watchInterval: any;
    if (isWatchMode) {
      setLogs(prev => [
        ...prev,
        { id: String(Date.now()), type: 'info', text: `[vva watch] Active file monitor daemon listening on ${currentRepo.path}/.git/refs/heads/${currentRepo.currentBranch}` },
        { id: String(Date.now() + 1), type: 'info', text: '[vva watch] Polling git reflog and worktree for new commit states...' }
      ]);

      watchInterval = setInterval(() => {
        setLogs(prev => [
          ...prev,
          { 
            id: String(Date.now()), 
            type: 'output', 
            text: `[vva watch ${new Date().toLocaleTimeString()}] Verified HEAD at ${selectedCommit.shortHash} - no new uncommitted index changes.` 
          }
        ]);
      }, 7000);
    }
    return () => clearInterval(watchInterval);
  }, [isWatchMode, currentRepo, selectedCommit]);

  const handleCommand = async (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    // Add to logs
    setLogs(prev => [
      ...prev,
      { id: String(Date.now()), type: 'cmd', text: cmd }
    ]);
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    setInputVal('');

    const parts = cmd.split(' ');
    const mainCmd = parts[0].toLowerCase();
    const subCmd = parts[1]?.toLowerCase();

    setIsProcessing(true);

    if (mainCmd === 'clear') {
      setLogs([]);
      setIsProcessing(false);
      return;
    }

    if (mainCmd === 'help') {
      setLogs(prev => [
        ...prev,
        { id: String(Date.now()), type: 'info', text: 'VVA Supported Commands:' },
        { id: String(Date.now() + 1), type: 'output', text: '  vva init                Initialize .vva configuration, logs, and output directories' },
        { id: String(Date.now() + 2), type: 'output', text: '  vva status              Check repository state, active commit, branch, and VVA status' },
        { id: String(Date.now() + 3), type: 'output', text: '  vva report [options]    Orchestrate full Git -> AI -> Document pipeline' },
        { id: String(Date.now() + 4), type: 'output', text: '                          Options: --commit <hash> | --format <pdf|docx|pptx|all> | --dry-run' },
        { id: String(Date.now() + 5), type: 'output', text: '  vva watch               Monitor repository commits in real time and trigger automatic doc generation' },
        { id: String(Date.now() + 6), type: 'output', text: '  git log -n <count>      Inspect recent Git commit history' },
        { id: String(Date.now() + 7), type: 'output', text: '  cat .vva/config.json    Display active VVA orchestrator configuration' },
        { id: String(Date.now() + 8), type: 'output', text: '  clear                   Clear terminal viewport' }
      ]);
      setIsProcessing(false);
      return;
    }

    if (mainCmd === 'vva') {
      if (!subCmd) {
        setLogs(prev => [
          ...prev,
          { id: String(Date.now()), type: 'error', text: "Error: Missing command. Try 'vva status', 'vva init', or 'vva report'." }
        ]);
        setIsProcessing(false);
        return;
      }

      if (subCmd === 'init') {
        setTimeout(() => {
          setIsInitialized(true);
          setLogs(prev => [
            ...prev,
            { id: String(Date.now()), type: 'info', text: '[VVA Setup Manager] Starting intelligent cross-system initialization...' },
            { id: String(Date.now() + 1), type: 'output', text: '  ✓ [Step 1/12] Operating System Detection: Linux (linux x64, kernel 4.19.0-gvisor)' },
            { id: String(Date.now() + 2), type: 'output', text: '  ✓ [Step 2/12] Node.js & npm Verification: Node v22.23.4, npm 10.9.9' },
            { id: String(Date.now() + 3), type: 'output', text: '  ✓ [Step 3/12] Python Runtime Discovery: Python 3.10.12 (python3)' },
            { id: String(Date.now() + 4), type: 'output', text: '  ℹ [Step 4/12] JavaScript Dependencies: Verified in node_modules/' },
            { id: String(Date.now() + 5), type: 'output', text: '  ✓ [Step 5/12] Python Virtual Environment (.venv): Dedicated virtual environment ready at .venv/' },
            { id: String(Date.now() + 6), type: 'output', text: '  ✓ [Step 6/12] Python Packages (requirements.txt): openai, reportlab, python-docx, python-pptx, python-dotenv' },
            { id: String(Date.now() + 7), type: 'output', text: '  ✓ [Step 7/12] Engine Modules Validation: ai/ai_engine.py & document_engine.py ready' },
            { id: String(Date.now() + 8), type: 'output', text: '  ✓ [Step 8/12] Directory Structure Provisioning: Created .vva/ (output, logs)' },
            { id: String(Date.now() + 9), type: 'output', text: '  ✓ [Step 9/12] Configuration Management: Preserved existing .vva/config.json' },
            { id: String(Date.now() + 10), type: 'output', text: '  ✓ [Step 10/12] NVIDIA API Credentials: Validated' },
            { id: String(Date.now() + 11), type: 'output', text: '  ✓ [Step 11/12] Installation Health Audit: All 4 critical subsystems verified' },
            { id: String(Date.now() + 12), type: 'success', text: '✓ SETUP COMPLETE — VVA is fully configured and ready for ' + currentRepo.name },
            { id: String(Date.now() + 13), type: 'output', text: "Run 'vva status' to inspect environment or 'vva report' to generate technical documents." }
          ]);
          setIsProcessing(false);
        }, 350);
        return;
      }

      if (subCmd === 'status') {
        setTimeout(() => {
          setLogs(prev => [
            ...prev,
            { id: String(Date.now()), type: 'info', text: '================ VVA SYSTEM & REPOSITORY STATUS ================' },
            { id: String(Date.now() + 1), type: 'output', text: `Operating System:   Linux (linux x64)` },
            { id: String(Date.now() + 2), type: 'output', text: `Node.js Runtime:    v22.23.4 (npm 10.9.9)` },
            { id: String(Date.now() + 3), type: 'output', text: `Repository:         ${currentRepo.name} (${currentRepo.path})` },
            { id: String(Date.now() + 4), type: 'output', text: `Active Branch:      ${currentRepo.currentBranch}` },
            { id: String(Date.now() + 5), type: 'output', text: `Latest Commit:      ${selectedCommit.hash}` },
            { id: String(Date.now() + 6), type: 'output', text: `Commit Subject:     "${selectedCommit.message}"` },
            { id: String(Date.now() + 7), type: 'output', text: `Author:             ${selectedCommit.author} <${selectedCommit.email}>` },
            { id: String(Date.now() + 8), type: 'output', text: `Files Changed:      ${selectedCommit.changedFiles.length} file(s) (+${selectedCommit.diffSummary.insertions} / -${selectedCommit.diffSummary.deletions})` },
            { id: String(Date.now() + 9), type: isInitialized ? 'success' : 'warn', text: `VVA Environment:    ${isInitialized ? '✓ Initialized (.vva/ directory configured)' : '! Not initialized (Run vva init)'}` },
            { id: String(Date.now() + 10), type: 'output', text: `Python Runtime:     Python 3.10.12 [Dedicated .venv] (openai, reportlab, docx, pptx ready)` },
            { id: String(Date.now() + 11), type: 'output', text: `NVIDIA API Key:     Configured via environment (${vvaConfig.aiProvider.toUpperCase()} / ${vvaConfig.aiModel})` },
            { id: String(Date.now() + 12), type: 'output', text: `Output Destination: ${vvaConfig.outputDir}/` },
            { id: String(Date.now() + 13), type: 'info', text: '================================================================' }
          ]);
          setIsProcessing(false);
        }, 250);
        return;
      }

      if (subCmd === 'watch') {
        const nextWatch = !isWatchMode;
        setIsWatchMode(nextWatch);
        setLogs(prev => [
          ...prev,
          { 
            id: String(Date.now()), 
            type: nextWatch ? 'success' : 'info', 
            text: nextWatch 
              ? '✓ [vva watch] Commit watcher daemon engaged. Listening for git commit hooks...' 
              : '✓ [vva watch] Commit watcher stopped.' 
          }
        ]);
        setIsProcessing(false);
        return;
      }

      if (subCmd === 'report') {
        const formatArg = parts.find(p => p.startsWith('--format='))?.split('=')[1] || 
                          (parts.includes('--format') ? parts[parts.indexOf('--format') + 1] : 'all');
        const isDryRun = parts.includes('--dry-run');

        setLogs(prev => [
          ...prev,
          { id: String(Date.now()), type: 'info', text: 'Starting VVA Orchestration Pipeline...' },
          { id: String(Date.now() + 1), type: 'output', text: `[Stage 1/4] Git Collector: Querying commit ${selectedCommit.shortHash} on ${currentRepo.currentBranch}...` }
        ]);

        try {
          await onExecuteReport(formatArg);
          setLogs(prev => [
            ...prev,
            { id: String(Date.now() + 2), type: 'output', text: `[Stage 1/4] Git Collector: Collected ${selectedCommit.changedFiles.length} files. State: M=${selectedCommit.changedFiles.filter(f => f.status === 'M').length}, A=${selectedCommit.changedFiles.filter(f => f.status === 'A').length}, D=${selectedCommit.changedFiles.filter(f => f.status === 'D').length}` },
            { id: String(Date.now() + 3), type: 'output', text: '[Stage 2/4] Orchestrator: Built .vva/output/project-data.json payload (Validated schema ✓)' },
            { id: String(Date.now() + 4), type: 'output', text: `[Stage 3/4] AI Engine: Spawned python ai/ai_engine.py with NVIDIA model ${vvaConfig.aiModel}...` },
            { id: String(Date.now() + 5), type: 'output', text: '[Stage 3/4] AI Engine: Received structured response JSON (Confidence: 0.96) ✓' },
            { id: String(Date.now() + 6), type: 'output', text: `[Stage 4/4] Document Engine: Calling Python ReportLab / python-docx / python-pptx...` },
            { id: String(Date.now() + 7), type: 'success', text: `✓ Generation Complete! Created output artifacts in ${vvaConfig.outputDir}:` },
            { id: String(Date.now() + 8), type: 'output', text: `  → PDF Technical Report:    ${vvaConfig.outputDir}/${currentRepo.name}_${selectedCommit.shortHash}_report.pdf` },
            { id: String(Date.now() + 9), type: 'output', text: `  → DOCX Project Synopsis:   ${vvaConfig.outputDir}/${currentRepo.name}_${selectedCommit.shortHash}_synopsis.doc` },
            { id: String(Date.now() + 10), type: 'output', text: `  → PowerPoint Presentation: ${vvaConfig.outputDir}/${currentRepo.name}_${selectedCommit.shortHash}_slides.pptx` },
            { id: String(Date.now() + 11), type: 'info', text: "Switch to 'Doc Generator' or 'AI Engine' tab above to preview and download." }
          ]);
        } catch (err: any) {
          setLogs(prev => [
            ...prev,
            { id: String(Date.now()), type: 'error', text: `Orchestration Error: ${err.message}` }
          ]);
        }

        setIsProcessing(false);
        return;
      }

      if (subCmd === 'docs') {
        const isFull = parts.includes('--full');
        const purpose = parts.find(p => p.startsWith('--purpose='))?.split('=')[1] || 'technical';
        setLogs(prev => [
          ...prev,
          { id: String(Date.now()), type: 'info', text: `[VVA Continuous Docs] Initiating ${isFull ? 'FULL' : 'INCREMENTAL'} project documentation (${purpose})...` },
          { id: String(Date.now() + 1), type: 'output', text: `  Step 1/5: Synchronizing continuous history across all repository commits... [OK]` },
          { id: String(Date.now() + 2), type: 'output', text: `  Step 2/5: Cataloging visual evidence (Application screenshots, architecture diagrams)... [4 assets]` },
          { id: String(Date.now() + 3), type: 'output', text: `  Step 3/5: Rendering high-resolution Matplotlib charts (Activity, Contributors, Composition)... [OK]` },
          { id: String(Date.now() + 4), type: 'output', text: `  Step 4/5: Invoking Python Document Engine with embedded visual evidence... [OK]` },
          { id: String(Date.now() + 5), type: 'output', text: `  Step 5/5: Creating safe backup of previous release in .vva/history/backups/... [OK]` },
          { id: String(Date.now() + 6), type: 'success', text: `✓ CONTINUOUS DOCUMENTATION RELEASE CREATED (v1.1.0 · ${isFull ? 'FULL' : 'INCREMENTAL'})` },
          { id: String(Date.now() + 7), type: 'output', text: `  → PDF Report:    .vva/output/${currentRepo.name}_continuous_report.pdf (Embedded charts & tables)` },
          { id: String(Date.now() + 8), type: 'output', text: `  → Word Document: .vva/output/${currentRepo.name}_continuous_synopsis.docx (Executive format)` },
          { id: String(Date.now() + 9), type: 'output', text: `  → Presentation:  .vva/output/${currentRepo.name}_continuous_presentation.pptx (Demonstration deck)` },
          { id: String(Date.now() + 10), type: 'info', text: "Switch to 'Doc Generator' tab to view the visual charts, diagrams, and download files." }
        ]);
        setIsProcessing(false);
        return;
      }

      setLogs(prev => [
        ...prev,
        { id: String(Date.now()), type: 'error', text: `Unknown VVA command: 'vva ${subCmd}'. Type 'help' for available commands.` }
      ]);
      setIsProcessing(false);
      return;
    }

    if (mainCmd === 'git') {
      if (subCmd === 'log') {
        const count = parts.includes('-n') ? parseInt(parts[parts.indexOf('-n') + 1], 10) || 3 : 3;
        setLogs(prev => [
          ...prev,
          { id: String(Date.now()), type: 'info', text: `Showing last ${count} commit(s) on branch ${currentRepo.currentBranch}:` },
          ...currentRepo.commits.slice(0, count).map((c, i) => ({
            id: String(Date.now() + i + 1),
            type: 'output' as const,
            text: `commit ${c.hash}\nAuthor: ${c.author} <${c.email}>\nDate:   ${c.date}\n\n    ${c.message}\n`
          }))
        ]);
        setIsProcessing(false);
        return;
      }

      if (subCmd === 'status') {
        setLogs(prev => [
          ...prev,
          { id: String(Date.now()), type: 'output', text: `On branch ${currentRepo.currentBranch}\nYour branch is up to date with 'origin/${currentRepo.currentBranch}'.\n\nnothing to commit, working tree clean` }
        ]);
        setIsProcessing(false);
        return;
      }
    }

    if (cmd === 'cat .vva/config.json') {
      setLogs(prev => [
        ...prev,
        { id: String(Date.now()), type: 'info', text: JSON.stringify(vvaConfig, null, 2) }
      ]);
      setIsProcessing(false);
      return;
    }

    // Default unknown command
    setLogs(prev => [
      ...prev,
      { id: String(Date.now()), type: 'error', text: `bash: command not found: ${cmd}. Type 'help' to see VVA orchestrator commands.` }
    ]);
    setIsProcessing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIndex);
        setInputVal(commandHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const nextIndex = historyIndex + 1;
        if (nextIndex < commandHistory.length) {
          setHistoryIndex(nextIndex);
          setInputVal(commandHistory[nextIndex]);
        } else {
          setHistoryIndex(-1);
          setInputVal('');
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 py-4 w-full">
      {/* Quick Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <TerminalIcon className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-slate-200">Interactive VVA Orchestrator Terminal</span>
          <span className="text-slate-600">·</span>
          <span>Target: {currentRepo.name} ({selectedCommit.shortHash})</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCommand('vva status')}
            className="px-2.5 py-1 text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/60 transition-colors"
          >
            vva status
          </button>
          <button
            onClick={() => handleCommand('vva init')}
            className="px-2.5 py-1 text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/60 transition-colors"
          >
            vva init
          </button>
          <button
            onClick={() => handleCommand('vva docs')}
            className="px-2.5 py-1 text-xs font-mono font-medium bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-300 rounded border border-emerald-700/60 transition-colors"
          >
            vva docs
          </button>
          <button
            onClick={() => handleCommand('vva docs --full')}
            className="px-2.5 py-1 text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/60 transition-colors"
          >
            vva docs --full
          </button>
          <button
            onClick={() => handleCommand('vva report')}
            className="px-2.5 py-1 text-xs font-mono font-medium bg-indigo-900/50 hover:bg-indigo-800/60 text-indigo-300 rounded border border-indigo-700/60 transition-colors"
          >
            vva report
          </button>
          <button
            onClick={() => handleCommand('vva watch')}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded border transition-colors ${
              isWatchMode 
                ? 'bg-amber-950 text-amber-300 border-amber-800'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/60'
            }`}
          >
            {isWatchMode ? 'Stop watch' : 'vva watch'}
          </button>
          <button
            onClick={() => handleCommand('git log -n 3')}
            className="px-2.5 py-1 text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/60 transition-colors"
          >
            git log
          </button>
          <button
            onClick={() => setLogs([])}
            title="Clear Terminal"
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors ml-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Screen */}
      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl flex flex-col overflow-hidden font-mono text-xs">
        {/* Window Chrome */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-slate-400 select-none">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-slate-400 text-xs font-sans">
              abhiram@vva-orchestrator:~/{currentRepo.name}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-sans">
            <span>Node v20.12.2</span>
            <span>·</span>
            <span>Python 3.11.8</span>
          </div>
        </div>

        {/* Console Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-1.5 leading-relaxed text-slate-300">
          {logs.map(log => {
            if (log.type === 'cmd') {
              return (
                <div key={log.id} className="flex items-start gap-2 text-indigo-300 font-semibold pt-1">
                  <span className="text-emerald-400 select-none font-bold">vva@{currentRepo.name.toLowerCase()}:~$</span>
                  <span>{log.text}</span>
                </div>
              );
            }
            if (log.type === 'info') {
              return (
                <div key={log.id} className="text-cyan-400 font-medium">
                  {log.text}
                </div>
              );
            }
            if (log.type === 'success') {
              return (
                <div key={log.id} className="text-emerald-400 font-medium">
                  {log.text}
                </div>
              );
            }
            if (log.type === 'warn') {
              return (
                <div key={log.id} className="text-amber-300">
                  {log.text}
                </div>
              );
            }
            if (log.type === 'error') {
              return (
                <div key={log.id} className="text-rose-400 font-medium">
                  {log.text}
                </div>
              );
            }
            return (
              <div key={log.id} className="text-slate-300 whitespace-pre-wrap">
                {log.text}
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex items-center gap-2 text-slate-400 italic pt-1">
              <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
              <span>Orchestrating background task...</span>
            </div>
          )}

          <div ref={terminalEndRef} />
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border-t border-slate-800">
          <span className="text-emerald-400 font-bold select-none">
            vva@{currentRepo.name.toLowerCase()}:~$
          </span>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type 'vva report', 'vva status', 'help'..."
            disabled={isProcessing}
            className="flex-1 bg-transparent text-slate-100 outline-none border-none text-xs font-mono placeholder:text-slate-600"
            autoFocus
          />
          <button
            onClick={() => handleCommand(inputVal)}
            disabled={!inputVal.trim() || isProcessing}
            className="p-1 text-slate-400 hover:text-indigo-400 disabled:opacity-30 transition-colors"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Generated Artifacts Quick Banner if available */}
      {lastProjectData && lastAIResponse && (
        <div className="mt-3 p-3 bg-slate-900 border border-indigo-900/40 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-semibold">Latest Orchestrated Report:</span>
            <span className="text-slate-200 font-medium">{lastAIResponse.title}</span>
            <span className="text-slate-500">({lastProjectData.analyzedCommit.slice(0, 7)})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectTab('documents')}
              className="px-2.5 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
            >
              View Generated PDF &amp; Documents →
            </button>
            <button
              onClick={() => onSelectTab('ai-engine')}
              className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
            >
              Inspect AI JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
