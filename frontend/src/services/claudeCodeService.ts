/**
 * Claude Code Service - API client for Claude Code operations
 */

const API_BASE_URL = 'http://localhost:8000';

// Types matching the backend models
export interface ClaudeCodeRequest {
  operation: ClaudeCodeOperation;
  github_context?: GitHubContext;
  requirements: string;
  programming_language: ProgrammingLanguage;
  framework?: Framework;
  coding_standards?: CodingStandards;
  include_tests: boolean;
  include_docs: boolean;
  creativity_level: number;
  max_files: number;
}

export interface GitHubContext {
  repository: string;
  issue?: Record<string, unknown>;
  pull_request?: Record<string, unknown>;
  files: Array<Record<string, unknown>>;
  branches: string[];
  user?: Record<string, unknown>;
  base_branch: string;
}

export interface CodingStandards {
  style_guide?: string;
  max_line_length: number;
  use_semicolons?: boolean;
  indent_size: number;
  use_tabs: boolean;
  enforce_types: boolean;
  require_docstrings: boolean;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  description?: string;
  file_type: string;
}

export interface CodeGenerationResult {
  files: GeneratedFile[];
  tests: GeneratedFile[];
  documentation?: string;
  commit_message: string;
  pr_description: string;
  implementation_notes: string[];
  dependencies: string[];
}

export interface ReviewComment {
  line_number?: number;
  file_path?: string;
  message: string;
  severity: string;
  suggestion?: string;
  category: string;
}

export interface SecurityIssue {
  file_path: string;
  line_number: number;
  issue_type: string;
  description: string;
  severity: string;
  fix_suggestion: string;
}

export interface CodeSuggestion {
  file_path: string;
  original_code: string;
  suggested_code: string;
  reason: string;
  impact: string;
}

export interface CodeReviewResult {
  overall_score: number;
  decision: string;
  summary: string;
  comments: ReviewComment[];
  security_issues: SecurityIssue[];
  suggestions: CodeSuggestion[];
  test_coverage_assessment?: string;
  performance_notes: string[];
}

export interface RepositoryAnalysis {
  architecture_score: number;
  code_quality_score: number;
  maintainability_score: number;
  security_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  technical_debt: string[];
  suggested_refactors: string[];
}

export interface GitHubAction {
  type: string;
  parameters: Record<string, unknown>;
  description: string;
}

export interface ClaudeCodeResponse {
  success: boolean;
  message: string;
  operation: string;
  code_generation?: CodeGenerationResult;
  code_review?: CodeReviewResult;
  repository_analysis?: RepositoryAnalysis;
  github_actions: GitHubAction[];
  execution_time_ms?: number;
  tokens_used?: number;
}

export interface ClaudeCodeExecutionRequest {
  node_id: string;
  request: ClaudeCodeRequest;
}

export interface ClaudeCodeStatusResponse {
  success: boolean;
  message: string;
  node_id: string;
  is_ready: boolean;
  supported_languages: string[];
  supported_frameworks: string[];
  available_operations: string[];
}

export interface OperationInfo {
  name: string;
  description: string;
  category: string;
}

export interface LanguageInfo {
  name: string;
  display_name: string;
  extension: string;
}

export interface FrameworkInfo {
  name: string;
  display_name: string;
  language: string;
}

// Enums
export enum ClaudeCodeOperation {
  GENERATE_CODE = 'generate_code',
  REVIEW_CODE = 'review_code',
  ANALYZE_REPOSITORY = 'analyze_repository',
  CREATE_TESTS = 'create_tests',
  GENERATE_DOCS = 'generate_docs',
  FIX_BUGS = 'fix_bugs',
  REFACTOR_CODE = 'refactor_code',
  OPTIMIZE_PERFORMANCE = 'optimize_performance'
}

export enum ProgrammingLanguage {
  PYTHON = 'python',
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  JAVA = 'java',
  GO = 'go',
  RUST = 'rust',
  CPP = 'cpp',
  CSHARP = 'csharp',
  PHP = 'php',
  RUBY = 'ruby',
  SWIFT = 'swift',
  KOTLIN = 'kotlin'
}

export enum Framework {
  REACT = 'react',
  VUE = 'vue',
  ANGULAR = 'angular',
  NEXTJS = 'nextjs',
  DJANGO = 'django',
  FASTAPI = 'fastapi',
  FLASK = 'flask',
  EXPRESS = 'express',
  SPRING = 'spring',
  LARAVEL = 'laravel',
  RAILS = 'rails'
}

