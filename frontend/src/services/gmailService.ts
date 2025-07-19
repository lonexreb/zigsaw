/**
 * Gmail API Service for frontend integration
 */

export interface GmailConfig {
  scopes: string[];
  filters: {
    maxResults: number;
    labelIds: string[];
    query: string;
  };
  autoSync: boolean;
  syncInterval: number;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

export interface GmailConnectionTestResponse {
  success: boolean;
  message: string;
  user_email?: string;
  error_details?: string;
}

export interface GmailStatsResponse {
  total_emails: number;
  unread_emails: number;
  inbox_emails: number;
  sent_emails: number;
  draft_emails: number;
  storage_used: string;
  last_sync?: string;
}

export interface GmailAuthResponse {
  auth_url: string;
  state: string;
}

export interface NodeConfigRequest {
  node_id: string;
  scopes: string[];
  filters: {
    max_results: number;
    label_ids: string[];
    query: string;
  };
  auto_sync: boolean;
  sync_interval: number;
}

export interface NodeConfigResponse {
  success: boolean;
  config_id?: string;
  message: string;
  connection_status: string;
}

export interface SaveConfigResponse {
  success: boolean;
  config_id?: string;
  message: string;
  connection_status: string;
}

export interface GmailEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body?: string;
}

export interface GmailEmailsResponse {
  success: boolean;
  message: string;
  emails: GmailEmail[];
  nextPageToken?: string;
}

