/**
 * VVA Setup Manager
 * Core orchestrator for environment detection, dependency management,
 * Python virtual environment provisioning, and cross-system configuration.
 */

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

// Resolve VVA installation package root
export function getVvaPackageRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
}

/**
 * Executes a process safely with argument array and promise return.
 */
async function runProc(cmd, args = [], options = {}) {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      maxBuffer: 20 * 1024 * 1024,
      ...options,
      env: {
        ...process.env,
        ...(options.env || {}),
      },
    });
    return { success: true, stdout: (stdout || '').trim(), stderr: (stderr || '').trim() };
  } catch (error) {
    return {
      success: false,
      stdout: (error.stdout || '').trim(),
      stderr: (error.stderr || error.message || '').trim(),
      code: error.code,
    };
  }
}

/**
 * Step 1-3: Detect operating system, versions, and software availability.
 */
export async function detectEnvironment() {
  const platform = process.platform;
  const osType = os.type();
  const osRelease = os.release();
  const osArch = process.arch;

  let osName = 'Linux';
  if (platform === 'win32') osName = 'Windows';
  else if (platform === 'darwin') osName = 'macOS';

  // Node.js Version Check
  const nodeVersion = process.version; // e.g. "v22.23.4"
  const nodeMajor = parseInt(nodeVersion.replace(/^v/, '').split('.')[0], 10);
  const nodeOk = nodeMajor >= 18;

  // npm Check
  const npmRes = await runProc('npm', ['--version']);
  const npmVersion = npmRes.success ? npmRes.stdout : null;
  const npmOk = npmRes.success && npmVersion;

  // System Python Discovery (Check python3, python, py)
  const pythonCandidates = platform === 'win32'
    ? ['python', 'py', 'python3']
    : ['python3', 'python'];

  let detectedPythonBin = null;
  let pythonVersionStr = null;
  let pythonMajor = 0;
  let pythonMinor = 0;

  for (const bin of pythonCandidates) {
    const check = await runProc(bin, ['--version']);
    if (check.success && check.stdout.includes('Python')) {
      const match = check.stdout.match(/Python\s+(\d+)\.(\d+)\.?(\d+)?/);
      if (match) {
        detectedPythonBin = bin;
        pythonVersionStr = match[0];
        pythonMajor = parseInt(match[1], 10);
        pythonMinor = parseInt(match[2], 10);
        break;
      }
    }
  }

  const pythonOk = pythonMajor >= 3 && pythonMinor >= 8;

  return {
    os: {
      platform,
      name: osName,
      type: osType,
      release: osRelease,
      arch: osArch,
    },
    node: {
      version: nodeVersion,
      major: nodeMajor,
      isCompatible: nodeOk,
      minRequired: '18.0.0',
    },
    npm: {
      version: npmVersion || 'Not found',
      isAvailable: !!npmOk,
    },
    python: {
      binary: detectedPythonBin,
      version: pythonVersionStr || 'Not found',
      major: pythonMajor,
      minor: pythonMinor,
      isCompatible: pythonOk,
      minRequired: '3.8.0',
    },
  };
}

/**
 * Step 4: Check and install JavaScript dependencies if missing.
 */
export async function checkAndInstallJsDependencies(vvaRoot, force = false) {
  const nodeModulesPath = path.join(vvaRoot, 'node_modules');
  const packageJsonPath = path.join(vvaRoot, 'package.json');

  let packageJson = {};
  try {
    const raw = await fs.readFile(packageJsonPath, 'utf8');
    packageJson = JSON.parse(raw);
  } catch {
    return { status: 'skipped', message: 'package.json not found in VVA root' };
  }

  const requiredDeps = Object.keys(packageJson.dependencies || {});
  let hasMissing = false;

  if (!fsSync.existsSync(nodeModulesPath) || force) {
    hasMissing = true;
  } else {
    for (const dep of requiredDeps.slice(0, 5)) {
      if (!fsSync.existsSync(path.join(nodeModulesPath, dep))) {
        hasMissing = true;
        break;
      }
    }
  }

  if (!hasMissing && !force) {
    return {
      status: 'skipped',
      alreadyInstalled: true,
      message: 'JavaScript dependencies verified in node_modules/',
    };
  }

  const installRes = await runProc('npm', ['install', '--no-fund', '--no-audit'], {
    cwd: vvaRoot,
  });

  if (!installRes.success) {
    throw new Error(`npm install failed: ${installRes.stderr || installRes.stdout}`);
  }

  return {
    status: 'installed',
    message: 'Successfully installed required Node.js packages',
  };
}