export class ClaudeCodeService {
  private baseUrl = '/api/claude-code';

  /**
   * Execute a Claude Code operation
   */
  async executeOperation(request: ClaudeCodeExecutionRequest): Promise<ClaudeCodeResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to execute Claude Code operation:', error);
      throw error;
    }
  }

  /**
   * Get status of Claude Code node
   */
  async getStatus(nodeId: string): Promise<ClaudeCodeStatusResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseUrl}/status/${nodeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get Claude Code status:', error);
      throw error;
    }
  }

  /**
   * Get available operations
   */
  async getAvailableOperations(): Promise<{ success: boolean; operations: OperationInfo[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseUrl}/operations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get available operations:', error);
      throw error;
    }
  }

  /**
   * Get supported programming languages
   */
  async getSupportedLanguages(): Promise<{ success: boolean; languages: LanguageInfo[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseUrl}/languages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get supported languages:', error);
      throw error;
    }
  }

  /**
   * Get supported frameworks
   */
  async getSupportedFrameworks(): Promise<{ success: boolean; frameworks: FrameworkInfo[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseUrl}/frameworks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get supported frameworks:', error);
      throw error;
    }
  }

  /**
   * Helper method to get operation categories
   */
  getOperationCategories(): string[] {
    return ['Generation', 'Analysis', 'Modification'];
  }

  /**
   * Helper method to get operation description
   */
  getOperationDescription(operation: ClaudeCodeOperation): string {
    const descriptions = {
      [ClaudeCodeOperation.GENERATE_CODE]: 'Generate new code based on requirements',
      [ClaudeCodeOperation.REVIEW_CODE]: 'Review existing code and provide feedback',
      [ClaudeCodeOperation.ANALYZE_REPOSITORY]: 'Analyze repository structure and quality',
      [ClaudeCodeOperation.CREATE_TESTS]: 'Create unit tests for existing code',
      [ClaudeCodeOperation.GENERATE_DOCS]: 'Generate documentation for code',
      [ClaudeCodeOperation.FIX_BUGS]: 'Fix bugs in existing code',
      [ClaudeCodeOperation.REFACTOR_CODE]: 'Refactor code for better structure',
      [ClaudeCodeOperation.OPTIMIZE_PERFORMANCE]: 'Optimize code for better performance'
    };
    return descriptions[operation] || 'Unknown operation';
  }

  /**
   * Helper method to get language display name
   */
  getLanguageDisplayName(language: ProgrammingLanguage): string {
    const names = {
      [ProgrammingLanguage.PYTHON]: 'Python',
      [ProgrammingLanguage.JAVASCRIPT]: 'JavaScript',
      [ProgrammingLanguage.TYPESCRIPT]: 'TypeScript',
      [ProgrammingLanguage.JAVA]: 'Java',
      [ProgrammingLanguage.GO]: 'Go',
      [ProgrammingLanguage.RUST]: 'Rust',
      [ProgrammingLanguage.CPP]: 'C++',
      [ProgrammingLanguage.CSHARP]: 'C#',
      [ProgrammingLanguage.PHP]: 'PHP',
      [ProgrammingLanguage.RUBY]: 'Ruby',
      [ProgrammingLanguage.SWIFT]: 'Swift',
      [ProgrammingLanguage.KOTLIN]: 'Kotlin'
    };
    return names[language] || language;
  }

  /**
   * Helper method to get framework display name
   */
  getFrameworkDisplayName(framework: Framework): string {
    const names = {
      [Framework.REACT]: 'React',
      [Framework.VUE]: 'Vue.js',
      [Framework.ANGULAR]: 'Angular',
      [Framework.NEXTJS]: 'Next.js',
      [Framework.DJANGO]: 'Django',
      [Framework.FASTAPI]: 'FastAPI',
      [Framework.FLASK]: 'Flask',
      [Framework.EXPRESS]: 'Express.js',
      [Framework.SPRING]: 'Spring',
      [Framework.LARAVEL]: 'Laravel',
      [Framework.RAILS]: 'Ruby on Rails'
    };
    return names[framework] || framework;
  }
}

export const claudeCodeService = new ClaudeCodeService(); 