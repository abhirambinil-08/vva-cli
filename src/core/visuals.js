/**
 * VVA Visual Evidence Manager
 * Scans, catalogs, and organizes screenshots, architectural diagrams,
 * and visual proof of development work across project milestones.
 */

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif']);

/**
 * Common locations where developers and VVA store UI screenshots and diagrams.
 */
const SCAN_DIRECTORIES = [
  'screenshots',
  'docs/images',
  'docs/screenshots',
  'public/assets',
  'assets',
  '.vva/screenshots',
  '.vva/output/charts'
];

/**
 * Infers category and whether an image is an actual application screenshot
 * vs a technical diagram or generated illustration.
 */
function classifyImage(filePath, fileName) {
  const lower = fileName.toLowerCase();
  const lowerPath = filePath.toLowerCase();

  if (lower.startsWith('chart_') || lowerPath.includes('chart')) {
    return {
      type: 'chart',
      isActualScreenshot: false,
      label: 'Generated Data Visualization',
      caption: fileName.replace(/^chart_/, '').replace(/\.[^.]+$/, '').replace(/_/g, ' ')
    };
  }

  if (lower.startsWith('diagram_') || lowerPath.includes('diagram') || lower.includes('architecture')) {
    return {
      type: 'diagram',
      isActualScreenshot: false,
      label: 'Technical Architecture Diagram',
      caption: 'System Architecture & Data Flow Visualization'
    };
  }

  if (lower.includes('illustration') || lower.includes('mockup') || lower.includes('wireframe')) {
    return {
      type: 'illustration',
      isActualScreenshot: false,
      label: 'Design Wireframe / Illustration',
      caption: fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    };
  }

  // Otherwise, classify as actual application screenshot
  return {
    type: 'screenshot',
    isActualScreenshot: true,
    label: 'Application Interface Screenshot',
    caption: `Application Screenshot: ${fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')}`
  };
}

/**
 * Catalogs all visual evidence across the repository.
 */
export async function collectVisualEvidence(repoRoot) {
  const evidence = {
    screenshots: [],
    charts: [],
    diagrams: [],
    illustrations: [],
    totalCount: 0
  };

  for (const relDir of SCAN_DIRECTORIES) {
    const absDir = path.join(repoRoot, relDir);
    if (!fsSync.existsSync(absDir)) continue;

    try {
      const entries = await fs.readdir(absDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;

        const ext = path.extname(entry.name).toLowerCase();
        if (!IMAGE_EXTENSIONS.has(ext)) continue;

        const absPath = path.join(absDir, entry.name);
        const stat = await fs.stat(absPath);
        const classification = classifyImage(absPath, entry.name);

        const record = {
          id: `vis-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          filename: entry.name,
          relativePath: path.relative(repoRoot, absPath).replace(/\\/g, '/'),
          absolutePath: absPath,
          sizeBytes: stat.size,
          mtime: stat.mtime.toISOString(),
          type: classification.type,
          isActualScreenshot: classification.isActualScreenshot,
          label: classification.label,
          caption: classification.caption
        };

        if (classification.type === 'screenshot') evidence.screenshots.push(record);
        else if (classification.type === 'chart') evidence.charts.push(record);
        else if (classification.type === 'diagram') evidence.diagrams.push(record);
        else evidence.illustrations.push(record);

        evidence.totalCount++;
      }
    } catch {
      // Ignore unreadable dirs
    }
  }

  return evidence;
}
