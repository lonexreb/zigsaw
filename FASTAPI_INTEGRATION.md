# FastAPI Integration

This document describes the integration of the FastAPI backend (`https://degree-works-backend-hydrabeans.replit.app`) with the Zigsaw workflow system.

## Overview

The FastAPI integration provides two main capabilities:
1. **Web Scraping** - Enhanced web content extraction using the FastAPI backend
2. **Video Generation** - AI-powered video generation with customizable parameters

## Backend Endpoints

### 1. Web Scraping (`/api/fastapi/scrape`)

**Endpoint:** `POST /api/fastapi/scrape`

**Request Body:**
```json
{
  "url": "https://example.com",
  "prompt": "Extract the main heading and description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Scraped content from FastAPI backend
  }
}
```

**Features:**
- Enhanced content extraction using AI-powered prompts
- Better handling of dynamic content
- Improved data structure and formatting

### 2. Video Generation (`/api/fastapi/generate-video`)

**Endpoint:** `POST /api/fastapi/generate-video`

**Request Body:**
```json
{
  "prompt": "A beautiful sunset over the ocean",
  "image_url": "https://example.com/reference-image.jpg",
  "style": "cinematic",
  "duration": 10,
  "quality": "medium"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Generated video data from FastAPI backend
  }
}
```

**Features:**
- Multiple video styles (cinematic, realistic, artistic, cartoon, anime)
- Configurable duration (5-60 seconds)
- Quality options (low, medium, high)
- Image reference support (required image_url field for AI inspiration)

## Frontend Integration

### 1. FirecrawlNode Enhancement

The existing `FirecrawlNode` now includes a toggle to use the FastAPI backend:

- **Toggle:** "Use FastAPI Backend" switch in configuration panel
- **When enabled:** Uses FastAPI backend for scraping operations
- **When disabled:** Uses the original Firecrawl service
- **Note:** FastAPI backend only works with 'scrape' operations

### 2. FastApiVideoNode

A new node specifically for FastAPI video generation:

- **Node Type:** `fastapi_video`
- **Features:** 
  - Style selection
  - Duration configuration
  - Quality settings
  - Real-time status updates
  - Output preview

## Service Layer

### FastApiService

Located at `frontend/src/services/fastapiService.ts`, this service provides:

```typescript
class FastApiService {
  async scrapeUrl(request: ScrapeRequest): Promise<FastApiResponse>
  async generateVideo(request: GenerateVideoRequest): Promise<FastApiResponse>
  async testConnection(): Promise<boolean>
}
```

## Configuration

### Environment Variables

The service automatically detects the environment and uses appropriate API endpoints:

- **Development:** `http://localhost:3000/api`
- **Production:** Configure `VITE_BACKEND_URL` environment variable

### FastAPI Backend URL

The FastAPI backend URL is hardcoded in the service:
```typescript
const fastApiUrl = 'https://degree-works-backend-hydrabeans.replit.app'
```

## Usage Examples

### 1. Using FastAPI Scraping in FirecrawlNode

1. Add a FirecrawlNode to your workflow
2. Set operation to "Scrape (Single Page)"
3. Enable "Use FastAPI Backend" toggle
4. Enter URL and optional extraction prompt
5. Execute the node

### 2. Using FastAPI Video Generation

1. Add a FastApiVideoNode to your workflow
2. Configure video style, duration, and quality
3. Enter a descriptive prompt
4. Execute the node

## Testing

### Manual Testing

Use the test script to verify integration:
```bash
cd api-backend
node test-fastapi.js
```

### API Testing

Test endpoints directly:
```bash
# Test scraping
curl -X POST http://localhost:3000/api/fastapi/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "prompt": "Extract main content"}'

# Test video generation
curl -X POST http://localhost:3000/api/fastapi/generate-video \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A cat playing", "image_url": "https://example.com/cat.jpg", "style": "cinematic", "duration": 10}'
```

## Error Handling

The integration includes comprehensive error handling:

- **Network errors:** Automatic fallback and user-friendly messages
- **API errors:** Detailed error information from FastAPI backend
- **Validation errors:** Input validation and helpful error messages

## Limitations

1. **FastAPI scraping:** Only available for single-page scraping operations
2. **Video generation:** Requires stable internet connection to FastAPI backend
3. **Rate limiting:** Subject to FastAPI backend rate limits

## Future Enhancements

1. **Batch processing:** Support for multiple URLs in scraping
2. **Advanced video options:** More style and quality configurations
3. **Caching:** Local caching of FastAPI responses
4. **Fallback mechanisms:** Automatic fallback to local services

## Troubleshooting

### Common Issues

1. **Connection failed:** Check if FastAPI backend is accessible
2. **Timeout errors:** Increase timeout values for slow operations
3. **Authentication errors:** Verify API endpoints are publicly accessible

### Debug Mode

Enable debug logging by checking browser console for detailed error information.

## Support

For issues with the FastAPI integration:
1. Check the browser console for error messages
2. Verify FastAPI backend status
3. Test with the provided test script
4. Check network connectivity to the FastAPI backend
