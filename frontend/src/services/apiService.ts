/**
 * Service for managing API keys with the backend
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://zigsaw-backend.vercel.app';

export interface ApiKeyData {
  id: string;
  provider: string;
  name: string;
  description?: string;
  masked_key: string;
  status: 'active' | 'expired' | 'invalid' | 'unknown';
  created_at: string;
  last_used?: string;
}

export interface NodeDeleteResponse {
  success: boolean;
  message: string;
  node_id: string;
}

class ApiService {
  /**
   * Generic HTTP request method
   */
  private async request(endpoint: string, options: RequestInit = {}, idToken?: string): Promise<Response> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    const response = await fetch(url, {
      headers,
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      console.error('❌ API Error Response:', errorData);
      
      // Show detailed validation errors
      if (Array.isArray(errorData.detail)) {
        console.error('🔍 Detailed validation errors:');
        errorData.detail.forEach((err: Record<string, unknown>, index: number) => {
          console.error(`  ${index + 1}. Field: "${(err.loc as string[])?.join('.')}", Error: "${err.msg}", Type: "${err.type}", Input: ${JSON.stringify(err.input)}`);
        });
      }
      
      // Extract error message properly
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      if (errorData.detail) {
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: unknown) => 
            typeof err === 'string' ? err : (err as Record<string, unknown>).msg || JSON.stringify(err)
          ).join(', ');
        } else {
          errorMessage = JSON.stringify(errorData.detail);
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
      
      throw new Error(errorMessage);
    }

    return response;
  }

  /**
   * Generic GET request
   */
  async get(endpoint: string, idToken?: string): Promise<{ data: any }> {
    const response = await this.request(endpoint, { method: 'GET' }, idToken);
    const data = await response.json();
    return { data };
  }

  /**
   * Generic POST request
   */
  async post(endpoint: string, body?: any, idToken?: string): Promise<{ data: any }> {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }, idToken);
    const data = await response.json();
    return { data };
  }

  /**
   * Generic PUT request
   */
  async put(endpoint: string, body?: any, idToken?: string): Promise<{ data: any }> {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }, idToken);
    const data = await response.json();
    return { data };
  }

  /**
   * Generic DELETE request
   */
  async delete(endpoint: string, idToken?: string): Promise<{ data: any }> {
    const response = await this.request(endpoint, { method: 'DELETE' }, idToken);
    const data = await response.json();
    return { data };
  }

  /**
   * Save an API key to the backend
   */
  async saveApiKey(provider: string, key: string, name?: string, idToken?: string): Promise<ApiKeyData> {
    try {
      console.log(`🔑 Saving API key for provider: ${provider}`);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/api-keys`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          provider,
          key,
          name: name || `${provider} API Key`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ API key saved successfully for ${provider}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to save API key for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Get all stored API keys from the backend
   */
  async getApiKeys(idToken?: string): Promise<ApiKeyData[]> {
    try {
      console.log('🔍 Fetching stored API keys from backend...');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/api-keys`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Retrieved ${result?.length || 0} API keys from backend`);
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch API keys:', error);
      throw error;
    }
  }

  /**
   * Delete an API key from the backend
   */
  async deleteApiKey(keyId: string, idToken?: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🗑️ Deleting API key: ${keyId}`);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/api-keys/${keyId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ API key deleted successfully`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to delete API key:`, error);
      throw error;
    }
  }

  /**
   * Map frontend node types to backend provider names
   */
  mapNodeTypeToProvider(nodeType: string): string {
    const mapping: Record<string, string> = {
      'gemini': 'google',
      'claude4': 'anthropic', 
      'groqllama': 'groq',
      'vapi': 'vapi'
    };
    
    return mapping[nodeType] || nodeType;
  }

  /**
   * Map backend provider names to frontend node types
   */
  mapProviderToNodeType(provider: string): string {
    const mapping: Record<string, string> = {
      'google': 'gemini',
      'anthropic': 'claude4',
      'groq': 'groqllama',
      'vapi': 'vapi'
    };
    
    return mapping[provider] || provider;
  }

  /**
   * Delete a node from the backend
   */
  async deleteNode(nodeId: string, workflowId?: string, idToken?: string): Promise<NodeDeleteResponse> {
    try {
      console.log(`🗑️ Deleting node ${nodeId}...`);
      
      const url = workflowId 
        ? `/api/v1/nodes/${nodeId}?workflow_id=${workflowId}`
        : `/api/v1/nodes/${nodeId}`;
      
      const response = await this.request(url, {
        method: 'DELETE',
      }, idToken);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Node ${nodeId} deleted successfully`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to delete node ${nodeId}:`, error);
      throw error;
    }
  }
}

export const apiService = new ApiService(); 