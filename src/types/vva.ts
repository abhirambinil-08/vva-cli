export type FileStatus = 'A' | 'M' | 'D';

export interface ChangedFile {
  file: string;
  status: FileStatus; // A = Added, M = Modified, D = Deleted
  additions: number;
  deletions: number;
  content: string; // Committed file content or pre-deletion content
  diff: string; // The specific patch
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  parentHash?: string;
  author: string;
  email: string;
  date: string;
  message: string;
  branch: string;
  changedFiles: ChangedFile[];
  diffSummary: {
    filesChanged: number;
    insertions: number;
    deletions: number;
  };
}

export interface Repository {
  id: string;
  name: string;
  description: string;
  path: string;
  currentBranch: string;
  branches: string[];
  commits: GitCommit[];
}

export interface ProjectDataJSON {
  vvaVersion: string;
  timestamp: string;
  repository: string;
  repositoryPath: string;
  branch: string;
  analyzedCommit: string;
  parentCommit: string | null;
  author: {
    name: string;
    email: string;
    date: string;
  };
  commitMessage: string;
  summary: {
    filesChanged: number;
    insertions: number;
    deletions: number;
  };
  changedFiles: {
    file: string;
    status: FileStatus;
    additions: number;
    deletions: number;
    content: string;
  }[];
  diff: string;
}

export interface AIStructuredResponse {
  title: string;
  summary: string;
  purposeAndRationale: string;
  changedComponents: string[];
  technicalChanges: string[];
  technologies: string[];
  architecturalImpact: string;
  observationsAndLimitations: string[];
  confidenceScore: number;
  model: string;
  processingTimeMs: number;
}

export interface GeneratedDocument {
  id: string;
  type: 'pdf' | 'docx' | 'pptx';
  filename: string;
  title: string;
  commitHash: string;
  repository: string;
  generatedAt: string;
  fileSizeBytes: number;
  content: any;
}

export interface VVAConfig {
  version: string;
  defaultFormat: 'pdf' | 'docx' | 'pptx' | 'all';
  outputDir: string;
  aiProvider: 'nvidia' | 'gemini';
  aiModel: string;
  maxDiffSizeBytes: number;
  includePreviousVersionOnDelete: boolean;
  team: {
    leadOrchestration: string;
    aiEngine: string;
    documentEngine: string;
  };
}
