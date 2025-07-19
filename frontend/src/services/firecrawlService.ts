/**
 * Firecrawl service for web scraping and crawling operations
 */

export interface FirecrawlScrapeRequest {
  url: string;
  formats?: string[];
  only_main_content?: boolean;
  extraction_prompt?: string;
  include_tags?: string[];
  exclude_tags?: string[];
  timeout?: number;
}

export interface FirecrawlCrawlRequest {
  url: string;
  limit?: number;
  include_paths?: string[];
  exclude_paths?: string[];
  max_depth?: number;
}

export interface FirecrawlMapRequest {
  url: string;
  limit?: number;
  include_subdomains?: boolean;
}

export interface FirecrawlResponse {
  success: boolean;
  operation: string;
  url: string;
  data?: any;
  error?: string;
  job_id?: string;
  status_url?: string;
  pages_count?: number;
  urls_found?: number;
  urls?: string[];
}

class FirecrawlService {
  private baseUrl = '/api/firecrawl';
  private nodeId: string;

  constructor(nodeId: string = 'default') {
    this.nodeId = nodeId;
  }

  async connect(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/connect/${this.nodeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error connecting to Firecrawl:', error);
      return {
        success: false,
        message: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async scrapeUrl(request: FirecrawlScrapeRequest): Promise<FirecrawlResponse> {
    try {
      // Ensure connection first
      const connection = await this.connect();
      if (!connection.success) {
        return {
          success: false,
          operation: 'scrape',
          url: request.url,
          error: connection.message
        };
      }

      const response = await fetch(`${this.baseUrl}/scrape?node_id=${this.nodeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error scraping URL:', error);
      return {
        success: false,
        operation: 'scrape',
        url: request.url,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async crawlUrl(request: FirecrawlCrawlRequest): Promise<FirecrawlResponse> {
    try {
      // Ensure connection first
      const connection = await this.connect();
      if (!connection.success) {
        return {
          success: false,
          operation: 'crawl',
          url: request.url,
          error: connection.message
        };
      }

      const response = await fetch(`${this.baseUrl}/crawl?node_id=${this.nodeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error crawling URL:', error);
      return {
        success: false,
        operation: 'crawl',
        url: request.url,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async mapUrl(request: FirecrawlMapRequest): Promise<FirecrawlResponse> {
    try {
      // Ensure connection first
      const connection = await this.connect();
      if (!connection.success) {
        return {
          success: false,
          operation: 'map',
          url: request.url,
          error: connection.message
        };
      }

      const response = await fetch(`${this.baseUrl}/map?node_id=${this.nodeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error mapping URL:', error);
      return {
        success: false,
        operation: 'map',
        url: request.url,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async checkCrawlStatus(crawlId: string): Promise<FirecrawlResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/crawl/status/${this.nodeId}/${crawlId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking crawl status:', error);
      return {
        success: false,
        operation: 'status_check',
        url: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getStatus(): Promise<{ success: boolean; is_connected: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/status/${this.nodeId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting Firecrawl status:', error);
      return {
        success: false,
        is_connected: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export a factory function to create service instances
export const createFirecrawlService = (nodeId: string): FirecrawlService => {
  return new FirecrawlService(nodeId);
};

// Export a default instance
export const firecrawlService = new FirecrawlService();