const API_BASE_URL = 'http://localhost:8000';

export interface ClaudeGithubConfig {
  anthropic_api_key?: string;
  github_pat?: string;
  github_username?: string;
  repository_name?: string;
  clone_directory?: string;
  github_api_base?: string;
}

export interface ClaudeGithubCommand {
  command: string;
  use_claude_code?: boolean;
}

export interface ClaudeGithubResponse {
  success: boolean;
  result?: string;
  error?: string;
  execution_time?: number;
  command_type: 'claude_api' | 'claude_code';
}

export interface ClaudeGithubStatus {
  success: boolean;
  status: string;
  config?: {
    github_username: string;
    repository_name: string;
    clone_directory: string;
    clone_dir_exists: boolean;
    is_git_repo: boolean;
    has_anthropic_key: boolean;
    has_github_pat: boolean;
  };
  error?: string;
}

export interface AvailableCommands {
  claude_api_commands: Array<{ command: string; description: string }>;
  claude_code_commands: Array<{ command: string; description: string }>;
  quick_actions: Array<{ action: string; description: string }>;
}

class ClaudeGithubService {
  async configure(config: ClaudeGithubConfig): Promise<{ success: boolean; message: string; config?: any }> {
    try {
      console.log('🔧 Configuring Claude GitHub MCP...', config);
      
      const response = await fetch(`${API_BASE_URL}/api/claude-github/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Claude GitHub MCP configured successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to configure Claude GitHub:', error);
      throw error;
    }
  }

  async executeCommand(command: ClaudeGithubCommand): Promise<ClaudeGithubResponse> {
    try {
      console.log('⚡ Executing Claude GitHub command:', command);
      
      const response = await fetch(`${API_BASE_URL}/api/claude-github/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Command executed successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to execute Claude GitHub command:', error);
      throw error;
    }
  }

  async getStatus(): Promise<ClaudeGithubStatus> {
    try {
      console.log('📊 Getting Claude GitHub status...');
      
      const response = await fetch(`${API_BASE_URL}/api/claude-github/status`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Status retrieved:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to get Claude GitHub status:', error);
      throw error;
    }
  }

  async executeQuickAction(action: string, repository?: string): Promise<ClaudeGithubResponse> {
    try {
      console.log('🚀 Executing quick action:', action, repository);
      
      const url = repository 
        ? `${API_BASE_URL}/api/claude-github/quick-actions/${action}?repository=${repository}`
        : `${API_BASE_URL}/api/claude-github/quick-actions/${action}`;
        
      const response = await fetch(url, { method: 'POST' });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Quick action executed:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to execute quick action:', error);
      throw error;
    }
  }

  async getAvailableCommands(): Promise<AvailableCommands> {
    try {
      console.log('📋 Getting available commands...');
      
      const response = await fetch(`${API_BASE_URL}/api/claude-github/available-commands`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Available commands retrieved');
      return result;
    } catch (error) {
      console.error('❌ Failed to get available commands:', error);
      throw error;
    }
  }
}

export const claudeGithubService = new ClaudeGithubService(); 