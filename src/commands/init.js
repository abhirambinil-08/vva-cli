import path from 'node:path';
import { isGitRepo, getRepoRoot } from '../core/git.js';
import { runIntelligentSetup } from '../core/setup.js';

/**
 * Intelligent Setup Manager command (`vva init`).
 * Automatically audits the environment, provisions virtual environment,
 * installs dependencies, validates engines, and configures .vva.
 */
export async function initCommand(options = {}, cwd = process.cwd()) {
  const isRepo = await isGitRepo(cwd);
  if (!isRepo) {
    throw new Error(
      `Cannot initialize VVA: directory '${cwd}' is not inside a Git repository.\n` +
      `Please initialize or clone a Git repository first:\n` +
      `  git init\n` +
      `  vva init`
    );
  }

  const root = await getRepoRoot(cwd);

  const setupResult = await runIntelligentSetup(root, {
    forceDeps: options.force || options.forceDeps || false,
    onProgress: options.onProgress,
  });

  return {
    success: true,
    root,
    vvaDir: path.join(root, '.vva'),
    config: setupResult.config,
    setupResult,
  };
}
