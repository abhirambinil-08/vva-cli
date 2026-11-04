#!/usr/bin/env node

import { initCommand } from './commands/init.js';
import { statusCommand } from './commands/status.js';
import { reportCommand } from './commands/report.js';
import { docsCommand } from './commands/docs.js';
import { watchCommand } from './commands/watch.js';

const args = process.argv.slice(2);
let command = args[0]?.toLowerCase();

// Support direct flags like --dry-run, --full, --incremental, -v, --version
if (command === '--version' || command === '-v') {
  console.log('VVA — Version & Workflow Automator v1.0.0');
  process.exit(0);
}

if (command === '--dry-run') {
  console.log(`\x1b[36m[VVA CLI] Flag '--dry-run' detected without explicit sub-command.\x1b[0m`);
  console.log(`  Executing report pipeline in dry-run mode (vva report --dry-run)...\n`);
  command = 'report';
} else if (command === '--full' || command === '--incremental') {
  console.log(`\x1b[36m[VVA CLI] Flag '${command}' detected without explicit sub-command.\x1b[0m`);
  console.log(`  Executing continuous documentation pipeline (vva docs ${command})...\n`);
  command = 'docs';
} else if (args.includes('--dry-run') && !['init', 'status', 'docs', 'report', 'watch', 'help', '--help', '-h'].includes(command)) {
  console.log(`\x1b[36m[VVA CLI] Unknown command '${command}', but '--dry-run' was specified.\x1b[0m`);
  console.log(`  Defaulting to: vva report --dry-run\n`);
  command = 'report';
}

function printHelp() {
  console.log(`
\x1b[36m╔═══════════════════════════════════════════════════════════════════╗
║   VVA — Version & Workflow Automator [Node.js Orchestrator CLI]   ║
╚═══════════════════════════════════════════════════════════════════╝\x1b[0m

Usage: vva <command> [options]

Core Commands:
  \x1b[32minit\x1b[0m                     Intelligent setup manager: detects environment, sets up
                           Python .venv, installs dependencies, and configures .vva/
  \x1b[32mstatus\x1b[0m                   Inspect repo status, branch, commit, .venv, and AI credentials
  \x1b[32mdocs\x1b[0m [options]           Continuous visual documentation: builds cumulative reports
                           with embedded charts, diagrams, tables, and screenshot evidence
  \x1b[32mreport\x1b[0m [options]         Single commit analysis pipeline: Git -> AI -> PDF/DOCX/PPTX
  \x1b[32mwatch\x1b[0m [options]          Continuous monitor daemon: watches commits/changes and auto-generates
  \x1b[32mhelp\x1b[0m                     Show this help guide

Continuous Docs Options (vva docs):
  --incremental            (Default) Update documentation for new commits since last release
  --full                   Reanalyze full Git project history from inception
  --since <commit>         Build documentation starting from specific commit
  --format <pdf|docx|pptx|all> Output format (default: all)
  --purpose <type>         Documentation purpose:
                           - technical (default)
                           - academic (thesis / final-year project format)
                           - progress (milestone & sprint report)
                           - software-engineering (architecture focus)
                           - demo (presentation focus)
  --dry-run                Generate visual charts & sync history without live AI calls

Watch Options (vva watch):
  --mode <commits|changes> Watch mode (default: commits)
  --interval <ms>          Polling interval in milliseconds (default: 5000)

Report Options (vva report):
  --commit <hash>          Target commit hash or ref (default: HEAD)
  --format <pdf|docx|pptx|all> Output format (default: all)
  --dry-run                Collect Git commit data only without invoking live AI
`);
}

