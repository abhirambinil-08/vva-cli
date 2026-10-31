import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

// src/core/python.js -> VVA package root
export const VVA_PACKAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

/**
 * Returns candidate Python executables, prioritizing dedicated virtual environment (.venv)
 * on Linux, macOS, and Windows.
 */
export function getCandidatePythonPaths(cwd = process.cwd()) {
  const isWindows = process.platform === 'win32';
  const candidates = [];

  // 1. Dedicated VVA package root virtual environment
  const vvaVenv = path.join(VVA_PACKAGE_ROOT, '.venv');
  candidates.push(
    isWindows
      ? path.join(vvaVenv, 'Scripts', 'python.exe')
      : path.join(vvaVenv, 'bin', 'python')
  );

  // 2. Target repository virtual environment (if initialized locally)
  if (cwd && cwd !== VVA_PACKAGE_ROOT) {
    const cwdVenv = path.join(cwd, '.venv');
    candidates.push(
      isWindows
        ? path.join(cwdVenv, 'Scripts', 'python.exe')
        : path.join(cwdVenv, 'bin', 'python')
    );
  }

  // 3. Fallback to system PATH executables
  if (isWindows) {
    candidates.push('python', 'py', 'python3');
  } else {
    candidates.push('python3', 'python');
  }

  return candidates;
}

/**
 * Discovers and validates the active Python binary, favoring .venv if present.
 */
export async function getPythonBinary(cwd = process.cwd()) {
  const candidates = getCandidatePythonPaths(cwd);

  for (const candidate of candidates) {
    try {
      if (candidate.includes(path.sep)) {
        // File path check
        if (!fsSync.existsSync(candidate)) continue;
      }
      const { stdout } = await execFileAsync(candidate, ['--version']);
      if (stdout.includes('Python')) {
        return candidate;
      }
    } catch {
      // Continue searching next candidate
    }
  }

  throw new Error(
    'Python 3.8+ is required but neither a dedicated virtual environment (.venv) nor system python was found.\n' +
    'Run "vva init" to automatically set up the Python environment and dependencies.'
  );
}

/**
 * Probes the Python environment to inspect packages and version details.
 */
export async function inspectPythonEnvironment(cwd = process.cwd()) {
  try {
    const binary = await getPythonBinary(cwd);
    const { stdout: versionRaw } = await execFileAsync(binary, ['--version']);
    const isVenv = binary.includes('.venv');

    // Check if packages are available
    let packagesReady = false;
    try {
      await execFileAsync(binary, [
        '-c',
        'import openai; import reportlab; import docx; import pptx; import dotenv'
      ]);
      packagesReady = true;
    } catch {
      packagesReady = false;
    }

    return {
      available: true,
      binary,
      version: versionRaw.trim(),
      isVenv,
      packagesReady
    };
  } catch (err) {
    return {
      available: false,
      binary: null,
      version: null,
      isVenv: false,
      packagesReady: false,
      error: err.message
    };
  }
}

/**
 * Runs an internal VVA Python script with the active Python runtime while
 * passing dynamic project context.
 *
 * @param {string} scriptRelativePath Path relative to the VVA package root.
 * @param {string[]} args Command-line arguments.
 * @param {string} cwd Target repository working directory.
 */
export async function invokePythonModule(
  scriptRelativePath,
  args = [],
  cwd = process.cwd()
) {
  const pythonBin = await getPythonBinary(cwd);

  // Internal scripts belong to VVA package root
  const scriptPath = path.resolve(VVA_PACKAGE_ROOT, scriptRelativePath);

  try {
    await fs.access(scriptPath);
  } catch {
    throw new Error(`VVA Python module not found at: ${scriptPath}`);
  }

  // Augment args with --project-dir if invoking ai_engine.py and not already provided
  const augmentedArgs = [...args];
  if (
    scriptRelativePath.includes('ai_engine.py') &&
    !augmentedArgs.includes('--project-dir')
  ) {
    augmentedArgs.push('--project-dir', cwd);
  }

  try {
    const { stdout, stderr } = await execFileAsync(
      pythonBin,
      [scriptPath, ...augmentedArgs],
      {
        cwd,
        maxBuffer: 25 * 1024 * 1024,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1'
        }
      }
    );

    if (stderr?.trim()) {
      process.stderr.write(`[VVA Python warning] ${stderr.trim()}\n`);
    }

    return stdout.trim();
  } catch (error) {
    throw new Error(
      `Python execution failed for ${scriptRelativePath}: ${
        error.stderr || error.message
      }`
    );
  }
}