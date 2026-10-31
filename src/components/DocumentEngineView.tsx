import React, { useState } from 'react';
import { FileText, FileDown, Presentation, Eye, Download, ChevronLeft, ChevronRight, Maximize2, Minimize2, Check, ExternalLink } from 'lucide-react';
import { Repository, GitCommit, ProjectDataJSON, AIStructuredResponse, VVAConfig } from '../types/vva';
import { generatePDFReport } from '../utils/pdfGenerator';
import { exportWordDocx } from '../utils/docxExporter';

interface DocumentEngineViewProps {
  currentRepo: Repository;
  selectedCommit: GitCommit;
  projectData: ProjectDataJSON;
  aiAnalysis: AIStructuredResponse;
  vvaConfig: VVAConfig;
}

export const DocumentEngineView: React.FC<DocumentEngineViewProps> = ({
  currentRepo,
  selectedCommit,
  projectData,
  aiAnalysis,
  vvaConfig,
}) => {
  const [docType, setDocType] = useState<'pdf' | 'docx' | 'pptx'>('pdf');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreenSlide, setIsFullscreenSlide] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // PDF Download Handler
  const handleDownloadPDF = () => {
    try {
      const doc = generatePDFReport(projectData, aiAnalysis);
      const filename = `${projectData.repository}_${projectData.analyzedCommit.slice(0, 7)}_report.pdf`;
      doc.save(filename);
      setDownloadSuccess('PDF Report downloaded successfully!');
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (e: any) {
      alert(`PDF Generation failed: ${e.message}`);
    }
  };

  // DOCX Download Handler
  const handleDownloadDOCX = () => {
    try {
      exportWordDocx(projectData, aiAnalysis);
      setDownloadSuccess('Word Document synopsis downloaded successfully!');
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (e: any) {
      alert(`DOCX Export failed: ${e.message}`);
    }
  };

  // PPT slides definition
  const slides = [
    {
      title: aiAnalysis.title,
      subtitle: `Automated Git Development Report · ${projectData.repository} (${projectData.branch})`,
      content: (
        <div className="flex flex-col justify-center items-center h-full text-center p-8 space-y-4">
          <div className="px-3 py-1 bg-indigo-950 text-indigo-300 font-mono text-xs rounded border border-indigo-800">
            COMMIT {projectData.analyzedCommit.slice(0, 7)} · {projectData.author.name}
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight max-w-2xl">
            {aiAnalysis.title}
          </h2>
          <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
            {aiAnalysis.summary}
          </p>
          <div className="pt-4 flex items-center gap-4 text-xs text-slate-400 font-mono">
            <span>+{projectData.summary.insertions} additions</span>
            <span>·</span>
            <span>-{projectData.summary.deletions} deletions</span>
            <span>·</span>
            <span>{projectData.changedFiles.length} files affected</span>
          </div>
        </div>
      )
    },
    {
      title: 'Architectural Scope & Affected Components',
      subtitle: 'Component Breakdown & Git Version State',
      content: (
        <div className="p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
                Modified &amp; Added Components
              </h4>
              <div className="space-y-2">
                {projectData.changedFiles.map(f => (
                  <div key={f.file} className="flex items-center justify-between text-xs font-mono p-2 bg-slate-950 rounded border border-slate-800/80">
                    <span className="text-indigo-300 truncate max-w-[200px]">{f.file}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      f.status === 'A' ? 'text-emerald-400 bg-emerald-950' :
                      f.status === 'M' ? 'text-cyan-400 bg-cyan-950' : 'text-rose-400 bg-rose-950'
                    }`}>
                      {f.status === 'A' ? 'ADDED' : f.status === 'M' ? 'MODIFIED' : 'DELETED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                Strategic Rationale
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {aiAnalysis.purposeAndRationale}
              </p>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                Architectural Shift
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {aiAnalysis.architecturalImpact}
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Technical Implementation Details',
      subtitle: 'Key Code Changes Verified from Patch',
      content: (
        <div className="p-8 space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Verified Code Modifications
          </h4>
          <div className="space-y-2.5">
            {aiAnalysis.technicalChanges.map((tc, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-slate-200">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{tc}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Technology Stack & Engineering Summary',
      subtitle: 'Tools, Rationale & Next Iteration Milestones',
      content: (
        <div className="p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
                Detected Technologies
              </h4>
              <div className="flex flex-wrap gap-2">
                {aiAnalysis.technologies.map(t => (
                  <span key={t} className="px-3 py-1 bg-slate-950 text-indigo-300 font-mono text-xs rounded border border-slate-800">
                    {t}
                  </span>
                ))}
              </div>

              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mt-4 mb-2">
                Author Attribution
              </h4>
              <p className="text-xs text-slate-300 font-mono">
                {projectData.author.name} &lt;{projectData.author.email}&gt;
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                Audit Notes &amp; Observations
              </h4>
              <div className="space-y-2">
                {aiAnalysis.observationsAndLimitations.map((obs, i) => (
                  <div key={i} className="text-xs text-amber-300/90 bg-amber-950/20 border border-amber-900/30 p-2 rounded">
                    • {obs}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const [docScope, setDocScope] = useState<'continuous' | 'commit'>('continuous');
  const [docPurpose, setDocPurpose] = useState<'technical' | 'academic' | 'progress' | 'demo'>('technical');
  const [selectedChart, setSelectedChart] = useState<'arch' | 'activity' | 'contributors' | 'composition'>('arch');

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 py-4 w-full flex flex-col gap-4">
      {/* Top Strip: Continuous Scope & Purpose & Format Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80 uppercase tracking-widest">
              Continuous Intelligence
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Release v1.0.0 · Incremental Tracking
            </span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Multi-Format Continuous Document Generator (PDF · DOCX · PPTX)</span>
            </h1>
            <span className="text-xs text-slate-400">by Vinay Bisht</span>
          </div>
        </div>

        {/* Scope and Purpose Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setDocScope('continuous')}
              className={`px-2.5 py-1 font-medium rounded transition-colors ${
                docScope === 'continuous'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Continuous Docs (v1.0.0)
            </button>
            <button
              onClick={() => setDocScope('commit')}
              className={`px-2.5 py-1 font-medium rounded transition-colors ${
                docScope === 'commit'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Single Commit
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setDocType('pdf')}
              className={`flex items-center gap-1 px-2.5 py-1 font-medium rounded transition-colors ${
                docType === 'pdf' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => setDocType('docx')}
              className={`flex items-center gap-1 px-2.5 py-1 font-medium rounded transition-colors ${
                docType === 'docx' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>DOCX</span>
            </button>
            <button
              onClick={() => setDocType('pptx')}
              className={`flex items-center gap-1 px-2.5 py-1 font-medium rounded transition-colors ${
                docType === 'pptx' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>PPTX</span>
            </button>
          </div>

          {/* Download Action */}
          {docType === 'pdf' && (
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          )}
          {docType === 'docx' && (
            <button
              onClick={handleDownloadDOCX}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download DOCX</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Evidence & Matplotlib Charts Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <span>📊</span>
              <span>Generated Technical Visualizations &amp; Evidence:</span>
            </span>
            <span className="text-slate-500">4 assets rendered</span>
          </div>

          <div className="flex flex-wrap items-center gap-1 text-xs">
            <button
              onClick={() => setSelectedChart('arch')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedChart === 'arch' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              Architecture Diagram
            </button>
            <button
              onClick={() => setSelectedChart('activity')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedChart === 'activity' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              Commit Timeline &amp; Churn
            </button>
            <button
              onClick={() => setSelectedChart('contributors')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedChart === 'contributors' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              Contributor Distribution
            </button>
            <button
              onClick={() => setSelectedChart('composition')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedChart === 'composition' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              File Composition
            </button>
          </div>
        </div>

        {/* Selected Chart Display Box */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 flex flex-col items-center justify-center">
          <div className="w-full max-w-2xl bg-white rounded p-2 shadow-md">
            {selectedChart === 'arch' && (
              <img
                src="/assets/charts/diagram_architecture.png"
                alt="System Architecture Diagram"
                className="w-full h-auto object-contain rounded"
              />
            )}
            {selectedChart === 'activity' && (
              <img
                src="/assets/charts/chart_commit_activity.png"
                alt="Commit Activity Chart"
                className="w-full h-auto object-contain rounded"
              />
            )}
            {selectedChart === 'contributors' && (
              <img
                src="/assets/charts/chart_contributors.png"
                alt="Contributor Distribution Chart"
                className="w-full h-auto object-contain rounded"
              />
            )}
            {selectedChart === 'composition' && (
              <img
                src="/assets/charts/chart_file_composition.png"
                alt="File Composition Chart"
                className="w-full h-auto object-contain rounded"
              />
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-2 font-mono flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
              {selectedChart === 'arch' ? 'Technical Diagram' : 'Generated Data Visualization'}
            </span>
            <span>Embedded into generated PDF (ReportLab), Word (python-docx), and PowerPoint (python-pptx)</span>
          </span>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-2.5 bg-emerald-950/60 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{downloadSuccess} Saved to <code>{vvaConfig.outputDir}</code>.</span>
        </div>
      )}

      {/* Main Preview Container */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-6 flex flex-col items-center overflow-y-auto">
        {/* PDF VIEW */}
        {docType === 'pdf' && (
          <div className="w-full max-w-4xl bg-white text-slate-900 shadow-2xl rounded-sm p-10 font-sans border border-slate-300 space-y-6">
            {/* PDF Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-indigo-700 uppercase">
                  VVA Automated Technical Report
                </span>
                <h1 className="text-xl font-extrabold text-slate-900 mt-1">
                  {aiAnalysis.title}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Commit Analysis for {projectData.repository} ({projectData.branch})
                </p>
              </div>
              <div className="text-right text-xs text-slate-500 font-mono">
                <div>Hash: {projectData.analyzedCommit.slice(0, 10)}...</div>
                <div>Date: {projectData.author.date}</div>
              </div>
            </div>

            {/* Commit Metadata Box */}
            <div className="bg-slate-50 border border-slate-200 rounded p-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="mb-1"><strong className="text-slate-600">Repository:</strong> {projectData.repository}</div>
                <div className="mb-1"><strong className="text-slate-600">Author:</strong> {projectData.author.name} &lt;{projectData.author.email}&gt;</div>
                <div><strong className="text-slate-600">Parent Commit:</strong> <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">{projectData.parentCommit ? projectData.parentCommit.slice(0, 10) : 'Initial Commit'}</code></div>
              </div>
              <div>
                <div className="mb-1"><strong className="text-slate-600">Changes:</strong> +{projectData.summary.insertions} / -{projectData.summary.deletions} lines</div>
                <div className="mb-1"><strong className="text-slate-600">Files Affected:</strong> {projectData.changedFiles.length} file(s)</div>
                <div><strong className="text-slate-600">AI Confidence:</strong> 96% (meta/llama-3.1-70b)</div>
              </div>
            </div>

            {/* Section 1: Executive Synopsis */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2">
                1. Executive Synopsis
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed">
                {aiAnalysis.summary}
              </p>
              <p className="text-xs text-slate-600 mt-2 italic">
                <strong>Strategic Purpose:</strong> {aiAnalysis.purposeAndRationale}
              </p>
            </div>

            {/* Section 2: Technical Changes */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2">
                2. Technical Changes &amp; Implementation Details
              </h2>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {aiAnalysis.technicalChanges.map((tc, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>{tc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 3: File Changes Breakdown */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2">
                3. Git File Version &amp; State Inspection
              </h2>
              <div className="border border-slate-200 rounded overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Status</th>
                      <th className="p-2">File Path</th>
                      <th className="p-2 text-right">Additions</th>
                      <th className="p-2 text-right">Deletions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {projectData.changedFiles.map((f, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-bold">
                          <span className={
                            f.status === 'A' ? 'text-emerald-700' :
                            f.status === 'M' ? 'text-blue-700' : 'text-rose-700'
                          }>
                            [{f.status === 'A' ? 'ADDED' : f.status === 'M' ? 'MODIFIED' : 'DELETED'}]
                          </span>
                        </td>
                        <td className="p-2 text-slate-800">{f.file}</td>
                        <td className="p-2 text-right text-emerald-600">+{f.additions}</td>
                        <td className="p-2 text-right text-rose-600">-{f.deletions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Architecture & Technologies */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2">
                4. Architecture Impact &amp; Technologies
              </h2>
              <p className="text-xs text-slate-700 mb-2">
                {aiAnalysis.architecturalImpact}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {aiAnalysis.technologies.map(t => (
                  <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-mono text-[10px]">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-400">
              VVA Orchestrator · Developed by Abhiram Binil, Vishnu G Pillai, Vinay Bisht · Page 1 of 1
            </div>
          </div>
        )}

        {/* DOCX VIEW */}
        {docType === 'docx' && (
          <div className="w-full max-w-4xl bg-white text-slate-900 shadow-2xl rounded p-12 font-sans border border-slate-300 space-y-6">
            <div className="border-b-4 border-blue-600 pb-3">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
                Academic Project Documentation &amp; Synopsis (DOCX)
              </span>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">
                {aiAnalysis.title}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Generated according to software engineering documentation standards
              </p>
            </div>

            <div className="bg-slate-50 p-4 border border-slate-200 rounded text-xs space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Project Repository:</strong> {projectData.repository}</div>
                <div><strong>Developer:</strong> {projectData.author.name}</div>
                <div><strong>Commit Reference:</strong> <code className="bg-slate-200 px-1 py-0.5 rounded">{projectData.analyzedCommit}</code></div>
                <div><strong>Evaluation Date:</strong> {projectData.author.date}</div>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-800 leading-relaxed">
              <h2 className="text-sm font-bold text-blue-900 border-b border-slate-200 pb-1">
                1. Project Synopsis &amp; Problem Statement
              </h2>
              <p>{aiAnalysis.summary}</p>
              <p><strong>Rationale:</strong> {aiAnalysis.purposeAndRationale}</p>

              <h2 className="text-sm font-bold text-blue-900 border-b border-slate-200 pb-1">
                2. Technical Changes Implemented
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                {aiAnalysis.technicalChanges.map((tc, idx) => (
                  <li key={idx}>{tc}</li>
                ))}
              </ul>

              <h2 className="text-sm font-bold text-blue-900 border-b border-slate-200 pb-1">
                3. Architectural Impact &amp; Modularity
              </h2>
              <p>{aiAnalysis.architecturalImpact}</p>

              <h2 className="text-sm font-bold text-blue-900 border-b border-slate-200 pb-1">
                4. Engineering Verification &amp; Observations
              </h2>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                {aiAnalysis.observationsAndLimitations.map((obs, idx) => (
                  <li key={idx}>{obs}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* PPTX VIEW (Slide Deck) */}
        {docType === 'pptx' && (
          <div className="w-full max-w-4xl flex flex-col items-center">
            {/* Slide Navigation Bar */}
            <div className="flex items-center justify-between w-full mb-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">
                  Slide {currentSlide + 1} of {slides.length}:
                </span>
                <span className="text-indigo-400">{slides[currentSlide].title}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                  disabled={currentSlide === 0}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        i === currentSlide ? 'bg-amber-500' : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
                  disabled={currentSlide === slides.length - 1}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slide Screen (16:9 Aspect Ratio) */}
            <div className="w-full aspect-[16/9] bg-slate-950 border-2 border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden relative">
              {/* Slide Top Banner */}
              <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-amber-500" />
                  <span className="font-bold text-white tracking-wide">VVA Presentation Deck</span>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">{projectData.repository} · {projectData.branch}</span>
              </div>

              {/* Slide Body */}
              <div className="flex-1 overflow-y-auto">
                {slides[currentSlide].content}
              </div>

              {/* Slide Footer */}
              <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900/60 border-t border-slate-800/80 text-[11px] text-slate-500">
                <span>VVA · Version &amp; Workflow Automator</span>
                <span>Slide {currentSlide + 1} / {slides.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
