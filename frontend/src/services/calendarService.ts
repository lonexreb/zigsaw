/**
 * Google Calendar API Service for frontend integration
 */

import { apiService } from './apiService';

export interface CalendarConfig {
  scopes: string[];
  filters: {
    maxResults: number;
    calendarIds: string[];
    timeMin: string;
    timeMax: string;
    showDeleted: boolean;
  };
  autoSync: boolean;
  syncInterval: number;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

export interface CalendarConnectionTestResponse {
  success: boolean;
  message: string;
  user_email?: string;
  error_details?: string;
}

export interface CalendarStatsResponse {
  total_events: number;
  calendar_count: number;
  last_sync?: string;
}

export interface CalendarAuthResponse {
  auth_url: string;
  state: string;
}

export interface NodeConfigRequest {
  node_id: string;
  scopes: string[];
  filters: {
    max_results: number;
    calendar_ids: string[];
    time_min: string;
    time_max: string;
    show_deleted: boolean;
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

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  location?: string;
  status: string;
  htmlLink: string;
}

export interface CalendarEventsResponse {
  success: boolean;
  message: string;
  events: CalendarEvent[];
  nextPageToken?: string;
}

interface CalendarEventTime {
  dateTime: string;
  timeZone: string;
}

interface CalendarEventAttendee {
  email: string;
  optional: boolean;
}

interface CalendarEventCreate {
  summary: string;
  description?: string;
  location?: string;
  start: CalendarEventTime;
  end: CalendarEventTime;
  attendees?: CalendarEventAttendee[];
}

interface CalendarEventResponse {
  success: boolean;
  message: string;
  event_id?: string;
  event_link?: string;
  details?: any;
}

class CalendarService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  }

  private sortScopes(scopes: string[]): string[] {
    return scopes.sort();
  }

  /**
   * Test Calendar configuration from a node without saving
   */
  async testNodeConfig(config: CalendarConfig, nodeId: string): Promise<CalendarConnectionTestResponse> {
    try {
      const request: NodeConfigRequest = {
        node_id: nodeId,
        scopes: this.sortScopes(config.scopes),
        filters: {
          max_results: config.filters.maxResults,
          calendar_ids: config.filters.calendarIds,
          time_min: config.filters.timeMin,
          time_max: config.filters.timeMax,
          show_deleted: config.filters.showDeleted
        },
        auto_sync: config.autoSync,
        sync_interval: config.syncInterval
      };

      const response = await fetch(`${this.baseUrl}/calendar/node-test`, {
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
      console.error('Error testing Calendar configuration:', error);
      return {
        success: false,
        message: 'Failed to test configuration',
        error_details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save Calendar configuration from a node
   */
  async saveNodeConfig(config: CalendarConfig, nodeId: string): Promise<SaveConfigResponse> {
    console.log('📤 [Calendar Service] Sending request with data:', {
      ...config,
      clientSecret: '***HIDDEN***'
    });

    try {
      const response = await fetch(`${this.baseUrl}/calendar/configs`, {
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
        console.error('❌ [Calendar Service] Failed to save config:', response.status);
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.detail || 'Failed to save configuration',
          connection_status: 'error'
        };
      }

      const data = await response.json();
      console.log('📥 [Calendar Service] Save config response:', data);

      if (!data.id) {
        console.error('❌ [Calendar Service] No config ID in response:', data);
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
      console.error('💥 [Calendar Service] Error saving config:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save configuration',
        connection_status: 'error'
      };
    }
  }

  /**
   * Get calendar statistics
   */
  async getStats(configId?: string): Promise<CalendarStatsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/calendar/stats/${configId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting calendar stats:', error);
      return {
        total_events: 0,
        calendar_count: 0
      };
    }
  }

  /**
   * Test connection to Google Calendar API
   */
  async testConnection(configId: string): Promise<CalendarConnectionTestResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/calendar/test/${configId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test connection'
      };
    }
  }

  /**
   * Start OAuth flow for Google Calendar
   */
  async startOAuthFlow(configId: string): Promise<CalendarAuthResponse | null> {
    console.log('🔐 [Calendar Service] Starting OAuth flow for config:', configId);
    
    try {
      const response = await fetch(`${this.baseUrl}/calendar/auth/start/${configId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to start OAuth flow');
      }
      
      const data = await response.json();
      console.log('📥 [Calendar Service] OAuth start response:', data);
      
      return data;
    } catch (error) {
      console.error('❌ [Calendar Service] OAuth start error:', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(code: string, state: string): Promise<any> {
    console.log('🔄 [Calendar Service] Handling OAuth callback');
    
    try {
      const response = await fetch(`${this.baseUrl}/calendar/auth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to complete OAuth flow');
      }
      
      const data = await response.json();
      console.log('✅ [Calendar Service] OAuth callback response:', data);
      
      return data;
    } catch (error) {
      console.error('❌ [Calendar Service] OAuth callback error:', error);
      throw error;
    }
  }

  /**
   * Get calendar events
   */
  async getEvents(configId: string): Promise<CalendarEventsResponse> {
    console.log('📅 [Calendar Service] Getting events for config:', configId);
    
    try {
      const response = await fetch(`${this.baseUrl}/calendar/events/${configId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [Calendar Service] Events request failed:', response.status, errorData);
        throw new Error(errorData.detail || 'Failed to get events');
      }
      
      const data = await response.json();
      console.log('📥 [Calendar Service] Events response:', data);
      console.log('📊 [Calendar Service] Number of events received:', data.events?.length || 0);
      
      if (data.events && data.events.length > 0) {
        console.log('📝 [Calendar Service] First event sample:', data.events[0]);
      }
      
      return data;
    } catch (error) {
      console.error('❌ [Calendar Service] Error getting events:', error);
      throw error;
    }
  }

  async createEvent(configId: string, eventData: CalendarEventCreate): Promise<CalendarEventResponse> {
    console.log('🚀 [Calendar Service] Creating event for config:', configId);
    console.log('📝 [Calendar Service] Event data:', eventData);
    
    try {
      const response = await apiService.post(`/api/calendar/events/${configId}`, eventData);
      console.log('✅ [Calendar Service] Event created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [Calendar Service] Error creating event:', error);
      if (error.response) {
        console.error('❌ [Calendar Service] Error response status:', error.response.status);
        console.error('❌ [Calendar Service] Error response data:', error.response.data);
        console.error('❌ [Calendar Service] Error response headers:', error.response.headers);
      }
      if (error.request) {
        console.error('❌ [Calendar Service] Error request:', error.request);
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to create event');
    }
  }

  async getAllConfigs(): Promise<any[]> {
    try {
      const response = await apiService.get('/api/calendar/configs');
      return response.data;
    } catch (error) {
      console.error('❌ [Calendar Service] Error getting configs:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get configs');
    }
  }

  async connectToMcp(nodeId: string, configId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/calendar-mcp/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          node_id: nodeId,
          config_id: configId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to connect to MCP');
      }

      return await response.json();
    } catch (error) {
      console.error('Error connecting to MCP:', error);
      throw error;
    }
  }

  async checkMcpHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/calendar-mcp/health`);
      if (response.ok) {
        const data = await response.json();
        return data.status === 'ok';
      }
      return false;
    } catch (error) {
      console.error('Error checking MCP health:', error);
      return false;
    }
  }
}

const calendarService = new CalendarService();
export default calendarService; 