/**
 * Resolves virtual environment binary paths based on OS.
 */
export function getVenvPaths(baseDir) {
  const venvDir = path.join(baseDir, '.venv');
  const isWindows = process.platform === 'win32';

  const pythonExecutable = isWindows
    ? path.join(venvDir, 'Scripts', 'python.exe')
    : path.join(venvDir, 'bin', 'python');

  const pipExecutable = isWindows
    ? path.join(venvDir, 'Scripts', 'pip.exe')
    : path.join(venvDir, 'bin', 'pip');

  return {
    venvDir,
    pythonExecutable,
    pipExecutable,
  };
}

/**
 * Step 5: Check or create Python virtual environment (.venv).
 */
export async function setupVirtualEnvironment(vvaRoot, systemPythonBin) {
  const { venvDir, pythonExecutable, pipExecutable } = getVenvPaths(vvaRoot);

  // Check if .venv already exists and has working python
  if (fsSync.existsSync(pythonExecutable)) {
    const testExec = await runProc(pythonExecutable, ['--version']);
    if (testExec.success) {
      return {
        status: 'skipped',
        venvDir,
        pythonExecutable,
        pipExecutable,
        version: testExec.stdout,
        message: `Existing virtual environment verified at ${venvDir}`,
      };
    }
  }

  if (!systemPythonBin) {
    throw new Error('System Python 3.8+ is required to create virtual environment.');
  }

  // 1. Attempt standard virtual environment creation
  let venvRes = await runProc(systemPythonBin, ['-m', 'venv', venvDir], {
    cwd: vvaRoot,
  });

  // 2. If ensurepip is missing (common on Debian/Ubuntu minimal images), retry with --without-pip
  if (!venvRes.success && (venvRes.stderr.includes('ensurepip') || venvRes.stderr.includes('python3-venv'))) {
    venvRes = await runProc(systemPythonBin, ['-m', 'venv', '--without-pip', venvDir], {
      cwd: vvaRoot,
    });

    if (venvRes.success && fsSync.existsSync(pythonExecutable)) {
      // Bootstrap pip into the virtual environment using get-pip.py
      const tempGetPip = path.join(os.tmpdir(), `vva-get-pip-${Date.now()}.py`);
      try {
        const downloadRes = await runProc('curl', [
          '-sSL',
          'https://bootstrap.pypa.io/get-pip.py',
          '-o',
          tempGetPip,
        ]);

        if (downloadRes.success && fsSync.existsSync(tempGetPip)) {
          await runProc(pythonExecutable, [tempGetPip, '--no-setuptools', '--no-wheel', '--quiet']);
        }
      } catch {
        // Fallback or warning if curl fails
      } finally {
        try {
          if (fsSync.existsSync(tempGetPip)) await fs.unlink(tempGetPip);
        } catch {}
      }
    }
  }

  if (!venvRes.success) {
    throw new Error(`Failed to create virtual environment at ${venvDir}: ${venvRes.stderr}`);
  }

  // Verify created python executable
  const verifyRes = await runProc(pythonExecutable, ['--version']);
  if (!verifyRes.success) {
    throw new Error(`Virtual environment created but Python binary failed to execute: ${verifyRes.stderr}`);
  }

  return {
    status: 'created',
    venvDir,
    pythonExecutable,
    pipExecutable,
    version: verifyRes.stdout,
    message: `Created dedicated Python virtual environment at ${venvDir}`,
  };
}

