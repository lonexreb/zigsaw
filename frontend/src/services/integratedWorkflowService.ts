/**
 * Service for integrated code review and GitHub PR workflows
 */

const API_BASE_URL = 'http://localhost:8000';

export interface CodeReviewWorkflowRequest {
  repository: string;
  branch?: string;
  files_to_review: string[];
  review_criteria?: Record<string, unknown>;
  auto_create_pr: boolean;
  pr_title?: string;
  pr_body?: string;
  target_branch: string;
  github_credentials?: Record<string, unknown>;
}

export interface CodeReviewWorkflowResponse {
  review_id: string;
  review_result: Record<string, unknown>;
  pr_created: boolean;
  pr_number?: number;
  pr_url?: string;
  github_actions: Array<Record<string, unknown>>;
  status: 'review_completed' | 'pr_created' | 'pr_merged' | 'error';
  message: string;
}

export interface WorkflowTemplate {
  name: string;
  description: string;
  template: Partial<CodeReviewWorkflowRequest>;
}

export interface WorkflowStatus {
  workflow_id: string;
  node_id: string;
  request: CodeReviewWorkflowRequest;
  status: string;
  created_at: string;
  review_result?: Record<string, unknown>;
  pr_number?: number;
  merged_at?: string;
  error?: string;
}

export class IntegratedWorkflowService {
  private baseUrl = '/api/integrated-workflow';

  private async post<T>(url: string, data: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private async get<T>(url: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async executeCodeReviewWorkflow(
    nodeId: string,
    request: CodeReviewWorkflowRequest
  ): Promise<CodeReviewWorkflowResponse> {
    const response = await this.post<CodeReviewWorkflowResponse>(
      `${this.baseUrl}/code-review-workflow?node_id=${nodeId}`,
      request
    );
    return response;
  }

  async approveAndMergePr(
    workflowId: string,
    nodeId: string,
    repository: string,
    prNumber: number
  ): Promise<{ success: boolean; message: string; merge_data?: unknown }> {
    const response = await this.post<{ success: boolean; message: string; merge_data?: unknown }>(
      `${this.baseUrl}/approve-and-merge/${workflowId}?node_id=${nodeId}&repository=${repository}&pr_number=${prNumber}`,
      {}
    );
    return response;
  }

  async getWorkflowStatus(workflowId: string): Promise<WorkflowStatus> {
    const response = await this.get<WorkflowStatus>(
      `${this.baseUrl}/workflow-status/${workflowId}`
    );
    return response;
  }

  async listWorkflows(nodeId?: string): Promise<{ workflows: WorkflowStatus[] }> {
    const url = nodeId 
      ? `${this.baseUrl}/workflows?node_id=${nodeId}`
      : `${this.baseUrl}/workflows`;
    
    const response = await this.get<{ workflows: WorkflowStatus[] }>(url);
    return response;
  }

  async getWorkflowTemplates(): Promise<{ templates: WorkflowTemplate[] }> {
    const response = await this.get<{ templates: WorkflowTemplate[] }>(
      `${this.baseUrl}/workflow-templates`
    );
    return response;
  }

  // Helper methods
  getStatusIcon(status: string): string {
    switch (status) {
      case 'starting': return '🔄';
      case 'review_completed': return '✅';
      case 'pr_created': return '📝';
      case 'pr_merged': return '🎉';
      case 'error': return '❌';
      default: return '⏳';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'starting': return 'text-blue-500';
      case 'review_completed': return 'text-green-500';
      case 'pr_created': return 'text-purple-500';
      case 'pr_merged': return 'text-emerald-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  }

  formatWorkflowMessage(workflow: WorkflowStatus): string {
    const { status, review_result, pr_number } = workflow;
    
    if (status === 'error') {
      return `Workflow failed: ${workflow.error || 'Unknown error'}`;
    }
    
    if (status === 'pr_merged' && pr_number) {
      return `✅ PR #${pr_number} merged successfully`;
    }
    
    if (status === 'pr_created' && pr_number) {
      return `📝 PR #${pr_number} created and ready for review`;
    }
    
    if (status === 'review_completed' && review_result) {
      const review = review_result as Record<string, unknown>;
      const codeReview = review.code_review as Record<string, unknown> | undefined;
      const score = codeReview?.overall_score;
      const decision = codeReview?.decision;
      
      if (score && decision) {
        return `Code review completed: ${score}/10 (${decision})`;
      }
    }
    
    return `Workflow status: ${status}`;
  }

  // Validation helpers
  validateRepository(repository: string): boolean {
    // Basic validation for GitHub repository format (owner/repo)
    const repoPattern = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
    return repoPattern.test(repository);
  }

  validateBranchName(branch: string): boolean {
    // Basic validation for Git branch names
    const branchPattern = /^[a-zA-Z0-9_.-]+$/;
    return branchPattern.test(branch) && !branch.includes('..');
  }

  validateFilePaths(paths: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    paths.forEach((path, index) => {
      if (!path.trim()) {
        errors.push(`File path ${index + 1} is empty`);
      } else if (path.includes('..')) {
        errors.push(`File path ${index + 1} contains invalid characters (..)`);
      } else if (path.startsWith('/')) {
        errors.push(`File path ${index + 1} should be relative (no leading slash)`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const integratedWorkflowService = new IntegratedWorkflowService(); 