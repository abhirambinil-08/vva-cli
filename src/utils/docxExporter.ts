import { ProjectDataJSON, AIStructuredResponse } from '../types/vva';

export function exportWordDocx(
  projectData: ProjectDataJSON,
  aiAnalysis: AIStructuredResponse
): void {
  const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${aiAnalysis.title}</title>
      <style>
        body { font-family: 'Calibri', 'Segoe UI', sans-serif; line-height: 1.5; color: #1e293b; padding: 40px; }
        h1 { color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 6px; font-size: 24pt; margin-bottom: 4px; }
        .subtitle { color: #64748b; font-size: 11pt; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
        .meta-box { background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 14px; margin-bottom: 24px; border-radius: 4px; }
        .meta-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
        .meta-table td { padding: 4px 8px; vertical-align: top; }
        .meta-label { font-weight: bold; color: #475569; width: 120px; }
        h2 { color: #1e3a8a; font-size: 14pt; margin-top: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        p { font-size: 11pt; margin-bottom: 10px; }
        ul { margin-top: 4px; padding-left: 20px; }
        li { font-size: 10.5pt; margin-bottom: 6px; }
        .code-file { font-family: 'Consolas', monospace; font-size: 9.5pt; background: #f1f5f9; padding: 2px 6px; border-radius: 3px; }
        .tag { font-weight: bold; font-size: 8.5pt; padding: 2px 6px; }
        .tag-A { color: #15803d; }
        .tag-M { color: #0369a1; }
        .tag-D { color: #b91c1c; }
        .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 9pt; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <h1>${aiAnalysis.title}</h1>
      <div class="subtitle">VVA Project Technical Synopsis &amp; Implementation Report</div>

      <div class="meta-box">
        <table class="meta-table">
          <tr>
            <td class="meta-label">Project Repository:</td>
            <td><strong>${projectData.repository}</strong> (${projectData.branch})</td>
            <td class="meta-label">Author:</td>
            <td>${projectData.author.name} &lt;${projectData.author.email}&gt;</td>
          </tr>
          <tr>
            <td class="meta-label">Analyzed Commit:</td>
            <td><code>${projectData.analyzedCommit}</code></td>
            <td class="meta-label">Commit Date:</td>
            <td>${projectData.author.date}</td>
          </tr>
          <tr>
            <td class="meta-label">Parent Commit:</td>
            <td><code>${projectData.parentCommit || 'Root Commit (none)'}</code></td>
            <td class="meta-label">Diff Summary:</td>
            <td>${projectData.summary.filesChanged} file(s) changed, +${projectData.summary.insertions} / -${projectData.summary.deletions}</td>
          </tr>
        </table>
      </div>

      <h2>1. Project Synopsis &amp; Intent</h2>
      <p>${aiAnalysis.summary}</p>
      <p><strong>Rationale:</strong> ${aiAnalysis.purposeAndRationale}</p>

      <h2>2. Technical Changes Implemented</h2>
      <ul>
        ${aiAnalysis.technicalChanges.map(change => `<li>${change}</li>`).join('')}
      </ul>

      <h2>3. Code Components Affected (Git State Trace)</h2>
      <ul>
        ${projectData.changedFiles.map(f => `
          <li>
            <span class="tag tag-${f.status}">[${f.status === 'A' ? 'ADDED' : f.status === 'M' ? 'MODIFIED' : 'DELETED'}]</span>
            <span class="code-file">${f.file}</span>
            — ${f.additions} insertions(+), ${f.deletions} deletions(-)
          </li>
        `).join('')}
      </ul>

      <h2>4. Architectural Significance</h2>
      <p>${aiAnalysis.architecturalImpact}</p>
      <p><strong>Underlying Technologies:</strong> ${aiAnalysis.technologies.join(', ')}</p>

      <h2>5. Observations &amp; Verification Notes</h2>
      <ul>
        ${aiAnalysis.observationsAndLimitations.map(obs => `<li>${obs}</li>`).join('')}
      </ul>

      <div class="footer">
        Generated automatically by VVA (Version &amp; Workflow Automator) Orchestration Pipeline<br/>
        Project Team: Abhiram Binil (Orchestrator) · Vishnu G Pillai (AI Engine) · Vinay Bisht (Doc Engine)
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', content], {
    type: 'application/msword'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectData.repository}_${projectData.analyzedCommit.slice(0, 7)}_synopsis.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