/**
 * Step 6: Check and install Python dependencies into .venv.
 */
export async function setupPythonDependencies(vvaRoot, pythonExecutable, force = false) {
  const requirementsPath = path.join(vvaRoot, 'requirements.txt');
  if (!fsSync.existsSync(requirementsPath)) {
    throw new Error(`requirements.txt not found at: ${requirementsPath}`);
  }

  // Probe imports: openai, dotenv, reportlab, docx, pptx
  if (!force) {
    const probeScript = 'import openai; import dotenv; import reportlab; import docx; import pptx';
    const probeRes = await runProc(pythonExecutable, ['-c', probeScript]);
    if (probeRes.success) {
      return {
        status: 'skipped',
        alreadyInstalled: true,
        message: 'All Python packages (openai, reportlab, python-docx, python-pptx, python-dotenv) are ready',
      };
    }
  }

  // Upgrade pip quietly first if possible
  await runProc(pythonExecutable, ['-m', 'pip', 'install', '--upgrade', 'pip', '--quiet']);

  // Install from requirements.txt
  const installRes = await runProc(
    pythonExecutable,
    ['-m', 'pip', 'install', '-r', requirementsPath, '--no-warn-script-location'],
    { cwd: vvaRoot }
  );

  if (!installRes.success) {
    throw new Error(`Failed to install Python dependencies from ${requirementsPath}: ${installRes.stderr}`);
  }

  return {
    status: 'installed',
    message: 'Successfully installed Python dependencies into .venv',
  };
}

/**
 * Step 7: Locate and validate AI engine and Document engine scripts.
 */
export async function validateEngines(vvaRoot) {
  const aiEnginePath = path.join(vvaRoot, 'ai', 'ai_engine.py');
  const docEnginePath = path.join(vvaRoot, 'document_engine', 'document_engine.py');
  const testNvidiaPath = path.join(vvaRoot, 'ai', 'test_nvidia.py');

  const missing = [];
  if (!fsSync.existsSync(aiEnginePath)) missing.push('ai/ai_engine.py');
  if (!fsSync.existsSync(docEnginePath)) missing.push('document_engine/document_engine.py');

  if (missing.length > 0) {
    throw new Error(`Missing required VVA engine components: ${missing.join(', ')}`);
  }

  return {
    status: 'validated',
    aiEngine: aiEnginePath,
    docEngine: docEnginePath,
    testNvidia: fsSync.existsSync(testNvidiaPath) ? testNvidiaPath : null,
    message: 'AI Engine and Document Engine modules validated successfully',
  };
}

/**
 * Step 8: Create .vva directory structure in target project.
 */
