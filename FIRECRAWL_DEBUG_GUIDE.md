# Firecrawl API Debug Guide

## Issues Fixed

I've identified and fixed several issues with your Firecrawl API implementation:

### 1. **API Endpoint Issues**
- **Problem**: The code was only trying one endpoint (`https://api.firecrawl.dev/v1/scrape`)
- **Solution**: Now tries multiple endpoints in order:
  - `https://api.firecrawl.dev/scrape`
  - `https://api.firecrawl.dev/v1/scrape` 
  - `https://api.firecrawl.dev/api/scrape`

### 2. **Request Payload Structure**
- **Problem**: Minimal payload with just `{ url: url }`
- **Solution**: Enhanced payload with proper Firecrawl parameters:
  ```json
  {
    "url": "https://example.com",
    "format": "markdown",
    "only_main_content": true,
    "extract_text": true,
    "extract_links": false,
    "extract_images": false
  }
  ```

### 3. **Error Handling**
- **Problem**: Poor error parsing and limited error information
- **Solution**: Comprehensive error handling with detailed error messages and fallback endpoints

### 4. **API Key Validation**
- **Problem**: Only checked format, didn't test actual API calls
- **Solution**: Real API validation with test requests

## New Debug Features

### 1. **Debug API Endpoint** (`/api/v1/debug-firecrawl`)
- Tests all possible endpoints with different payload configurations
- Provides detailed error information
- Shows which endpoint and payload combination works

### 2. **Enhanced Validation** (`/api/v1/validate-firecrawl`)
- Actually tests the API key with a real request
- Provides specific error messages
- Tests multiple endpoints

### 3. **Frontend Debug Button**
- Added "Debug API" button in the UniversalAgentNode
- Runs comprehensive tests and shows results in chat
- Helps identify the exact issue

## How to Debug Your Issue

### Step 1: Use the Debug Button
1. Open your UniversalAgentNode component
2. Enter your Firecrawl API key
3. Click the "Debug API" button (orange button with bug icon)
4. Check the console and chat for detailed results

### Step 2: Check Common Issues

#### API Key Format
- Must start with `fc-`
- Should be at least 10 characters long
- Example: `fc-1234567890abcdef...`

#### API Key Validity
- Check if you have sufficient credits
- Verify the key is active in your Firecrawl dashboard
- Ensure the key has scraping permissions

#### URL Accessibility
- Test with simple URLs first (like `https://httpbin.org/html`)
- Ensure the target URL is publicly accessible
- Check if the URL requires JavaScript rendering

### Step 3: Check Console Logs
The enhanced logging will show:
- Which endpoints are being tried
- Response status codes and headers
- Detailed error messages
- Working payload configurations

### Step 4: Common Error Messages

#### "Invalid API key format"
- Solution: Ensure your API key starts with `fc-`

#### "API key validation failed: 401 Unauthorized"
- Solution: Check if your API key is valid and has credits

#### "API key validation failed: 403 Forbidden"
- Solution: Check if your API key has scraping permissions

#### "All Firecrawl endpoints failed"
- Solution: Check network connectivity and try different URLs

## Testing URLs

Use these URLs for testing:
- `https://httpbin.org/html` - Simple HTML page
- `https://example.com` - Basic website
- `https://jsonplaceholder.typicode.com/posts/1` - JSON API

## Files Modified

1. **`api-backend/pages/api/v1/firecrawl.ts`** - Enhanced with multiple endpoints and better error handling
2. **`api-backend/pages/api/v1/chat-with-tools.ts`** - Updated tool execution with same improvements
3. **`api-backend/pages/api/v1/validate-firecrawl.ts`** - Real API validation
4. **`api-backend/pages/api/v1/debug-firecrawl.ts`** - New comprehensive debug endpoint
5. **`frontend/src/components/nodes/UniversalAgentNode.tsx`** - Added debug button

## Next Steps

1. **Test with the debug button** to identify your specific issue
2. **Check your Firecrawl API key** in the dashboard
3. **Try with simple URLs first** before complex ones
4. **Monitor the console logs** for detailed error information

If you're still having issues after using the debug tools, please share:
- The exact error message from the debug results
- Your API key format (first few characters)
- The URL you're trying to scrape
- The console logs from the debug session 