class GmailService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  }

  private sortScopes(scopes: string[]): string[] {
    return scopes.sort();
  }

  /**
   * Test Gmail configuration from a node without saving
   */
  async testNodeConfig(config: GmailConfig, nodeId: string): Promise<GmailConnectionTestResponse> {
    try {
      const request: NodeConfigRequest = {
        node_id: nodeId,
        scopes: this.sortScopes(config.scopes),
        filters: {
          max_results: config.filters.maxResults,
          label_ids: config.filters.labelIds,
          query: config.filters.query
        },
        auto_sync: config.autoSync,
        sync_interval: config.syncInterval
      };

      const response = await fetch(`${this.baseUrl}/gmail/node-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error testing Gmail configuration:', error);
      return {
        success: false,
        message: 'Failed to test configuration',
        error_details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save Gmail configuration from a node
   */
  async saveNodeConfig(config: GmailConfig, nodeId: string): Promise<SaveConfigResponse> {
    console.log('📤 [Gmail Service] Sending request with data:', {
      ...config,
      clientSecret: '***HIDDEN***'
    });

    try {
      const response = await fetch(`${this.baseUrl}/gmail/configs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          node_id: nodeId,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: config.redirectUri,
          scopes: config.scopes,
          filters: config.filters,
          auto_sync: config.autoSync,
          sync_interval: config.syncInterval,
          auth_method: 'oauth2'
        }),
      });

      if (!response.ok) {
        console.error('❌ [Gmail Service] Failed to save config:', response.status);
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.detail || 'Failed to save configuration',
          connection_status: 'error'
        };
      }

      const data = await response.json();
      console.log('📥 [Gmail Service] Save config response:', data);

      if (!data.id) {
        console.error('❌ [Gmail Service] No config ID in response:', data);
        return {
          success: false,
          message: 'No configuration ID returned from server',
          connection_status: 'error'
        };
      }

      return {
        success: true,
        config_id: data.id,
        message: 'Configuration saved successfully',
        connection_status: data.status || 'pending'
      };
    } catch (error) {
      console.error('💥 [Gmail Service] Error saving config:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save configuration',
        connection_status: 'error'
      };
    }
  }

  /**
   * Get Gmail account statistics (mock data for now)
   */
  async getStats(configId?: string): Promise<GmailStatsResponse> {
    try {
      if (!configId) {
        // Return mock data if no config ID
        return {
          total_emails: 0,
          unread_emails: 0,
          inbox_emails: 0,
          sent_emails: 0,
          draft_emails: 0,
          storage_used: '0 MB',
          last_sync: undefined
        };
      }

      const response = await fetch(`${this.baseUrl}/gmail/configs/${configId}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error getting Gmail stats:', error);
      // Return mock data on error
      return {
        total_emails: 1234,
        unread_emails: 42,
        inbox_emails: 156,
        sent_emails: 789,
        draft_emails: 3,
        storage_used: '2.1 GB',
        last_sync: new Date().toISOString()
      };
    }
  }

  /**
   * Test connection for an existing configuration
   */
  async testConnection(configId: string): Promise<GmailConnectionTestResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/gmail/configs/${configId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error testing Gmail connection:', error);
      return {
        success: false,
        message: 'Failed to test connection',
        error_details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Start OAuth2 authentication flow
   */
  async startOAuthFlow(configId: string): Promise<GmailAuthResponse | null> {
    console.log('🔐 [Gmail Service] Starting OAuth flow for config ID:', configId);
    
    try {
      const response = await fetch(`${this.baseUrl}/gmail/auth/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config_id: configId,
          force_reauth: false
        }),
      });

      console.log('📥 [Gmail Service] OAuth response status:', response.status);
      console.log('📥 [Gmail Service] OAuth response ok:', response.ok);

      if (!response.ok) {
        console.error('❌ [Gmail Service] OAuth HTTP error response:', await response.text());
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [Gmail Service] Parsed error details:', errorData);
        throw new Error(`HTTP error! status: ${response.status}, body: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      console.log('✅ [Gmail Service] OAuth flow result:', result);
      return result;
    } catch (error) {
      console.error('💥 [Gmail Service] Error starting OAuth flow:', error);
      console.log('📋 [Gmail Service] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      if (error instanceof Error) {
        console.log('📋 [Gmail Service] Error stack:', error.stack);
      }
      return null;
    }
  }

  /**
   * Handle OAuth callback (exchange code for tokens)
   */
  async handleOAuthCallback(code: string, state: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/gmail/auth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          state
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      throw error;
    }
  }

  /**
   * Validate Gmail configuration format
   */
  validateConfig(config: Partial<GmailConfig>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.scopes || config.scopes.length === 0) {
      errors.push('At least one scope is required');
    }

    if (!config.filters || !config.filters.maxResults || !config.filters.labelIds || !config.filters.query) {
      errors.push('Filters are required');
    }

    if (!config.autoSync) {
      errors.push('AutoSync is required');
    }

    if (!config.syncInterval) {
      errors.push('SyncInterval is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get default Gmail configuration
   */
  getDefaultConfig(): GmailConfig {
    return {
      scopes: [
        'openid',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/contacts'
      ],
      filters: {
        maxResults: 10,
        labelIds: [],
        query: ''
      },
      autoSync: false,
      syncInterval: 5
    };
  }

  /**
   * Format scope names for display
   */
  formatScopeName(scope: string): string {
    const scopeNames: Record<string, string> = {
      'https://www.googleapis.com/auth/gmail.readonly': 'Read emails',
      'https://www.googleapis.com/auth/gmail.modify': 'Modify emails',
      'https://www.googleapis.com/auth/gmail.send': 'Send emails',
      'https://www.googleapis.com/auth/gmail.compose': 'Compose emails',
      'https://www.googleapis.com/auth/gmail.labels': 'Manage labels',
      'https://mail.google.com/': 'Full access'
    };

    return scopeNames[scope] || scope;
  }

  /**
   * Get common Gmail label options
   */
  getCommonLabels(): Array<{ value: string; label: string }> {
    return [
      { value: 'INBOX', label: 'Inbox' },
      { value: 'SENT', label: 'Sent' },
      { value: 'DRAFT', label: 'Drafts' },
      { value: 'SPAM', label: 'Spam' },
      { value: 'TRASH', label: 'Trash' },
      { value: 'IMPORTANT', label: 'Important' },
      { value: 'STARRED', label: 'Starred' }
    ];
  }

  /**
   * Get common scope options
   */
  getCommonScopes(): Array<{ value: string; label: string }> {
    return [
      { value: 'https://www.googleapis.com/auth/gmail.readonly', label: 'Read emails' },
      { value: 'https://www.googleapis.com/auth/gmail.modify', label: 'Modify emails' },
      { value: 'https://www.googleapis.com/auth/gmail.send', label: 'Send emails' },
      { value: 'https://www.googleapis.com/auth/gmail.compose', label: 'Compose emails' },
      { value: 'https://www.googleapis.com/auth/gmail.labels', label: 'Manage labels' }
    ];
  }

  /**
   * Retrieve emails for a given configuration
   */
  async getEmails(configId: string): Promise<GmailEmailsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/gmail/emails/${configId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error retrieving emails:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve emails',
        emails: []
      };
    }
  }

  async createDraft(configId: string, draft: { to: string, subject: string, body: string }): Promise<{ success: boolean, draftId?: string, message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/gmail/drafts/${configId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        draftId: result.draft_id,
        message: 'Draft created successfully'
      };
    } catch (error) {
      console.error('Error creating draft:', error);
      const errorMessage = (error as any).response?.data?.detail || (error as Error).message || 'An unknown error occurred';
      return { success: false, message: errorMessage };
    }
  }
}

// Export singleton instance
export const gmailService = new GmailService();
export default gmailService; 