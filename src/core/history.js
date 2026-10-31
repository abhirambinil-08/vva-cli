/**
 * VVA Continuous Project History & Documentation Release Manager
 * Maintains cumulative repository evolution data, milestone progression,
 * processed commit registries, and versioned document release manifests.
 */

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { execGit, getRepoRoot, getCurrentBranch, getCommitDetails, getCommitStats, getCommitChangedFiles } from './git.js';

/**
 * Resolves the .vva/history directory inside the target repository.
 */
export function getHistoryDir(repoRoot) {
  return path.join(repoRoot, '.vva', 'history');
}

/**
 * Reads existing project history from disk, or initializes default structure.
 */
export async function loadProjectHistory(repoRoot) {
  const historyFile = path.join(getHistoryDir(repoRoot), 'project-history.json');
  if (fsSync.existsSync(historyFile)) {
    try {
      const raw = await fs.readFile(historyFile, 'utf8');
      return JSON.parse(raw);
    } catch {
      // Fallback
    }
  }

  return {
    vvaVersion: '1.0.0',
    repositoryName: path.basename(repoRoot),
    repositoryPath: repoRoot,
    branch: 'main',
    initializedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    totalCommits: 0,
    processedCommitHashes: [],
    commits: [],
    contributors: {},
    fileComposition: {},
    milestones: []
  };
}

/**
 * Analyzes repository worktree to compute file type distribution.
 */
export async function computeFileComposition(repoRoot) {
  const breakdown = {};
  const ignoredDirs = new Set(['node_modules', '.git', '.venv', 'dist', 'build', '.vva']);

  async function walk(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (!ignoredDirs.has(entry.name) && !entry.name.startsWith('.')) {
            await walk(path.join(dir, entry.name));
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase() || 'other';
          const label = ext === '.ts' || ext === '.tsx' ? 'TypeScript'
                      : ext === '.js' || ext === '.jsx' ? 'JavaScript'
                      : ext === '.py' ? 'Python'
                      : ext === '.json' ? 'JSON'
                      : ext === '.md' ? 'Markdown'
                      : ext === '.html' || ext === '.css' ? 'HTML/CSS'
                      : 'Other';
          breakdown[label] = (breakdown[label] || 0) + 1;
        }
      }
    } catch {
      // Ignore errors
    }
  }

  await walk(repoRoot);
  return breakdown;
}

/**
 * Automatically classifies a commit into a developmental milestone.
 */
function classifyMilestone(message) {
  const lower = message.toLowerCase();
  if (lower.includes('init') || lower.includes('initial')) return 'Project Inception & Setup';
  if (lower.includes('feat') || lower.includes('add') || lower.includes('implement')) return 'Feature Delivery';
  if (lower.includes('fix') || lower.includes('bug') || lower.includes('patch')) return 'Reliability & Bug Fix';
  if (lower.includes('refactor') || lower.includes('clean') || lower.includes('restructure')) return 'Code Quality & Refactoring';
  if (lower.includes('doc') || lower.includes('readme')) return 'Documentation';
  if (lower.includes('test')) return 'Verification & Testing';
  return 'Development Milestone';
}

/**
 * Syncs and updates continuous project history across all Git commits.
 */
