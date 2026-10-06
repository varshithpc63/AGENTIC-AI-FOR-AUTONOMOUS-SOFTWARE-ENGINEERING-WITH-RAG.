export type AgentType = 
  | 'requirement'
  | 'design'
  | 'rag'
  | 'code'
  | 'execution'
  | 'testing'
  | 'debug'
  | 'completed';

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'skipped';

export interface AgentLogEntry {
  id: string;
  agent: AgentType;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  details?: unknown;
}

export interface FeatureSpec {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface RequirementSpec {
  appTitle: string;
  summary: string;
  userPersonas: string[];
  coreFeatures: FeatureSpec[];
  inputs: string[];
  outputs: string[];
  constraints: string[];
  acceptanceCriteria: string[];
}

export interface ComponentSpec {
  name: string;
  type: 'layout' | 'table' | 'form' | 'modal' | 'stat' | 'filter';
  responsibility: string;
}

export interface DataFieldSpec {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface DataModelSpec {
  name: string;
  fields: DataFieldSpec[];
}

export interface SystemDesignSpec {
  architectureOverview: string;
  components: ComponentSpec[];
  dataModels: DataModelSpec[];
  stateStrategy: string;
  userFlow: string[];
  colorTheme: string;
}

export interface RagDoc {
  id: string;
  title: string;
  sourceFile: string;
  relevanceScore: number;
  summary: string;
  content: string;
}

export interface GeneratedFile {
  path: string;
  language: 'typescript' | 'html' | 'css' | 'json' | 'markdown';
  content: string;
  description: string;
}

export interface TestCaseResult {
  id: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  expected?: string;
  actual?: string;
}

export interface TestReport {
  totalTests: number;
  passed: number;
  failed: number;
  durationMs: number;
  tests: TestCaseResult[];
  buildError?: string;
  runtimeError?: string;
}

export interface DebugAttempt {
  attemptNumber: number;
  timestamp: string;
  targetFile: string;
  issueIdentified: string;
  fixApplied: string;
  resolved: boolean;
  preTestReport?: { passed: number; failed: number };
  postTestReport?: { passed: number; failed: number };
}

export interface SoftwareProject {
  id: string;
  userPrompt: string;
  requirements: RequirementSpec | null;
  design: SystemDesignSpec | null;
  ragKnowledge: RagDoc[];
  files: GeneratedFile[];
  testReport: TestReport | null;
  debugAttempts: DebugAttempt[];
  previewHtml?: string;
  previewUrl?: string;
  buildStatus?: 'idle' | 'building' | 'success' | 'failed';
  runtimeStatus?: 'idle' | 'running' | 'stopped' | 'failed';
  buildError?: string;
  runtimeError?: string;
  projectType?: 'react' | 'static-html' | 'node';
  status: 'idle' | 'generating' | 'completed' | 'failed';
  activeAgent: AgentType | null;
  agentProgress: Record<AgentType, { status: AgentStatus; message?: string }>;
  logs: AgentLogEntry[];
  createdAt: string;
  completedAt?: string;
}

export interface SamplePrompt {
  id: string;
  title: string;
  prompt: string;
  tag: string;
}

export interface KbDoc {
  filename: string;
  title: string;
  content: string;
  sizeBytes: number;
}

export interface ActivityStep {
  agent: AgentType;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  details?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'system';
  actionType?: 'generate' | 'modify';
  text: string;
  timestamp: string;
  steps?: ActivityStep[];
  isComplete?: boolean;
}

export interface SavedApp {
  project: SoftwareProject;
  messages: ChatMessage[];
  lastUpdated: string;
}

