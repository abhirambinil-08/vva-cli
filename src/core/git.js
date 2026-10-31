import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);

/**
 * Executes a Git command safely using argument arrays to prevent shell injection.
 * @param {string[]} args Git subcommands and arguments
 * @param {string} cwd Working directory
 * @returns {Promise<string>} stdout output
 */
export async function execGit(args, cwd = process.cwd()) {
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd,
      maxBuffer: 20 * 1024 * 1024, // 20MB buffer for diffs
      env: { ...process.env, LANG: 'C.UTF-8' }
    });
    return stdout.trim();
  } catch (error) {
    throw new Error(`Git command failed [git ${args.join(' ')}]: ${error.stderr || error.message}`);
  }
}

/**
 * Checks if a directory is inside a Git working tree.
 */
export async function isGitRepo(cwd = process.cwd()) {
  try {
    const res = await execGit(['rev-parse', '--is-inside-work-tree'], cwd);
    return res === 'true';
  } catch {
    return false;
  }
}

/**
 * Retrieves the absolute top-level directory of the Git repository.
 */
export async function getRepoRoot(cwd = process.cwd()) {
  return await execGit(['rev-parse', '--show-toplevel'], cwd);
}

/**
 * Retrieves the current branch name (or HEAD detached hash).
 */
export async function getCurrentBranch(cwd = process.cwd()) {
  try {
    const branch = await execGit(['rev-parse', '--abbrev-ref', 'HEAD'], cwd);
    return branch !== 'HEAD' ? branch : await execGit(['rev-parse', '--short', 'HEAD'], cwd);
  } catch {
    return 'unknown';
  }
}

/**
 * Checks if a repository has at least one commit.
 */
export async function hasCommits(cwd = process.cwd()) {
  try {
    await execGit(['rev-parse', '--verify', 'HEAD'], cwd);
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieves parent commit hash if available.
 */
export async function getParentCommit(commitHash, cwd = process.cwd()) {
  try {
    return await execGit(['rev-parse', '--verify', '--quiet', `${commitHash}^`], cwd);
  } catch {
    // Initial/root commit has no parent
    return null;
  }
}

/**
 * Retrieves detailed commit metadata for a specific commit hash.
 */
export async function getCommitDetails(commitHash, cwd = process.cwd()) {
  const delimiter = '---VVA_DELIM---';
  const format = `%H${delimiter}%h${delimiter}%an${delimiter}%ae${delimiter}%ad${delimiter}%B`;
  const raw = await execGit(['show', '-s', `--format=${format}`, '--date=iso-strict', commitHash], cwd);
  
  const [hash, shortHash, authorName, authorEmail, date, ...msgParts] = raw.split(delimiter);
  return {
    hash: hash.trim(),
    shortHash: shortHash.trim(),
    author: authorName.trim(),
    email: authorEmail.trim(),
    date: date.trim(),
    message: msgParts.join(delimiter).trim()
  };
}

/**
 * Retrieves changed files with their status flags (A, M, D, R) for a commit.
 */
export async function getCommitChangedFiles(commitHash, cwd = process.cwd()) {
  const isRoot = !(await getParentCommit(commitHash, cwd));
  const diffArgs = isRoot
    ? ['diff-tree', '--no-commit-id', '--name-status', '-r', '--root', commitHash]
    : ['diff-tree', '--no-commit-id', '--name-status', '-r', commitHash];

  const raw = await execGit(diffArgs, cwd);
  if (!raw) return [];

  const lines = raw.split('\n').filter(Boolean);
  return lines.map(line => {
    const parts = line.split('\t');
    const rawStatus = parts[0];
    const filePath = parts[1];
    
    // Normalize status: A, M, D, R
    let status = 'M';
    if (rawStatus.startsWith('A')) status = 'A';
    else if (rawStatus.startsWith('D')) status = 'D';
    else if (rawStatus.startsWith('R')) status = 'R';

    return {
      status,
      file: filePath
    };
  });
}

/**
 * Retrieves the committed version of a file at a specific commit.
 * For deleted files, inspects the parent commit.
 */
export async function getFileContentAtCommit(commitHash, filePath, isDeleted = false, cwd = process.cwd()) {
  try {
    const targetRef = isDeleted ? `${commitHash}^:${filePath}` : `${commitHash}:${filePath}`;
    return await execGit(['show', targetRef], cwd);
  } catch (error) {
    return `[VVA Warning: Could not retrieve committed content for ${filePath}: ${error.message}]`;
  }
}

/**
 * Retrieves the exact unified patch for a commit.
 */
export async function getCommitDiff(commitHash, cwd = process.cwd()) {
  const isRoot = !(await getParentCommit(commitHash, cwd));
  const args = isRoot
    ? ['show', '--format=', '--patch', '--root', commitHash]
    : ['show', '--format=', '--patch', commitHash];

  return await execGit(args, cwd);
}

/**
 * Retrieves insertion and deletion stats for a commit.
 */
export async function getCommitStats(commitHash, cwd = process.cwd()) {
  const isRoot = !(await getParentCommit(commitHash, cwd));
  const args = isRoot
    ? ['diff-tree', '--shortstat', '--root', commitHash]
    : ['diff-tree', '--shortstat', commitHash];

  try {
    const raw = await execGit(args, cwd);
    // e.g., " 2 files changed, 28 insertions(+), 4 deletions(-)"
    const filesMatch = raw.match(/(\d+)\s+file/);
    const insMatch = raw.match(/(\d+)\s+insertion/);
    const delMatch = raw.match(/(\d+)\s+deletion/);

    return {
      filesChanged: filesMatch ? parseInt(filesMatch[1], 10) : 0,
      insertions: insMatch ? parseInt(insMatch[1], 10) : 0,
      deletions: delMatch ? parseInt(delMatch[1], 10) : 0
    };
  } catch {
    return { filesChanged: 0, insertions: 0, deletions: 0 };
  }
}
