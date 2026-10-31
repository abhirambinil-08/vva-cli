import fs from 'node:fs/promises';
import path from 'node:path';
import { getRepoRoot } from '../core/git.js';
import { collectGitData } from '../core/collector.js';
import { invokePythonModule } from '../core/python.js';

export async function reportCommand(options = {}, cwd = process.cwd()) {
  const root = await getRepoRoot(cwd);
  const vvaDir = path.join(root, '.vva');
  const outputDir = path.join(vvaDir, 'output');
  const configFile = path.join(vvaDir, 'config.json');

  // 1. Ensure .vva is initialized
  let config = {};
  try {
    const rawConfig = await fs.readFile(configFile, 'utf8');
    config = JSON.parse(rawConfig);
  } catch {
    // Auto-create directory structure if running in uninitialized repo
    await fs.mkdir(outputDir, { recursive: true });
    config = { defaultFormat: 'all', maxDiffSizeBytes: 1048576 };
  }

  const targetCommit = options.commit || 'HEAD';
  const format = options.format || config.defaultFormat || 'all';

  // 2. Stage 1/4: Git Data Collection
  const projectData = await collectGitData(targetCommit, root, {
    maxDiffSizeBytes: config.maxDiffSizeBytes
  });

  const projectDataPath = path.join(outputDir, 'project-data.json');
  await fs.writeFile(projectDataPath, JSON.stringify(projectData, null, 2), 'utf8');

  if (options.dryRun) {
    return {
      dryRun: true,
      projectDataPath,
      analyzedCommit: projectData.analyzedCommit,
      changedFiles: projectData.changedFiles.length
    };
  }

  // 3. Stage 2/4: Invoke Python AI Engine
  const aiOutputPath = path.join(outputDir, 'ai-response.json');
  const aiArgs = ['--input', projectDataPath, '--output', aiOutputPath];
  
  let activeModel = config.aiModel;
  if (!activeModel || activeModel === 'meta/llama-3.1-70b-instruct') {
    activeModel = 'openai/gpt-oss-20b';
    try {
      config.aiModel = activeModel;
      await fs.writeFile(configFile, JSON.stringify(config, null, 2), 'utf8');
    } catch {
      //
    }
  }
  aiArgs.push('--model', activeModel);
  await invokePythonModule('ai/ai_engine.py', aiArgs, root);

  // Validate that ai-response.json was created and is valid JSON
  let aiData;
  try {
    const rawAi = await fs.readFile(aiOutputPath, 'utf8');
    aiData = JSON.parse(rawAi);
    if (!aiData.title || !aiData.summary || !Array.isArray(aiData.technicalChanges)) {
      throw new Error('AI response JSON is missing required fields.');
    }
  } catch (err) {
    throw new Error(`AI Engine verification failed: ${err.message}`);
  }

  // 4. Generate High-Resolution Visual Charts & Diagrams
  const chartsDir = path.join(outputDir, 'charts');
  await fs.mkdir(chartsDir, { recursive: true });
  try {
    await invokePythonModule(
      'document_engine/chart_generator.py',
      ['--input', projectDataPath, '--output-dir', chartsDir],
      root
    );
  } catch (err) {
    process.stderr.write(`[VVA Notice] Visual chart rendering skipped: ${err.message}\n`);
  }

  // 5. Stage 3/4: Invoke Python Document Generation Engine
  const docResultRaw = await invokePythonModule(
    'document_engine/document_engine.py',
    [
      '--ai-input', aiOutputPath,
      '--project-input', projectDataPath,
      '--output-dir', outputDir,
      '--charts-dir', chartsDir,
      '--format', format,
      '--mode', 'commit'
    ],
    root
  );

  let docResults = [];
  try {
    docResults = JSON.parse(docResultRaw);
  } catch {
    // If output contained non-JSON debug logs, check disk files
  }

  // 5. Verify generated files on disk
  const shortHash = (projectData.analyzedCommit || 'commit').slice(0, 7);
  const repoName = projectData.repository || 'vva';

  let verifiedFiles = [];
  if (Array.isArray(docResults) && docResults.length > 0) {
    for (const item of docResults) {
      if (item && item.path) {
        try {
          const stat = await fs.stat(item.path);
          verifiedFiles.push({
            path: item.path,
            filename: item.filename || path.basename(item.path),
            sizeBytes: stat.size
          });
        } catch {
          //
        }
      }
    }
  }

  // Fallback to checking disk candidates if JSON parse didn't yield verified files
  if (verifiedFiles.length === 0) {
    const safeRepo = repoName.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'vva';
    const candidatePatterns = [
      `${safeRepo}_${shortHash}_report.pdf`,
      `${safeRepo}_${shortHash}_synopsis.docx`,
      `${safeRepo}_${shortHash}_presentation.pptx`,
      `${safeRepo}_continuous_report.pdf`,
      `${safeRepo}_continuous_synopsis.docx`,
      `${safeRepo}_continuous_presentation.pptx`,
      `${repoName}_${shortHash}_report.pdf`,
      `${repoName}_${shortHash}_synopsis.docx`,
      `${repoName}_${shortHash}_presentation.pptx`,
    ];

    for (const fname of candidatePatterns) {
      const fullPath = path.join(outputDir, fname);
      try {
        const stat = await fs.stat(fullPath);
        if (!verifiedFiles.some(vf => vf.path === fullPath)) {
          verifiedFiles.push({
            path: fullPath,
            filename: fname,
            sizeBytes: stat.size
          });
        }
      } catch {
        //
      }
    }
  }

  return {
    success: true,
    repository: projectData.repository,
    analyzedCommit: projectData.analyzedCommit,
    commitMessage: projectData.commitMessage,
    projectDataPath,
    aiOutputPath,
    aiTitle: aiData.title,
    generatedFiles: verifiedFiles
  };
}