async function main() {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
  }

  try {
    if (command === 'init') {
      const force = args.includes('--force');
      console.log(`\x1b[36m[VVA Setup Manager] Starting intelligent cross-system initialization...\x1b[0m\n`);

      const res = await initCommand({
        force,
        onProgress: ({ stepNum, title, status, details }) => {
          let mark = '\x1b[32m✓\x1b[0m';
          let color = '\x1b[37m';
          if (status === 'skipped') {
            mark = '\x1b[34mℹ\x1b[0m';
          } else if (status === 'warn') {
            mark = '\x1b[33m⚠\x1b[0m';
            color = '\x1b[33m';
          }
          console.log(`  ${mark} [Step ${stepNum}/12] ${title}: ${color}${details}\x1b[0m`);
        }
      });

      console.log(`\n\x1b[32m══════════════════════════════════════════════════════════════════════\x1b[0m`);
      console.log(`\x1b[32m  ✓ SETUP COMPLETE — VVA is ready to use in this repository!\x1b[0m`);
      console.log(`\x1b[32m══════════════════════════════════════════════════════════════════════\x1b[0m`);
      console.log(`  Target Repository:   ${res.root}`);
      console.log(`  Configuration:       ${res.vvaDir}/config.json`);
      console.log(`  Output Directory:    ${res.vvaDir}/output/`);
      console.log(`  Python Environment:  ${res.setupResult.venv.pythonExecutable}`);

      if (!res.setupResult.nvidia.isConfigured) {
        console.log(`\n\x1b[33m[Optional Setup Step: NVIDIA NIM API Key]\x1b[0m`);
        console.log(`  To enable live AI-powered document generation, configure your key:`);
        console.log(`    1. Copy template:  cp .env.example .env`);
        console.log(`    2. Edit .env:      NVIDIA_API_KEY=nvapi-your-key-here`);
        console.log(`  (You can test without an API key anytime using: \x1b[36mvva docs --dry-run\x1b[0m)`);
      } else {
        console.log(`  NVIDIA API Key:      \x1b[32mConfigured (${res.setupResult.nvidia.maskedKey})\x1b[0m`);
      }

      console.log(`\nNext Commands:`);
      console.log(`  \x1b[36mvva status\x1b[0m             Inspect repository & environment health`);
      console.log(`  \x1b[36mvva docs --incremental\x1b[0m Generate continuous documentation with visual charts`);
      console.log(`  \x1b[36mvva watch\x1b[0m              Monitor repository in real time\n`);
      process.exit(0);
    }

    if (command === 'docs') {
      const full = args.includes('--full');
      const incremental = args.includes('--incremental') || !full;
      const dryRun = args.includes('--dry-run');

      const formatIdx = args.indexOf('--format');
      const format = formatIdx !== -1 ? args[formatIdx + 1] : 'all';

      const purposeIdx = args.indexOf('--purpose');
      const purpose = purposeIdx !== -1 ? args[purposeIdx + 1] : 'technical';

      console.log(`\x1b[36m[VVA Continuous Docs] Initiating ${full ? 'FULL' : 'INCREMENTAL'} project documentation...\x1b[0m`);
      console.log(`  Target Purpose: ${purpose} | Formats: ${format} | Dry-run: ${dryRun}`);

      const res = await docsCommand({
        full,
        incremental,
        format,
        purpose,
        dryRun
      });

      if (res.dryRun) {
        console.log(`\n\x1b[32m✓ Continuous Docs Dry-Run Succeeded!\x1b[0m`);
        console.log(`  Commits in History:    ${res.totalCommits}`);
        console.log(`  Visual Evidence Found: ${res.visualEvidenceCount}`);
        console.log(`  Charts Generated:      ${res.chartsDir}`);
        console.log(`  History Stored At:     ${res.historyFilePath}`);
        process.exit(0);
      }

      console.log(`\n\x1b[32m══════════════════════════════════════════════════════════════════════\x1b[0m`);
      console.log(`\x1b[32m  ✓ CONTINUOUS DOCUMENTATION RELEASE CREATED (v${res.version})\x1b[0m`);
      console.log(`\x1b[32m══════════════════════════════════════════════════════════════════════\x1b[0m`);
      console.log(`  Repository:            ${res.repository}`);
      console.log(`  Strategy:              ${res.strategy.toUpperCase()}`);
      console.log(`  Purpose:               ${res.purpose}`);
      console.log(`  Total Commits Tracked: ${res.totalCommits} (${res.newCommitsAnalyzed} newly analyzed)`);
      console.log(`  Visual Evidence Items: ${res.visualEvidenceCount}`);
      if (res.backedUpFilesCount > 0) {
        console.log(`  Backups Created:       ${res.backedUpFilesCount} previous document(s) backed up safely`);
      }
      console.log(`\n\x1b[32mGenerated Visual Artifacts (with embedded charts & diagrams):\x1b[0m`);
      for (const f of res.generatedFiles) {
        console.log(`  → ${f.filename} (${(f.sizeBytes / 1024).toFixed(1)} KB) in ${f.path}`);
      }
      console.log('');
      process.exit(0);
    }

    if (command === 'status') {
      const res = await statusCommand();
      if (!res.isGitRepo) {
        console.error(`\x1b[31mError: ${res.message}\x1b[0m`);
        process.exit(1);
      }

      console.log('\n\x1b[36m╔═══════════════════════════════════════════════════════════════════╗');
      console.log('║               VVA Continuous System & Project Status              ║');
      console.log('╚═══════════════════════════════════════════════════════════════════╝\x1b[0m');
      
      console.log(`\x1b[1mOperating System:\x1b[0m      ${res.system.os.name} (${res.system.os.platform} ${res.system.os.arch})`);
      console.log(`\x1b[1mNode.js Runtime:\x1b[0m       ${res.system.node.version} (npm ${res.system.npm.version})`);
      console.log(`\x1b[1mRepository Name:\x1b[0m       ${res.repositoryName} (${res.repositoryPath})`);
      console.log(`\x1b[1mCurrent Branch:\x1b[0m        ${res.branch}`);

      if (res.latestCommit) {
        console.log(`\x1b[1mHEAD Commit:\x1b[0m           ${res.latestCommit.shortHash} — "${res.latestCommit.message}"`);
        console.log(`\x1b[1mCommit Author:\x1b[0m         ${res.latestCommit.author} <${res.latestCommit.email}>`);
        console.log(`\x1b[1mCommit Date:\x1b[0m           ${res.latestCommit.date}`);
      } else {
        console.log(`\x1b[1mHEAD Commit:\x1b[0m           No commits found (empty repo)`);
      }

      console.log(`\x1b[1mWorking Tree:\x1b[0m          ${res.uncommittedCount === 0 ? '\x1b[32mClean (0 uncommitted changes)\x1b[0m' : `\x1b[33m${res.uncommittedCount} uncommitted change(s)\x1b[0m`}`);
      console.log(`\x1b[1mVVA Environment:\x1b[0m       ${res.isInitialized ? '\x1b[32m✓ Initialized (.vva/)\x1b[0m' : '\x1b[33m! Not initialized (run vva init)\x1b[0m'}`);
      
      console.log('\x1b[36m── Project Intelligence & Documentation History ───────────────────\x1b[0m');
      console.log(`\x1b[1mTracked Commits:\x1b[0m       ${res.history.totalCommits} commits (${res.history.contributorsCount} contributors)`);
      console.log(`\x1b[1mVisual Evidence:\x1b[0m       ${res.documentation.visualAssetsCount} total assets (${res.documentation.screenshotsCount} screenshots, ${res.documentation.chartsCount} charts)`);
      if (res.documentation.latestRelease) {
        console.log(`\x1b[1mLatest Release:\x1b[0m        v${res.documentation.latestRelease.version} (${res.documentation.latestRelease.strategy}) at ${res.documentation.latestRelease.timestamp.slice(0, 16)}`);
      } else {
        console.log(`\x1b[1mLatest Release:\x1b[0m        No documentation releases generated yet (run vva docs)`);
      }

      console.log('\x1b[36m── Engines & AI Connectivity ──────────────────────────────────────\x1b[0m');
      if (res.python.available) {
        const venvTag = res.python.isVenv ? '\x1b[32m[Dedicated .venv]\x1b[0m' : '\x1b[33m[System Python]\x1b[0m';
        console.log(`\x1b[1mPython Runtime:\x1b[0m        ${res.python.version} ${venvTag}`);
        console.log(`\x1b[1mPython Executable:\x1b[0m     ${res.python.binary}`);
        console.log(`\x1b[1mPython Packages:\x1b[0m       ${res.python.packagesReady ? '\x1b[32m✓ Ready (openai, reportlab, docx, pptx, matplotlib)\x1b[0m' : '\x1b[33m! Missing packages (run vva init)\x1b[0m'}`);
      } else {
        console.log(`\x1b[1mPython Runtime:\x1b[0m        \x1b[31mNot found (run vva init)\x1b[0m`);
      }

      if (res.nvidia.isConfigured) {
        console.log(`\x1b[1mNVIDIA API Key:\x1b[0m        \x1b[32m✓ Configured (${res.nvidia.maskedKey}) via ${res.nvidia.source}\x1b[0m`);
      } else {
        console.log(`\x1b[1mNVIDIA API Key:\x1b[0m        \x1b[33m! Missing (copy .env.example to .env to enable AI reports)\x1b[0m`);
      }

      console.log('\x1b[36m───────────────────────────────────────────────────────────────────\x1b[0m\n');
      process.exit(0);
    }

    if (command === 'report') {
      const commitIndex = args.indexOf('--commit');
      const targetCommit = commitIndex !== -1 ? args[commitIndex + 1] : 'HEAD';

      const formatIndex = args.indexOf('--format');
      const format = formatIndex !== -1 ? args[formatIndex + 1] : 'all';

      const dryRun = args.includes('--dry-run');

      console.log(`\x1b[36m[Stage 1/4] Git Data Collector: Inspecting commit ${targetCommit}...\x1b[0m`);
      const res = await reportCommand({ commit: targetCommit, format, dryRun });

      if (res.dryRun) {
        console.log(`\x1b[32m✓ Dry-run completed. Saved project data to ${res.projectDataPath}\x1b[0m`);
        console.log(`  Analyzed commit: ${res.analyzedCommit.slice(0, 7)} (${res.changedFiles} files)`);
        console.log(`  To generate complete reports, configure your NVIDIA API key and run 'vva report'.`);
        process.exit(0);
      }

      console.log(`\x1b[32m✓ Pipeline Execution Succeeded!\x1b[0m`);
      console.log(`Repository:      ${res.repository}`);
      console.log(`Commit:          ${res.analyzedCommit.slice(0, 7)} ("${res.commitMessage}")`);
      console.log(`Feature Analyzed: "${res.aiTitle}"`);
      console.log(`Project Data:    ${res.projectDataPath}`);
      console.log(`AI Response:     ${res.aiOutputPath}`);
      console.log(`\n\x1b[32mGenerated Artifacts:\x1b[0m`);
      for (const f of res.generatedFiles) {
        console.log(`  → ${f.filename} (${(f.sizeBytes / 1024).toFixed(1)} KB) in ${f.path}`);
      }
      process.exit(0);
    }

    if (command === 'watch') {
      const modeIdx = args.indexOf('--mode');
      const mode = modeIdx !== -1 ? args[modeIdx + 1] : 'commits';

      const intervalIdx = args.indexOf('--interval');
      const intervalMs = intervalIdx !== -1 ? parseInt(args[intervalIdx + 1], 10) : undefined;

      await watchCommand({ mode, intervalMs });
      return;
    }

    console.error(`\x1b[31mUnknown command: '${command}'. Type 'vva help' for usage.\x1b[0m`);
    process.exit(1);
  } catch (error) {
    console.error(`\x1b[31mError: ${error.message}\x1b[0m`);
    process.exit(1);
  }
}

main();
