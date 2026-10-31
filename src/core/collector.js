import path from 'node:path';
import {
  isGitRepo,
  getRepoRoot,
  getCurrentBranch,
  getParentCommit,
  getCommitDetails,
  getCommitChangedFiles,
  getFileContentAtCommit,
  getCommitDiff,
  getCommitStats,
  execGit
} from './git.js';

const DEFAULT_MAX_DIFF_BYTES = 1024 * 1024; // 1MB payload cap

/**
 * Collects complete, traceable Git data for a given commit.
 * @param {string} [targetCommit] Commit hash or reference (defaults to HEAD)
 * @param {string} [cwd] Working directory
 * @param {object} [options] Configuration overrides
 */
export async function collectGitData(targetCommit = 'HEAD', cwd = process.cwd(), options = {}) {
  const isRepo = await isGitRepo(cwd);
  if (!isRepo) {
    throw new Error(`Directory '${cwd}' is not inside a Git repository. Run 'git init' or navigate to a repository.`);
  }

  const repoRoot = await getRepoRoot(cwd);
  const repoName = path.basename(repoRoot);
  const branch = await getCurrentBranch(repoRoot);

  // Resolve target commit reference to full 40-character SHA
  let resolvedCommitHash;
  try {
    resolvedCommitHash = await execGit(['rev-parse', targetCommit], repoRoot);
  } catch (err) {
    if (targetCommit === 'HEAD') {
      throw new Error(
        `Cannot generate report: No commits found in repository '${repoName}' (HEAD does not exist yet).\n` +
        `VVA analyzes Git commit history. Please make an initial commit first:\n` +
        `  git add .\n` +
        `  git commit -m "feat: initial commit"\n` +
        `Then re-run: vva report`
      );
    } else {
      throw new Error(
        `Cannot generate report: Commit reference '${targetCommit}' could not be resolved in repository '${repoName}'.`
      );
    }
  }
  const parentHash = await getParentCommit(resolvedCommitHash, repoRoot);

  // Extract metadata and stats
  const metadata = await getCommitDetails(resolvedCommitHash, repoRoot);
  const stats = await getCommitStats(resolvedCommitHash, repoRoot);
  const changedFilesMeta = await getCommitChangedFiles(resolvedCommitHash, repoRoot);

  const warnings = [];

  // Collect commit-specific file contents
  const changedFiles = [];
  for (const item of changedFilesMeta) {
    const isDeleted = item.status === 'D';
    let content = await getFileContentAtCommit(resolvedCommitHash, item.file, isDeleted, repoRoot);

    // Safeguard against huge single files
    if (content.length > 500 * 1024) {
      content = content.slice(0, 500 * 1024) + '\n\n[VVA Warning: File content truncated exceeding 500KB]';
      warnings.push(`File ${item.file} content truncated for payload safety.`);
    }

    // Determine line count delta
    let additions = 0;
    let deletions = 0;
    try {
      const numstatRaw = await execGit(['diff-tree', '--numstat', resolvedCommitHash, '--', item.file], repoRoot);
      const [addStr, delStr] = numstatRaw.split('\t');
      additions = addStr && addStr !== '-' ? parseInt(addStr, 10) : 0;
      deletions = delStr && delStr !== '-' ? parseInt(delStr, 10) : 0;
    } catch {
      // Fallback
    }

    changedFiles.push({
      file: item.file,
      status: item.status,
      additions,
      deletions,
      content
    });
  }

  // Collect unified diff
  let diff = await getCommitDiff(resolvedCommitHash, repoRoot);
  const maxDiffBytes = options.maxDiffSizeBytes || DEFAULT_MAX_DIFF_BYTES;
  if (Buffer.byteLength(diff, 'utf8') > maxDiffBytes) {
    diff = diff.slice(0, maxDiffBytes) + '\n\n[VVA Warning: Diff patch truncated due to maxDiffSizeBytes limit]';
    warnings.push(`Unified diff exceeded ${maxDiffBytes} bytes and was safely truncated.`);
  }

  return {
    vvaVersion: '1.0.0',
    timestamp: new Date().toISOString(),
    repository: repoName,
    repositoryPath: repoRoot,
    branch,
    analyzedCommit: resolvedCommitHash,
    parentCommit: parentHash,
    author: {
      name: metadata.author,
      email: metadata.email,
      date: metadata.date
    },
    commitMessage: metadata.message,
    summary: {
      filesChanged: stats.filesChanged || changedFiles.length,
      insertions: stats.insertions,
      deletions: stats.deletions
    },
    changedFiles,
    diff,
    ...(warnings.length > 0 ? { warnings } : {})
  };
}
