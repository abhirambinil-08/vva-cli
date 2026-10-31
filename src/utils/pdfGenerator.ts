import { jsPDF } from 'jspdf';
import { ProjectDataJSON, AIStructuredResponse } from '../types/vva';

export function generatePDFReport(
  projectData: ProjectDataJSON,
  aiAnalysis: AIStructuredResponse
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('VVA — Version & Workflow Automator', margin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('AUTOMATED GIT COMMIT TECHNICAL REPORT & CODE ANALYSIS', margin, 21);
  doc.text(`Generated: ${new Date().toLocaleDateString()} | Orchestrator: Node.js/Python`, pageWidth - margin, 21, { align: 'right' });

  y = 36;

  // Title Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(aiAnalysis.title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 6 + 2;

  // Commit Metadata Table Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'FD');

  doc.setFontSize(8.5);
  const col1 = margin + 4;
  const col2 = margin + contentWidth / 2;
  const metaY = y + 7;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Repository:', col1, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${projectData.repository} (${projectData.branch})`, col1 + 22, metaY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Commit Hash:', col1, metaY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${projectData.analyzedCommit.slice(0, 16)}...`, col1 + 22, metaY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Parent Commit:', col1, metaY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(projectData.parentCommit ? `${projectData.parentCommit.slice(0, 16)}...` : 'None (Root Commit)', col1 + 22, metaY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Author:', col2, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${projectData.author.name} <${projectData.author.email}>`, col2 + 18, metaY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Commit Date:', col2, metaY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(projectData.author.date, col2 + 18, metaY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Impact:', col2, metaY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${projectData.summary.filesChanged} file(s) · +${projectData.summary.insertions} / -${projectData.summary.deletions}`, col2 + 18, metaY + 14);

  y += 38;

  // Section 1: Executive Synopsis
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('1. Executive Synopsis', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const summaryLines = doc.splitTextToSize(aiAnalysis.summary, contentWidth);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 4.5 + 4;

  // Section 2: Technical Significance & Implementation
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('2. Technical Changes & Code Implementation', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  for (const change of aiAnalysis.technicalChanges) {
    const bullet = `• ${change}`;
    const lines = doc.splitTextToSize(bullet, contentWidth - 4);
    doc.text(lines, margin + 2, y);
    y += lines.length * 4.2 + 1.5;
  }
  y += 3;

  // Section 3: Affected Files & File State
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('3. Modified Files & Git State Analysis', margin, y);
  y += 5;

  doc.setFontSize(8);
  for (const f of projectData.changedFiles) {
    const statusText = f.status === 'A' ? '[ADDED]' : f.status === 'M' ? '[MODIFIED]' : '[DELETED]';
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(f.status === 'A' ? 22 : f.status === 'M' ? 16 : 220, f.status === 'A' ? 101 : f.status === 'M' ? 185 : 38, f.status === 'A' ? 52 : f.status === 'M' ? 129 : 38);
    doc.text(statusText, margin + 2, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`${f.file}  (+${f.additions} / -${f.deletions})`, margin + 26, y);
    y += 5;
  }
  y += 4;

  // Section 4: Architectural Impact & Technologies
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('4. Architectural Impact & Stack', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const archLines = doc.splitTextToSize(aiAnalysis.architecturalImpact, contentWidth);
  doc.text(archLines, margin, y);
  y += archLines.length * 4.5 + 3;

  doc.setFont('helvetica', 'bold');
  doc.text('Technologies Used: ', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(aiAnalysis.technologies.join(', '), margin + 32, y);
  y += 8;

  // Section 5: Engineering Observations & Anti-Hallucination Guardrails
  if (aiAnalysis.observationsAndLimitations && aiAnalysis.observationsAndLimitations.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('5. Engineering Observations & Audit Notes', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    for (const obs of aiAnalysis.observationsAndLimitations) {
      const lines = doc.splitTextToSize(`• ${obs}`, contentWidth - 4);
      doc.text(lines, margin + 2, y);
      y += lines.length * 4.2 + 1;
    }
  }

  // Footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    doc.text('VVA — Version & Workflow Automator · Developed by Abhiram Binil, Vishnu G Pillai, Vinay Bisht', margin, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  return doc;
}
