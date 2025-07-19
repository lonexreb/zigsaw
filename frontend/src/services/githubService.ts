/**
 * GitHub service for frontend-backend communication
 */

const API_BASE_URL = 'http://localhost:8000';

export interface GitHubCredentials {
  auth_type: 'personal_access_token' | 'github_app' | 'oauth';
  token?: string;
  username?: string;
  app_id?: string;
  private_key?: string;
  installation_id?: string;
  base_url?: string;
}

export interface GitHubStats {
  repositories_count: number;
  total_stars: number;
  total_forks: number;
  open_issues: number;
  open_pull_requests: number;
  workflow_runs_count: number;
}

export interface GitHubConnectionResponse {
  success: boolean;
  message: string;
  node_id: string;
  user_info?: {
    login: string;
    name: string;
    email: string;
    avatar_url: string;
    public_repos: number;
    followers: number;
    following: number;
  };
  rate_limit?: {
    limit: number;
    remaining: number;
    reset: number;
    used: number;
  };
}

export interface GitHubStatusResponse {
  success: boolean;
  message: string;
  node_id: string;
  is_connected: boolean;
  stats?: GitHubStats;
  user_info?: {
    login: string;
    name: string;
    email: string;
    avatar_url: string;
    public_repos: number;
    followers: number;
    following: number;
  };
  rate_limit?: {
    limit: number;
    remaining: number;
    reset: number;
    used: number;
  };
}

export interface GitHubOperationResponse {
  success: boolean;
  message: string;
  operation: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  rate_limit?: {
    limit: number;
    remaining: number;
    reset: number;
    used: number;
  };
}

export interface GitHubOperation {
  name: string;
  description: string;
  parameters: string[];
}

export interface GitHubOperationCategory {
  category: string;
  operations: GitHubOperation[];
}

export interface GitHubAuthType {
  type: string;
  name: string;
  description: string;
  required_fields: string[];
  optional_fields: string[];
}

class GitHubService {
  /**
   * Connect to GitHub API
   */
  async connect(nodeId: string, credentials: GitHubCredentials): Promise<GitHubConnectionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/github/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          node_id: nodeId,
          credentials: credentials
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to connect to GitHub');
      }

      return await response.json();
    } catch (error) {
      console.error('🔴 GitHub connect error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from GitHub API
   */
  async disconnect(nodeId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/github/disconnect/${nodeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to disconnect from GitHub');
      }

      return await response.json();
    } catch (error) {
      console.error('🔴 GitHub disconnect error:', error);
      throw error;
    }
  }

  /**
   * Get GitHub connection status
   */
  async getStatus(nodeId: string): Promise<GitHubStatusResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/github/status/${nodeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get GitHub status');
      }

      return await response.json();
    } catch (error) {
      console.error('🔴 GitHub status error:', error);
      throw error;
    }
  }

  /**
   * Execute a GitHub operation
   */
  async executeOperation(
    nodeId: string,
    operation: string,
    parameters: Record<string, unknown> = {},
    repository?: string
  ): Promise<GitHubOperationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/github/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          node_id: nodeId,
          operation: operation,
          parameters: parameters,
          repository: repository
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to execute GitHub operation');
      }

      return await response.json();
    } catch (error) {
      console.error('🔴 GitHub operation error:', error);
      throw error;
    }
  }

  /**
   * Get available GitHub operations
   */
  async getAvailableOperations(): Promise<GitHubOperationCategory[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/github/operations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get GitHub operations');
      }

      const result = await response.json();
      return result.operations;
    } catch (error) {
      console.error('🔴 GitHub operations error:', error);
      throw error;
    }
  }

  /**
   * Get available authentication types
   */
  async getAuthTypes(): Promise<GitHubAuthType[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/github/auth-types`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get GitHub auth types');
      }

      const result = await response.json();
      return result.auth_types;
    } catch (error) {
      console.error('🔴 GitHub auth types error:', error);
      throw error;
    }
  }

  /**
   * Get rate limit information
   */
  async getRateLimit(nodeId: string): Promise<{ success: boolean; node_id: string; rate_limit: Record<string, unknown> }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/github/rate-limit/${nodeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get GitHub rate limit');
      }

      return await response.json();
    } catch (error) {
      console.error('🔴 GitHub rate limit error:', error);
      throw error;
    }
  }
}

export const githubService = new GitHubService(); 