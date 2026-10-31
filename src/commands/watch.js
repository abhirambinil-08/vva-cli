import { getRepoRoot, execGit } from '../core/git.js';
import { docsCommand } from './docs.js';

/**
 * Continuous Watcher Daemon.
 * Monitors Git HEAD commits or active file modifications and automatically
 * updates the historical project database and continuous documentation.
 */
export async function watchCommand(options = {}, cwd = process.cwd(), onEventDetected) {
  const root = await getRepoRoot(cwd);
  const mode = options.mode || 'commits'; // 'commits' | 'changes'
  const pollIntervalMs = options.intervalMs || (mode === 'changes' ? 3000 : 5000);

  let lastKnownCommit = null;
  let lastKnownStatus = null;

  try {
    lastKnownCommit = await execGit(['rev-parse', 'HEAD'], root);
    lastKnownStatus = await execGit(['status', '--porcelain'], root);
  } catch {}

  let isRunning = true;
  let isGenerating = false;

  console.log(`\x1b[36m[vva watch] Active monitor daemon listening in '${mode}' mode (interval: ${pollIntervalMs}ms)...\x1b[0m`);
  console.log(`\x1b[36m[vva watch] Press Ctrl+C to terminate monitor.\x1b[0m\n`);

  const intervalId = setInterval(async () => {
    if (!isRunning || isGenerating) return;

    try {
      if (mode === 'commits') {
        const currentCommit = await execGit(['rev-parse', 'HEAD'], root);
        if (currentCommit && currentCommit !== lastKnownCommit) {
          lastKnownCommit = currentCommit;
          isGenerating = true;

          console.log(`\n\x1b[32m[vva watch] New commit detected: ${currentCommit.slice(0, 7)}!\x1b[0m`);
          console.log(`  Triggering continuous incremental documentation update...`);

          if (onEventDetected) {
            await onEventDetected({ type: 'commit', commit: currentCommit });
          } else {
            await docsCommand({
              incremental: true,
              format: options.format || 'all',
              purpose: options.purpose || 'technical'
            }, root);
            console.log(`\x1b[32m✓ [vva watch] Incremental documentation updated successfully.\x1b[0m\n`);
          }

          isGenerating = false;
        }
      } else if (mode === 'changes') {
        const currentStatus = await execGit(['status', '--porcelain'], root);
        if (currentStatus !== lastKnownStatus) {
          lastKnownStatus = currentStatus;
          const dirtyCount = currentStatus.split('\n').filter(Boolean).length;
          console.log(`\x1b[33m[vva watch] Worktree modified: ${dirtyCount} file(s) changed in working directory.\x1b[0m`);

          if (onEventDetected) {
            await onEventDetected({ type: 'changes', count: dirtyCount });
          }
        }
      }
    } catch {
      // Continue polling
    } finally {
      isGenerating = false;
    }
  }, pollIntervalMs);

  return {
    stop: () => {
      isRunning = false;
      clearInterval(intervalId);
    }
  };
}
