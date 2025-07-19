// Service for handling search functionality
const API_BASE_URL = 'http://localhost:8000/api';

export interface SearchConfig {
  search_type: 'web' | 'document';
  query: string;
  max_results: number;
  search_engine?: 'duckduckgo' | 'serpapi' | 'bing';
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  relevance_score?: number;
  is_instant_answer?: boolean;
}

export interface SearchResponse {
  search_type: string;
  query: string;
  total_results: number;
  results: SearchResult[];
  metadata: {
    search_engine: string;
    execution_time_ms: number;
    api_response_type?: string;
    answer_type?: string;
    abstract_source?: string;
    query_suggestions?: string[];
  };
}

export interface SearchServiceResponse {
  success: boolean;
  data?: SearchResponse;
  logs?: Array<{
    level: string;
    message: string;
    timestamp: string;
    node_id?: string;
  }>;
  error?: string;
}

class SearchService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async performSearch(config: SearchConfig): Promise<SearchServiceResponse> {
    try {
      console.log('🔍 Performing search with config:', config);
      
      const response = await fetch(`${this.baseUrl}/search/execute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search API error:', response.status, errorText);
        throw new Error(`Search failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('🔍 Search API response:', result);
      
      // Validate result structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response format from search API');
      }

      // Log metadata for debugging
      if (result.success && result.data?.metadata) {
        console.log('🔍 Search metadata:', {
          engine: result.data.metadata.search_engine,
          type: result.data.metadata.api_response_type,
          answerType: result.data.metadata.answer_type,
          source: result.data.metadata.abstract_source,
          time: result.data.metadata.execution_time_ms
        });
      }

      return result;
    } catch (error) {
      console.error('Search request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown search error'
      };
    }
  }

  async quickSearch(query: string): Promise<SearchServiceResponse> {
    return this.performSearch({
      search_type: 'web',
      query,
      max_results: 5,
      search_engine: 'duckduckgo'
    });
  }

  async testSearch(query: string): Promise<SearchServiceResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/search/test`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Test search failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Test search request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown test search error'
      };
    }
  }

  async checkHealth(): Promise<{ status: string; available_engines: string[]; message: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/search/health`);
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Search service health check failed:', error);
      return null;
    }
  }

  // Utility methods
  formatExecutionTime(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
  }

  truncateSnippet(snippet: string, maxLength: number = 150): string {
    if (!snippet) return 'No description available';
    if (snippet.length <= maxLength) {
      return snippet;
    }
    return snippet.substring(0, maxLength - 3) + '...';
  }

  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export const searchService = new SearchService(); 