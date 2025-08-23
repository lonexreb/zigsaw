const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-domain.com/api' 
  : 'http://localhost:3000/api'

export interface ScrapeRequest {
  url: string
  prompt?: string
}

export interface GenerateVideoRequest {
  prompt: string
  image_url?: string
  style?: string
  duration?: number
  quality?: string
}

export interface FastApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

class FastApiService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<FastApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}/fastapi/${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`FastAPI ${endpoint} error:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Scrape content from a URL using the FastAPI backend
   */
  async scrapeUrl(request: ScrapeRequest): Promise<FastApiResponse> {
    return this.request('scrape', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  /**
   * Generate a video using the FastAPI backend
   */
  async generateVideo(request: GenerateVideoRequest): Promise<FastApiResponse> {
    return this.request('generate-video', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  /**
   * Test the connection to the FastAPI backend
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://degree-works-backend-hydrabeans.replit.app/docs')
      return response.ok
    } catch (error) {
      console.error('FastAPI connection test failed:', error)
      return false
    }
  }
}

export const fastApiService = new FastApiService()
export default fastApiService
