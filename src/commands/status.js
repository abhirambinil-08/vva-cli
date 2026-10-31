import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { isGitRepo, getRepoRoot, getCurrentBranch, execGit, getCommitDetails } from '../core/git.js';
import { inspectPythonEnvironment, VVA_PACKAGE_ROOT } from '../core/python.js';
import { checkNvidiaCredentials, detectEnvironment } from '../core/setup.js';
import { loadProjectHistory, getHistoryDir } from '../core/history.js';
import { collectVisualEvidence } from '../core/visuals.js';

export async function statusCommand(cwd = process.cwd()) {
  const isRepo = await isGitRepo(cwd);
  if (!isRepo) {
    return {
      isGitRepo: false,
      message: `Directory '${cwd}' is not inside a Git repository.`
    };
  }

  const root = await getRepoRoot(cwd);
  const branch = await getCurrentBranch(root);
  const configFile = path.join(root, '.vva', 'config.json');

  let isInitialized = false;
  let config = null;
  try {
    const raw = await fs.readFile(configFile, 'utf8');
    config = JSON.parse(raw);
    isInitialized = true;
  } catch {
    isInitialized = false;
  }

  let latestCommit = null;
  try {
    const headHash = await execGit(['rev-parse', 'HEAD'], root);
    latestCommit = await getCommitDetails(headHash, root);
  } catch {
    latestCommit = null;
  }

  let uncommittedCount = 0;
  try {
    const statusRaw = await execGit(['status', '--porcelain'], root);
    uncommittedCount = statusRaw ? statusRaw.split('\n').filter(Boolean).length : 0;
  } catch {}

  // Historical Project Intelligence
  const history = await loadProjectHistory(root);

  // Documentation Release Manifest
  const manifestFile = path.join(getHistoryDir(root), 'docs-manifest.json');
  let latestRelease = null;
  if (fsSync.existsSync(manifestFile)) {
    try {
      const manifest = JSON.parse(await fs.readFile(manifestFile, 'utf8'));
      latestRelease = manifest.releases?.[0] || null;
    } catch {}
  }

  // Visual Assets Count
  const visuals = await collectVisualEvidence(root);

  // Probe Python environment and packages
  const pythonStatus = await inspectPythonEnvironment(root);

  // Check NVIDIA credentials
  const nvidiaStatus = await checkNvidiaCredentials(root, VVA_PACKAGE_ROOT);

  // Detect OS details
  const sysEnv = await detectEnvironment();

  return {
    isGitRepo: true,
    repositoryName: path.basename(root),
    repositoryPath: root,
    vvaPackageRoot: VVA_PACKAGE_ROOT,
    branch,
    isInitialized,
    config,
    latestCommit,
    uncommittedCount,
    history: {
      totalCommits: history.totalCommits || 0,
      processedCommits: history.processedCommitHashes?.length || 0,
      contributorsCount: Object.keys(history.contributors || {}).length,
      lastUpdatedAt: history.lastUpdatedAt
    },
    documentation: {
      latestRelease,
      visualAssetsCount: visuals.totalCount,
      screenshotsCount: visuals.screenshots.length,
      chartsCount: visuals.charts.length
    },
    python: pythonStatus,
    nvidia: nvidiaStatus,
    system: sysEnv
  };
}