export async function createVvaDirectories(targetRoot) {
  const vvaDir = path.join(targetRoot, '.vva');
  const outputDir = path.join(vvaDir, 'output');
  const logsDir = path.join(vvaDir, 'logs');

  await fs.mkdir(vvaDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(logsDir, { recursive: true });

  return {
    vvaDir,
    outputDir,
    logsDir,
  };
}

/**
 * Step 9: Generate or preserve config.json without overwriting user settings.
 */
export async function setupConfigFile(targetRoot, pythonExecutable) {
  const configFile = path.join(targetRoot, '.vva', 'config.json');

  if (fsSync.existsSync(configFile)) {
    try {
      const raw = await fs.readFile(configFile, 'utf8');
      const existingConfig = JSON.parse(raw);
      return {
        status: 'preserved',
        config: existingConfig,
        configFile,
        message: 'Preserved existing .vva/config.json',
      };
    } catch {
      // If corrupted, fallback to writing default
    }
  }

  const defaultConfig = {
    vvaVersion: '1.0.0',
    initializedAt: new Date().toISOString(),
    defaultFormat: 'all',
    outputDir: '.vva/output',
    pythonBinary: pythonExecutable,
    aiProvider: 'nvidia',
    aiModel: 'openai/gpt-oss-20b',
    maxDiffSizeBytes: 1048576,
    team: {
      orchestrator: 'Abhiram Binil (Person 1)',
      aiEngine: 'Vishnu G Pillai (Person 2)',
      documentEngine: 'Vinay Bisht (Person 3)',
    },
  };

  await fs.writeFile(configFile, JSON.stringify(defaultConfig, null, 2), 'utf8');

  return {
    status: 'created',
    config: defaultConfig,
    configFile,
    message: 'Generated default .vva/config.json configuration',
  };
}

/**
 * Step 10 & 11: Check NVIDIA API key and format instructions.
 */
export async function checkNvidiaCredentials(targetRoot, vvaRoot) {
  let foundKey = process.env.NVIDIA_API_KEY || null;
  let source = 'environment';

  // Helper to extract key from .env file
  const extractKeyFromEnv = async (filePath) => {
    try {
      if (fsSync.existsSync(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        const match = content.match(/^\s*NVIDIA_API_KEY\s*=\s*(.+)$/m);
        if (match) {
          const val = match[1].trim().replace(/^['"]|['"]$/g, '');
          if (val && !val.includes('your_nvidia_api_key_here') && !val.includes('nvapi-your-key-here')) {
            return val;
          }
        }
      }
    } catch {
      //
    }
    return null;
  };

  if (!foundKey) {
    const targetEnvKey = await extractKeyFromEnv(path.join(targetRoot, '.env'));
    if (targetEnvKey) {
      foundKey = targetEnvKey;
      source = path.join(targetRoot, '.env');
    }
  }

  if (!foundKey) {
    const vvaEnvKey = await extractKeyFromEnv(path.join(vvaRoot, '.env'));
    if (vvaEnvKey) {
      foundKey = vvaEnvKey;
      source = path.join(vvaRoot, '.env');
    }
  }

  const isConfigured = !!foundKey && foundKey.length > 8 && !foundKey.includes('your_nvidia_api_key_here');
  const maskedKey = isConfigured
    ? `${foundKey.slice(0, 6)}...${foundKey.slice(-4)}`
    : null;

  return {
    isConfigured,
    maskedKey,
    source,
    instruction: isConfigured
      ? `Configured via ${source}`
      : 'NVIDIA NIM API key is not yet configured. To enable AI analysis, add NVIDIA_API_KEY to your .env file or export it in your shell.',
  };
}

/**
 * Step 12: Validate overall end-to-end installation health.
 */
export async function validateOverallInstallation(targetRoot, vvaRoot, pythonExecutable) {
  const checks = [];

  // Check 1: Target directory exists
  checks.push({
    name: 'Target Workspace',
    passed: fsSync.existsSync(targetRoot),
    details: targetRoot,
  });

  // Check 2: .vva configuration exists
  checks.push({
    name: 'VVA Configuration',
    passed: fsSync.existsSync(path.join(targetRoot, '.vva', 'config.json')),
    details: '.vva/config.json',
  });

  // Check 3: Python Virtual Environment
  checks.push({
    name: 'Python Environment',
    passed: fsSync.existsSync(pythonExecutable),
    details: pythonExecutable,
  });

  // Check 4: AI & Document Engines
  const aiEngineExists = fsSync.existsSync(path.join(vvaRoot, 'ai', 'ai_engine.py'));
  const docEngineExists = fsSync.existsSync(path.join(vvaRoot, 'document_engine', 'document_engine.py'));
  checks.push({
    name: 'VVA Engine Modules',
    passed: aiEngineExists && docEngineExists,
    details: 'ai_engine.py & document_engine.py ready',
  });

  const allPassed = checks.every((c) => c.passed);

  return {
    allPassed,
    checks,
  };
}

/**
 * Step 13 / Master Flow: Run Intelligent Setup Manager
 */
export async function runIntelligentSetup(targetRoot = process.cwd(), options = {}) {
  const vvaRoot = getVvaPackageRoot();
  const progressLogs = [];

  const logStep = (stepNum, title, status, details = '') => {
    progressLogs.push({ stepNum, title, status, details });
    if (options.onProgress) {
      options.onProgress({ stepNum, title, status, details });
    }
  };

  // 1. Operating System Detection
  const env = await detectEnvironment();
  logStep(
    1,
    'Operating System Detection',
    'ok',
    `${env.os.name} (${env.os.platform} ${env.os.arch}, kernel ${env.os.release})`
  );

  // 2. Node & npm Availability Check
  if (!env.node.isCompatible) {
    throw new Error(
      `Node.js ${env.node.minRequired}+ is required. Detected: ${env.node.version}. Please update Node.js.`
    );
  }
  logStep(2, 'Node.js & npm Verification', 'ok', `Node ${env.node.version}, npm ${env.npm.version}`);

  // 3. Python 3.8+ Availability Check
  if (!env.python.isCompatible) {
    throw new Error(
      `Python ${env.python.minRequired}+ is required. Detected: ${env.python.version || 'None'}. Please install Python 3.8 or higher.`
    );
  }
  logStep(3, 'Python Runtime Discovery', 'ok', `${env.python.version} (${env.python.binary})`);

  // 4. JavaScript Dependency Verification
  const jsDepRes = await checkAndInstallJsDependencies(vvaRoot, options.forceDeps);
  logStep(
    4,
    'JavaScript Dependencies',
    jsDepRes.status === 'installed' ? 'installed' : 'skipped',
    jsDepRes.message
  );

  // 5. Python Virtual Environment Setup
  const venvRes = await setupVirtualEnvironment(vvaRoot, env.python.binary);
  logStep(
    5,
    'Python Virtual Environment (.venv)',
    venvRes.status === 'created' ? 'created' : 'skipped',
    venvRes.message
  );

  // 6. Python Dependencies Setup
  const pyDepRes = await setupPythonDependencies(
    vvaRoot,
    venvRes.pythonExecutable,
    options.forceDeps
  );
  logStep(
    6,
    'Python Packages (requirements.txt)',
    pyDepRes.status === 'installed' ? 'installed' : 'skipped',
    pyDepRes.message
  );

  // 7. Locate & Validate Engines
  const enginesRes = await validateEngines(vvaRoot);
  logStep(7, 'Engine Modules Validation', 'ok', enginesRes.message);

  // 8. Create .vva Directory Structure
  const dirsRes = await createVvaDirectories(targetRoot);
  logStep(8, 'Directory Structure Provisioning', 'ok', `Created ${dirsRes.vvaDir} (output, logs)`);

  // 9. Generate or Preserve config.json
  const configRes = await setupConfigFile(targetRoot, venvRes.pythonExecutable);
  logStep(9, 'Configuration Management', configRes.status, configRes.message);

  // 10 & 11. Check NVIDIA Credentials & Instructions
  const nvidiaRes = await checkNvidiaCredentials(targetRoot, vvaRoot);
  logStep(
    10,
    'NVIDIA API Credentials',
    nvidiaRes.isConfigured ? 'ok' : 'warn',
    nvidiaRes.isConfigured
      ? `Configured (${nvidiaRes.maskedKey})`
      : 'Missing NVIDIA_API_KEY (optional for dry-run, required for live report)'
  );

  // 12. Validate Overall Installation Health
  const healthRes = await validateOverallInstallation(targetRoot, vvaRoot, venvRes.pythonExecutable);
  logStep(
    12,
    'Installation Health Audit',
    healthRes.allPassed ? 'ok' : 'warn',
    healthRes.allPassed ? 'All 4 critical subsystems verified' : 'Subsystem audit warnings'
  );

  // 13. Completion status
  return {
    success: true,
    targetRoot,
    vvaRoot,
    env,
    venv: venvRes,
    config: configRes.config,
    nvidia: nvidiaRes,
    health: healthRes,
    steps: progressLogs,
  };
}