export async function syncProjectHistory(repoRoot, options = {}) {
  const historyDir = getHistoryDir(repoRoot);
  await fs.mkdir(historyDir, { recursive: true });

  const existingHistory = await loadProjectHistory(repoRoot);
  const processedSet = new Set(existingHistory.processedCommitHashes || []);

  const branch = await getCurrentBranch(repoRoot);
  existingHistory.branch = branch;

  // Retrieve git commit list in reverse chronological order
  let rawLog = '';
  try {
    rawLog = await execGit(['log', '--format=%H', '--reverse'], repoRoot);
  } catch {
    // Empty repository with no commits
    return {
      history: existingHistory,
      newCommitsCount: 0,
      newCommits: []
    };
  }

  const allCommitHashes = rawLog.split('\n').map(s => s.trim()).filter(Boolean);
  const newCommits = [];

  for (const hash of allCommitHashes) {
    if (processedSet.has(hash) && !options.force) continue;

    try {
      const details = await getCommitDetails(hash, repoRoot);
      const stats = await getCommitStats(hash, repoRoot);
      const changed = await getCommitChangedFiles(hash, repoRoot);
      const milestone = classifyMilestone(details.message);

      const commitRecord = {
        hash: details.hash,
        shortHash: details.shortHash,
        author: details.author,
        email: details.email,
        date: details.date,
        message: details.message,
        milestone,
        filesChanged: stats.filesChanged,
        insertions: stats.insertions,
        deletions: stats.deletions,
        changedFilesList: changed.map(c => c.file)
      };

      newCommits.push(commitRecord);

      // Add to historical commit records if not existing
      const existingIdx = existingHistory.commits.findIndex(c => c.hash === hash);
      if (existingIdx !== -1) {
        existingHistory.commits[existingIdx] = commitRecord;
      } else {
        existingHistory.commits.push(commitRecord);
      }

      processedSet.add(hash);

      // Tally contributor metrics
      const authorKey = details.author || 'Anonymous';
      if (!existingHistory.contributors[authorKey]) {
        existingHistory.contributors[authorKey] = {
          name: authorKey,
          email: details.email,
          commits: 0,
          insertions: 0,
          deletions: 0
        };
      }
      existingHistory.contributors[authorKey].commits += 1;
      existingHistory.contributors[authorKey].insertions += stats.insertions;
      existingHistory.contributors[authorKey].deletions += stats.deletions;

    } catch {
      // Continue next commit
    }
  }

  existingHistory.totalCommits = existingHistory.commits.length;
  existingHistory.processedCommitHashes = Array.from(processedSet);
  existingHistory.lastUpdatedAt = new Date().toISOString();
  existingHistory.fileComposition = await computeFileComposition(repoRoot);

  // Derive unique milestones
  existingHistory.milestones = existingHistory.commits
    .map(c => ({ milestone: c.milestone, commit: c.shortHash, date: c.date, message: c.message }));

  // Write updated history to disk
  const historyFile = path.join(historyDir, 'project-history.json');
  await fs.writeFile(historyFile, JSON.stringify(existingHistory, null, 2), 'utf8');

  return {
    history: existingHistory,
    newCommitsCount: newCommits.length,
    newCommits
  };
}

/**
 * Creates backups of existing documents before updating them,
 * and maintains the documentation release manifest.
 */
export async function recordDocumentationRelease(repoRoot, releaseInfo) {
  const historyDir = getHistoryDir(repoRoot);
  const backupsDir = path.join(historyDir, 'backups', String(Date.now()));
  const manifestFile = path.join(historyDir, 'docs-manifest.json');

  // Load or create manifest
  let manifest = { releases: [] };
  if (fsSync.existsSync(manifestFile)) {
    try {
      manifest = JSON.parse(await fs.readFile(manifestFile, 'utf8'));
    } catch {}
  }

  // Backup any previously generated files that will be overwritten
  let backedUpFiles = [];
  if (releaseInfo.filesToBackup && releaseInfo.filesToBackup.length > 0) {
    await fs.mkdir(backupsDir, { recursive: true });
    for (const src of releaseInfo.filesToBackup) {
      if (fsSync.existsSync(src)) {
        const dest = path.join(backupsDir, path.basename(src));
        try {
          await fs.copyFile(src, dest);
          backedUpFiles.push(dest);
        } catch {}
      }
    }
  }

  const releaseRecord = {
    releaseId: `rel-${Date.now()}`,
    version: releaseInfo.version || `1.${manifest.releases.length}.0`,
    timestamp: new Date().toISOString(),
    strategy: releaseInfo.strategy || 'incremental', // 'incremental' | 'full'
    purpose: releaseInfo.purpose || 'technical',
    commitsIncluded: releaseInfo.commitsIncluded || 1,
    filesGenerated: releaseInfo.filesGenerated || [],
    backedUpFiles,
    summary: releaseInfo.summary || 'Continuous documentation update'
  };

  manifest.releases.unshift(releaseRecord);
  await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2), 'utf8');

  return releaseRecord;
}
