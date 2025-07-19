/**
 * Service for managing tool marketplace, configurations, and integrations
 */

import { Tool, ToolParameter, ToolCategory, ToolPreset, ToolExecution } from '../types/tools';

const API_BASE_URL = 'http://localhost:8000';

export interface ToolValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime?: number;
  cost?: number;
}

export interface ToolSearchFilters {
  category?: string;
  provider?: string;
  search?: string;
  featured?: boolean;
  installed?: boolean;
}

export interface ToolMarketplaceResponse {
  tools: Tool[];
  total: number;
  categories: ToolCategory[];
  featured: Tool[];
}

class ToolMarketplaceService {
  private cache = new Map<string, any>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} ${error}`);
    }

    return response.json();
  }

  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}${params ? JSON.stringify(params) : ''}`;
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  // Tool Discovery and Marketplace
  async getAvailableTools(filters: ToolSearchFilters = {}): Promise<ToolMarketplaceResponse> {
    const cacheKey = this.getCacheKey('/tools/marketplace', filters);
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await this.request(`/tools/marketplace?${queryParams}`);
      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Failed to fetch available tools:', error);
      // Return fallback data
      return {
        tools: this.getFallbackTools(),
        total: this.getFallbackTools().length,
        categories: this.getFallbackCategories(),
        featured: this.getFallbackTools().slice(0, 3),
      };
    }
  }

  async getToolDetails(toolId: string): Promise<Tool> {
    const cacheKey = this.getCacheKey(`/tools/${toolId}`);
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await this.request(`/tools/${toolId}`);
      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error(`Failed to fetch tool details for ${toolId}:`, error);
      throw error;
    }
  }

  async getToolCategories(): Promise<ToolCategory[]> {
    const cacheKey = this.getCacheKey('/tools/categories');
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await this.request('/tools/categories');
      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Failed to fetch tool categories:', error);
      return this.getFallbackCategories();
    }
  }

  // Tool Installation and Management
  async installTool(toolId: string, config?: Record<string, any>): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.request('/tools/install', {
        method: 'POST',
        body: JSON.stringify({ toolId, config }),
      });
      
      // Clear cache to force refresh
      this.cache.clear();
      
      return response;
    } catch (error) {
      console.error(`Failed to install tool ${toolId}:`, error);
      throw error;
    }
  }

  async uninstallTool(toolId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.request(`/tools/${toolId}/uninstall`, {
        method: 'DELETE',
      });
      
      // Clear cache to force refresh
      this.cache.clear();
      
      return response;
    } catch (error) {
      console.error(`Failed to uninstall tool ${toolId}:`, error);
      throw error;
    }
  }

  async getInstalledTools(): Promise<Tool[]> {
    const cacheKey = this.getCacheKey('/tools/installed');
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await this.request('/tools/installed');
      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Failed to fetch installed tools:', error);
      return [];
    }
  }

  // Tool Configuration and Validation
  async validateToolConfig(toolId: string, config: Record<string, any>): Promise<ToolValidationError[]> {
    try {
      const response = await this.request('/tools/validate', {
        method: 'POST',
        body: JSON.stringify({ toolId, config }),
      });
      
      return response.errors || [];
    } catch (error) {
      console.error(`Failed to validate tool config for ${toolId}:`, error);
      return [{
        field: 'general',
        message: 'Configuration validation failed',
        code: 'VALIDATION_ERROR'
      }];
    }
  }

  async updateToolConfig(toolId: string, config: Record<string, any>): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.request(`/tools/${toolId}/config`, {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      
      // Clear cache to force refresh
      this.cache.clear();
      
      return response;
    } catch (error) {
      console.error(`Failed to update tool config for ${toolId}:`, error);
      throw error;
    }
  }

  // Tool Execution
  async executeTool(toolId: string, parameters: Record<string, any>, context?: any): Promise<ToolExecutionResult> {
    try {
      const response = await this.request('/tools/execute', {
        method: 'POST',
        body: JSON.stringify({ toolId, parameters, context }),
      });
      
      return response;
    } catch (error) {
      console.error(`Failed to execute tool ${toolId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
      };
    }
  }

  async getToolExecutionHistory(toolId: string, limit = 10): Promise<ToolExecution[]> {
    try {
      const response = await this.request(`/tools/${toolId}/executions?limit=${limit}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch execution history for ${toolId}:`, error);
      return [];
    }
  }

  // Tool Presets
  async getToolPresets(): Promise<ToolPreset[]> {
    const cacheKey = this.getCacheKey('/tools/presets');
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await this.request('/tools/presets');
      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Failed to fetch tool presets:', error);
      return this.getFallbackPresets();
    }
  }

  async createToolPreset(preset: Omit<ToolPreset, 'id'>): Promise<ToolPreset> {
    try {
      const response = await this.request('/tools/presets', {
        method: 'POST',
        body: JSON.stringify(preset),
      });
      
      // Clear cache to force refresh
      this.cache.clear();
      
      return response;
    } catch (error) {
      console.error('Failed to create tool preset:', error);
      throw error;
    }
  }

  async deleteToolPreset(presetId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.request(`/tools/presets/${presetId}`, {
        method: 'DELETE',
      });
      
      // Clear cache to force refresh
      this.cache.clear();
      
      return response;
    } catch (error) {
      console.error(`Failed to delete tool preset ${presetId}:`, error);
      throw error;
    }
  }

  // Tool Analytics
  async getToolAnalytics(toolId: string): Promise<any> {
    try {
      const response = await this.request(`/tools/${toolId}/analytics`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch analytics for ${toolId}:`, error);
      return null;
    }
  }

  // Fallback data for offline/error scenarios
  private getFallbackTools(): Tool[] {
    return [
      {
        id: 'web_search',
        name: 'Web Search',
        description: 'Search the web for current information',
        category: 'search',
        icon: '🌐',
        version: '1.0.0',
        author: 'System',
        parameters: [
          { name: 'query', type: 'string', description: 'Search query', required: true },
          { name: 'num_results', type: 'number', description: 'Number of results', required: false, default: 10 },
        ],
        required: false,
        enabled: false,
        tags: ['web', 'search', 'information'],
        rating: 4.5,
        downloads: 1000,
        cost: 0.01,
        provider: 'system',
        supportedModels: ['all'],
        documentation: 'https://docs.example.com/web-search',
        examples: [
          {
            title: 'Basic Search',
            description: 'Search for information about AI',
            parameters: { query: 'artificial intelligence news', num_results: 5 }
          }
        ]
      },
      {
        id: 'code_interpreter',
        name: 'Code Interpreter',
        description: 'Execute Python code safely',
        category: 'development',
        icon: '💻',
        version: '1.0.0',
        author: 'System',
        parameters: [
          { name: 'code', type: 'string', description: 'Python code to execute', required: true },
          { name: 'timeout', type: 'number', description: 'Execution timeout (seconds)', required: false, default: 30 },
        ],
        required: false,
        enabled: false,
        tags: ['python', 'code', 'execution'],
        rating: 4.8,
        downloads: 2500,
        cost: 0.02,
        provider: 'system',
        supportedModels: ['all'],
        documentation: 'https://docs.example.com/code-interpreter',
        examples: [
          {
            title: 'Simple Calculation',
            description: 'Perform a mathematical calculation',
            parameters: { code: 'print(2 + 2)', timeout: 10 }
          }
        ]
      },
      {
        id: 'database_query',
        name: 'Database Query',
        description: 'Query database with SQL',
        category: 'data',
        icon: '🗄️',
        version: '1.0.0',
        author: 'System',
        parameters: [
          { name: 'query', type: 'string', description: 'SQL query', required: true },
          { name: 'connection_string', type: 'string', description: 'Database connection', required: true },
        ],
        required: false,
        enabled: false,
        tags: ['sql', 'database', 'query'],
        rating: 4.2,
        downloads: 800,
        cost: 0.03,
        provider: 'system',
        supportedModels: ['all'],
        documentation: 'https://docs.example.com/database-query',
        examples: [
          {
            title: 'Select Query',
            description: 'Query user data',
            parameters: { 
              query: 'SELECT * FROM users LIMIT 10',
              connection_string: 'postgresql://user:pass@localhost:5432/db'
            }
          }
        ]
      },
    ];
  }

  private getFallbackCategories(): ToolCategory[] {
    return [
      { id: 'all', name: 'All Tools', icon: '📋', count: 0 },
      { id: 'search', name: 'Search', icon: '🔍', count: 0 },
      { id: 'development', name: 'Development', icon: '💻', count: 0 },
      { id: 'data', name: 'Data', icon: '📊', count: 0 },
      { id: 'communication', name: 'Communication', icon: '💬', count: 0 },
      { id: 'utility', name: 'Utility', icon: '🛠️', count: 0 },
      { id: 'productivity', name: 'Productivity', icon: '📈', count: 0 },
      { id: 'vision', name: 'Vision', icon: '👁️', count: 0 },
    ];
  }

  private getFallbackPresets(): ToolPreset[] {
    return [
      { id: 'data_analyst', name: 'Data Analyst', description: 'Tools for data analysis', tools: ['database_query', 'code_interpreter', 'web_search'] },
      { id: 'developer', name: 'Developer', description: 'Development tools', tools: ['code_interpreter', 'web_search', 'database_query'] },
      { id: 'researcher', name: 'Research Assistant', description: 'Research tools', tools: ['web_search', 'database_query'] },
    ];
  }

  // Clear cache manually
  clearCache(): void {
    this.cache.clear();
  }
}

export const toolMarketplaceService = new ToolMarketplaceService(); 