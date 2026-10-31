import React, { useState } from 'react';
import { Header } from './components/Header';
import { TerminalView } from './components/TerminalView';
import { GitCollectorView } from './components/GitCollectorView';
import { AIEngineView } from './components/AIEngineView';
import { DocumentEngineView } from './components/DocumentEngineView';
import { ArchitectureView } from './components/ArchitectureView';
import { TeamVivaView } from './components/TeamVivaView';
import { SAMPLE_REPOSITORIES, INITIAL_VVA_CONFIG } from './data/mockRepositories';
import { Repository, GitCommit, VVAConfig, ProjectDataJSON, AIStructuredResponse } from './types/vva';
import { buildProjectDataJSON, generateStructuredAIResponse } from './utils/orchestrator';

export default function App() {
  const [repositories, setRepositories] = useState<Repository[]>(SAMPLE_REPOSITORIES);
  const [currentRepo, setCurrentRepo] = useState<Repository>(SAMPLE_REPOSITORIES[0]);
  const [selectedCommit, setSelectedCommit] = useState<GitCommit>(SAMPLE_REPOSITORIES[0].commits[0]);
  const [vvaConfig, setVvaConfig] = useState<VVAConfig>(INITIAL_VVA_CONFIG);
  const [activeTab, setActiveTab] = useState<string>('terminal');
  const [isInitialized, setIsInitialized] = useState<boolean>(true);
  const [isWatchMode, setIsWatchMode] = useState<boolean>(false);
  const [isRunningReport, setIsRunningReport] = useState<boolean>(false);

  // Computed / cached data
  const initialProjectData = buildProjectDataJSON(currentRepo, selectedCommit, vvaConfig);
  const initialAIResponse = generateStructuredAIResponse(initialProjectData, vvaConfig.aiProvider);

  const [lastProjectData, setLastProjectData] = useState<ProjectDataJSON>(initialProjectData);
  const [lastAIResponse, setLastAIResponse] = useState<AIStructuredResponse>(initialAIResponse);

  const handleAddNewCommit = (newCommit: GitCommit) => {
    const updatedRepos = repositories.map(repo => {
      if (repo.id === currentRepo.id) {
        return {
          ...repo,
          commits: [newCommit, ...repo.commits]
        };
      }
      return repo;
    });

    setRepositories(updatedRepos);
    const updatedCurrent = updatedRepos.find(r => r.id === currentRepo.id) || currentRepo;
    setCurrentRepo(updatedCurrent);
    setSelectedCommit(newCommit);

    // Recompute
    const pData = buildProjectDataJSON(updatedCurrent, newCommit, vvaConfig);
    const aiResp = generateStructuredAIResponse(pData, vvaConfig.aiProvider);
    setLastProjectData(pData);
    setLastAIResponse(aiResp);
  };

  const handleSelectCommit = (commit: GitCommit) => {
    setSelectedCommit(commit);
    const pData = buildProjectDataJSON(currentRepo, commit, vvaConfig);
    const aiResp = generateStructuredAIResponse(pData, vvaConfig.aiProvider);
    setLastProjectData(pData);
    setLastAIResponse(aiResp);
  };

  const handleExecuteReport = async (format?: string) => {
    setIsRunningReport(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const pData = buildProjectDataJSON(currentRepo, selectedCommit, vvaConfig);
        const aiResp = generateStructuredAIResponse(pData, vvaConfig.aiProvider);
        setLastProjectData(pData);
        setLastAIResponse(aiResp);
        setIsRunningReport(false);
        resolve();
      }, 700);
    });
  };

  const handleHeaderRunReport = async () => {
    await handleExecuteReport();
    setActiveTab('documents');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRunReport={handleHeaderRunReport}
        isRunningReport={isRunningReport}
        repoName={currentRepo.name}
        currentBranch={currentRepo.currentBranch}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'terminal' && (
          <TerminalView
            currentRepo={currentRepo}
            selectedCommit={selectedCommit}
            vvaConfig={vvaConfig}
            isInitialized={isInitialized}
            setIsInitialized={setIsInitialized}
            onExecuteReport={handleExecuteReport}
            isWatchMode={isWatchMode}
            setIsWatchMode={setIsWatchMode}
            lastProjectData={lastProjectData}
            lastAIResponse={lastAIResponse}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === 'collector' && (
          <GitCollectorView
            repositories={repositories}
            currentRepo={currentRepo}
            onSelectRepo={(r) => {
              setCurrentRepo(r);
              setSelectedCommit(r.commits[0]);
              const pData = buildProjectDataJSON(r, r.commits[0], vvaConfig);
              const aiResp = generateStructuredAIResponse(pData, vvaConfig.aiProvider);
              setLastProjectData(pData);
              setLastAIResponse(aiResp);
            }}
            selectedCommit={selectedCommit}
            onSelectCommit={handleSelectCommit}
            vvaConfig={vvaConfig}
            onAddNewCommit={handleAddNewCommit}
          />
        )}

        {activeTab === 'ai-engine' && (
          <AIEngineView
            currentRepo={currentRepo}
            selectedCommit={selectedCommit}
            vvaConfig={vvaConfig}
            lastAIResponse={lastAIResponse}
            onUpdateAIResponse={setLastAIResponse}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentEngineView
            currentRepo={currentRepo}
            selectedCommit={selectedCommit}
            projectData={lastProjectData}
            aiAnalysis={lastAIResponse}
            vvaConfig={vvaConfig}
          />
        )}

        {activeTab === 'architecture' && <ArchitectureView />}

        {activeTab === 'team' && <TeamVivaView />}
      </main>

      {/* Quiet, Clean Editorial Footer (Anti-Slop Restraint) */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">VVA — Version &amp; Workflow Automator</span>
          <span>·</span>
          <span>Orchestrating Git Commit History into Technical Documents</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
          <span>Lead Orchestrator: Abhiram Binil</span>
          <span>·</span>
          <span>AI Engine: Vishnu G Pillai</span>
          <span>·</span>
          <span>Doc Engine: Vinay Bisht</span>
        </div>
      </footer>
    </div>
  );
}
