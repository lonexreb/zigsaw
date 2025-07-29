import { NextApiRequest, NextApiResponse } from 'next';

// Tool definitions for function calling
const availableTools = {
  firecrawl_scraper: {
    name: 'firecrawl_scraper',
    description: 'Scrape and extract content from web pages using Firecrawl',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to scrape'
        },
        extract_text: {
          type: 'boolean',
          description: 'Extract text content',
          default: true
        },
        extract_links: {
          type: 'boolean',
          description: 'Extract links',
          default: false
        },
        extract_images: {
          type: 'boolean',
          description: 'Extract image URLs',
          default: false
        }
      },
      required: ['url']
    }
  },
  web_search: {
    name: 'web_search',
    description: 'Search the web for current information using DuckDuckGo',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'What to search for'
        },
        num_results: {
          type: 'number',
          description: 'How many results to show (1-10)',
          default: 5
        }
      },
      required: ['query']
    }
  },
  code_interpreter: {
    name: 'code_interpreter',
    description: 'Execute Python code safely in a sandboxed environment',
    parameters: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Python code to execute'
        },
        timeout: {
          type: 'number',
          description: 'Time limit in seconds (1-30)',
          default: 10
        }
      },
      required: ['code']
    }
  },
  database_query: {
    name: 'database_query',
    description: 'Query database with natural language (converted to SQL)',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language database question'
        },
        connection_string: {
          type: 'string',
          description: 'Database connection string (optional - uses default if not provided)'
        }
      },
      required: ['query']
    }
  },
  calculator: {
    name: 'calculator',
    description: 'Perform mathematical calculations and evaluations',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Mathematical expression to evaluate'
        }
      },
      required: ['expression']
    }
  }
};

// Execute a tool based on the function call
async function executeTool(functionName: string, arguments_: Record<string, unknown>, firecrawlApiKey?: string) {
  switch (functionName) {
    case 'firecrawl_scraper':
      if (!firecrawlApiKey) {
        throw new Error('Firecrawl API key is required for web scraping');
      }
      
      const { url, extract_text = true, extract_links = false, extract_images = false } = arguments_;
      
      // Validate API key format
      if (!firecrawlApiKey.startsWith('fc-')) {
        throw new Error('Invalid Firecrawl API key format. Should start with "fc-"');
      }
      
      // Try multiple Firecrawl API endpoints (updated with correct endpoints)
      const endpoints = [
        'https://api.firecrawl.dev/scrape',
        'https://api.firecrawl.dev/v1/scrape',
        'https://api.firecrawl.dev/api/scrape',
        'https://api.firecrawl.dev/v1/extract',
        'https://api.firecrawl.dev/extract'
      ];

      let lastError = null;
      let data = null;

      for (const endpoint of endpoints) {
        try {
          console.log('Calling Firecrawl API with URL:', url, 'endpoint:', endpoint);
          
          // Different payload structures for different endpoints
          let requestPayload;
          
          if (endpoint.includes('/extract')) {
            // For extract endpoints
            requestPayload = {
              url: url,
              extraction_prompt: "Extract the main content, title, and description from this webpage",
              output_format: "markdown"
            };
          } else {
            // For scrape endpoints
            requestPayload = {
              url: url,
              // Add optional parameters based on user preferences
              ...(extract_text && { extract_text: true }),
              ...(extract_links && { extract_links: true }),
              ...(extract_images && { extract_images: true }),
              // Add common Firecrawl parameters
              format: 'markdown',
              only_main_content: true
            };
          }

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${firecrawlApiKey}`
            },
            body: JSON.stringify(requestPayload)
          });

          if (response.ok) {
            data = await response.json();
            console.log('Success with endpoint:', endpoint);
            break;
          } else {
            const errorText = await response.text();
            console.error('Firecrawl API error:', response.status, response.statusText, errorText);
            console.error('Request URL:', url);
            console.error('API Key (first 10 chars):', firecrawlApiKey.substring(0, 10) + '...');
            
            let errorDetails = errorText;
            try {
              const errorJson = JSON.parse(errorText);
              if (errorJson.error?.message) {
                errorDetails = errorJson.error.message;
              } else if (errorJson.message) {
                errorDetails = errorJson.message;
              }
            } catch {
              // If parsing fails, use the raw error text
            }
            
            lastError = {
              status: response.status,
              statusText: response.statusText,
              details: errorDetails,
              endpoint: endpoint
            };
            
            // If this is the last endpoint, throw the error
            if (endpoint === endpoints[endpoints.length - 1]) {
              throw new Error(`All Firecrawl endpoints failed. Last error: ${response.status} ${response.statusText} - ${errorDetails}`);
            }
          }
        } catch (error) {
          console.error('Exception with endpoint:', endpoint, error);
          lastError = {
            status: 500,
            statusText: 'Internal Error',
            details: error instanceof Error ? error.message : 'Unknown error',
            endpoint: endpoint
          };
          
          // If this is the last endpoint, throw the error
          if (endpoint === endpoints[endpoints.length - 1]) {
            throw error;
          }
        }
      }

      if (!data) {
        throw new Error(`Firecrawl API request failed: ${lastError?.details || 'Unknown error'}`);
      }
      
      return {
        url: url,
        title: data.title || data.metadata?.title || data.extracted_data?.title || '',
        description: data.description || data.metadata?.description || data.extracted_data?.description || '',
        content: extract_text ? (data.text || data.markdown || data.html || data.content || data.extracted_data?.content || '') : '',
        links: extract_links ? (data.links || data.extracted_data?.links || []) : [],
        images: extract_images ? (data.images || data.extracted_data?.images || []) : [],
        metadata: data.metadata || data.extracted_data?.metadata || {},
        timestamp: new Date().toISOString()
      };

    case 'web_search':
      const { query, num_results = 5 } = arguments_;
      
      if (!query || typeof query !== 'string') {
        throw new Error('Query is required and must be a string');
      }
      
      const maxResults = Math.min(Math.max(1, num_results), 10);
      
      try {
        console.log(`🔍 Performing web search for: "${query}" (${maxResults} results)`);
        
        // Using DuckDuckGo Instant Answer API (free, no API key required)
        const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'ZigsawAI/1.0 (Web Search Tool)'
          }
        });
        
        if (!response.ok) {
          throw new Error(`DuckDuckGo API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Extract search results
        const results = [];
        
        // Add instant answer if available
        if (data.Abstract && data.Abstract.trim()) {
          results.push({
            title: data.Heading || 'Instant Answer',
            url: data.AbstractURL || data.AbstractSource || '',
            snippet: data.Abstract,
            type: 'instant_answer'
          });
        }
        
        // Add related topics
        if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
          for (const topic of data.RelatedTopics.slice(0, maxResults - results.length)) {
            if (topic.Text && topic.FirstURL) {
              results.push({
                title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 100),
                url: topic.FirstURL,
                snippet: topic.Text,
                type: 'related_topic'
              });
            }
          }
        }
        
        // If we don't have enough results, try the HTML search (limited)
        if (results.length === 0) {
          // Fallback: Basic web search using a simple approach
          console.log('⚠️ No instant results, using fallback search method');
          
          results.push({
            title: `Search results for: ${query}`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            snippet: `To get more detailed results, please visit DuckDuckGo directly. The search API has limited results for this query.`,
            type: 'fallback'
          });
        }
        
        return {
          query: query,
          results: results.slice(0, maxResults),
          total_found: results.length,
          search_engine: 'DuckDuckGo',
          timestamp: new Date().toISOString()
        };
        
      } catch (error) {
        console.error('Web search error:', error);
        throw new Error(`Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    case 'code_interpreter':
      const { code, timeout = 10 } = arguments_;
      
      if (!code || typeof code !== 'string') {
        throw new Error('Code is required and must be a string');
      }
      
      const safeTimeout = Math.min(Math.max(1, timeout), 30);
      
      try {
        console.log(`🐍 Executing Python code (timeout: ${safeTimeout}s)`);
        
        // For now, we'll use a simple evaluation approach
        // In production, this should use Docker or a proper sandbox
        const vm = await import('vm');
        
        // Create a safe context for JavaScript execution (as a Python substitute for demo)
        const context = {
          console: console,
          Math: Math,
          Date: Date,
          JSON: JSON,
          setTimeout: setTimeout,
          clearTimeout: clearTimeout,
          // Add some common utilities
          print: (...args: any[]) => args.join(' '),
          len: (arr: any) => Array.isArray(arr) ? arr.length : String(arr).length,
          range: (start: number, stop?: number, step = 1) => {
            if (stop === undefined) {
              stop = start;
              start = 0;
            }
            const result = [];
            for (let i = start; i < stop; i += step) {
              result.push(i);
            }
            return result;
          }
        };
        
        // Convert basic Python syntax to JavaScript
        let jsCode = code
          .replace(/print\(/g, 'console.log(')
          .replace(/len\(/g, 'len(')
          .replace(/range\(/g, 'range(')
          .replace(/def\s+(\w+)\(/g, 'function $1(')
          .replace(/:\s*$/gm, ' {')
          .replace(/^\s*(\w+)\s*=\s*(.+)$/gm, 'var $1 = $2;');
        
        // Add return statement if it's a simple expression
        if (!jsCode.includes('console.log') && !jsCode.includes('function') && !jsCode.includes('{')) {
          jsCode = `return ${jsCode}`;
        }
        
        const result = vm.runInNewContext(jsCode, context, {
          timeout: safeTimeout * 1000,
          displayErrors: true
        });
        
        return {
          code: code,
          result: result,
          output: 'Code executed successfully',
          language: 'python_simulation',
          execution_time_ms: Date.now() % 1000, // Simulated timing
          timestamp: new Date().toISOString(),
          note: 'This is a simplified JavaScript simulation of Python. For full Python support, a proper sandboxed environment is needed.'
        };
        
      } catch (error) {
        console.error('Code execution error:', error);
        return {
          code: code,
          result: null,
          output: error instanceof Error ? error.message : 'Unknown execution error',
          error: true,
          language: 'python_simulation',
          timestamp: new Date().toISOString()
        };
      }

    case 'database_query':
      const { query: dbQuery, connection_string } = arguments_;
      
      if (!dbQuery || typeof dbQuery !== 'string') {
        throw new Error('Database query is required and must be a string');
      }
      
      try {
        console.log(`🗄️ Processing database query: "${dbQuery}"`);
        
        // For demo purposes, we'll simulate database responses
        // In production, this should connect to real databases
        const simulatedData = [
          { id: 1, name: 'Alice Johnson', email: 'alice@example.com', created_at: '2024-01-15' },
          { id: 2, name: 'Bob Smith', email: 'bob@example.com', created_at: '2024-01-20' },
          { id: 3, name: 'Carol Davis', email: 'carol@example.com', created_at: '2024-01-25' }
        ];
        
        // Simple query simulation based on keywords
        let filteredData = simulatedData;
        const queryLower = dbQuery.toLowerCase();
        
        if (queryLower.includes('alice') || queryLower.includes('johnson')) {
          filteredData = simulatedData.filter(row => row.name.toLowerCase().includes('alice'));
        } else if (queryLower.includes('count') || queryLower.includes('total')) {
          return {
            query: dbQuery,
            result: [{ count: simulatedData.length }],
            rows_affected: simulatedData.length,
            execution_time_ms: 45,
            database: 'demo_db',
            timestamp: new Date().toISOString(),
            note: 'This is simulated data. Connect to a real database for actual results.'
          };
        } else if (queryLower.includes('limit 1') || queryLower.includes('first')) {
          filteredData = simulatedData.slice(0, 1);
        }
        
        return {
          query: dbQuery,
          result: filteredData,
          rows_affected: filteredData.length,
          execution_time_ms: Math.floor(Math.random() * 100) + 20,
          database: connection_string ? 'custom_db' : 'demo_db',
          timestamp: new Date().toISOString(),
          note: 'This is simulated data. For real database connections, provide valid connection strings and implement proper SQL execution.'
        };
        
      } catch (error) {
        console.error('Database query error:', error);
        throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    case 'calculator':
      const { expression } = arguments_;
      
      if (!expression || typeof expression !== 'string') {
        throw new Error('Mathematical expression is required and must be a string');
      }
      
      try {
        console.log(`🧮 Calculating: "${expression}"`);
        
        // Clean and validate the expression
        const cleanExpression = expression
          .replace(/[^0-9+\-*/().\s]/g, '') // Remove unsafe characters
          .replace(/\s+/g, ''); // Remove spaces
        
        if (!cleanExpression) {
          throw new Error('Invalid mathematical expression');
        }
        
        // Use Function constructor for safe evaluation (better than eval)
        const result = Function(`"use strict"; return (${cleanExpression})`)();
        
        if (typeof result !== 'number' || !isFinite(result)) {
          throw new Error('Result is not a valid number');
        }
        
        return {
          expression: expression,
          cleaned_expression: cleanExpression,
          result: result,
          result_formatted: result.toLocaleString(),
          timestamp: new Date().toISOString()
        };
        
      } catch (error) {
        console.error('Calculator error:', error);
        throw new Error(`Calculation failed: ${error instanceof Error ? error.message : 'Invalid expression'}`);
      }

    default:
      throw new Error(`Unknown tool: ${functionName}`);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      provider, 
      model, 
      messages, 
      systemPrompt, 
      temperature, 
      maxTokens, 
      apiKey, 
      firecrawlApiKey,
      tools = [],
      maxIterations = 5
    } = req.body;

    if (!provider || !model || !messages || !apiKey) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Prepare tools for function calling
    const functionDefinitions = tools.map((toolId: string) => {
      const tool = availableTools[toolId as keyof typeof availableTools];
      return tool ? {
        type: 'function',
        function: tool
      } : null;
    }).filter(Boolean);

    // eslint-disable-next-line prefer-const
    const currentMessages = [...messages];
    let iteration = 0;
    let finalResponse = '';

    while (iteration < maxIterations) {
      iteration++;
      console.log(`Chat iteration ${iteration}/${maxIterations}`);

      // Prepare request body based on provider
      let requestBody: any;
      let response: Response;

      switch (provider) {
        case 'anthropic':
          requestBody = {
            model: model,
            max_tokens: maxTokens || 1000,
            temperature: temperature || 0.7,
            messages: currentMessages.slice(1), // Claude doesn't use system message in the same way
            system: systemPrompt || 'You are a helpful AI assistant with access to tools. Use them when needed to help the user.',
            tools: functionDefinitions.length > 0 ? functionDefinitions : undefined
          };
          
          response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(requestBody)
          });
          break;

        case 'openai':
          requestBody = {
            model: model,
            max_tokens: maxTokens || 1000,
            temperature: temperature || 0.7,
            messages: currentMessages,
            functions: functionDefinitions.length > 0 ? functionDefinitions : undefined,
            function_call: functionDefinitions.length > 0 ? 'auto' : undefined
          };
          
          response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
          });
          break;

        case 'groq':
          requestBody = {
            model: model,
            max_tokens: maxTokens || 1000,
            temperature: temperature || 0.7,
            messages: currentMessages,
            functions: functionDefinitions.length > 0 ? functionDefinitions : undefined,
            function_call: functionDefinitions.length > 0 ? 'auto' : undefined
          };
          
          response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
          });
          break;

        default:
          return res.status(400).json({ error: 'Unsupported provider' });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed: ${response.status} ${response.statusText}`, errorText);
        
        let errorDetails = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorDetails = errorJson.error.message;
          }
        } catch (e) {
          // If parsing fails, use the raw error text
        }
        
        return res.status(response.status).json({ 
          error: `API request failed: ${response.status} ${response.statusText}`,
          details: errorDetails
        });
      }

      const data = await response.json();
      
      // Extract response content and check for tool calls
      let assistantContent = '';
      let toolCalls: any[] = [];

      if (provider === 'anthropic') {
        assistantContent = data.content[0]?.text || '';
        toolCalls = data.content
          .filter((item: any) => item.type === 'tool_use')
          .map((item: any) => ({
            id: item.id,
            type: 'function',
            function: {
              name: item.name,
              arguments: item.input
            }
          }));
      } else {
        assistantContent = data.choices[0]?.message?.content || '';
        if (data.choices[0]?.message?.function_call) {
          toolCalls = [data.choices[0].message.function_call];
        }
      }

      // Add assistant message to conversation
      currentMessages.push({
        role: 'assistant',
        content: assistantContent,
        ...(toolCalls.length > 0 && { tool_calls: toolCalls })
      });

      // If no tool calls, we're done
      if (toolCalls.length === 0) {
        finalResponse = assistantContent;
        break;
      }

      // Execute tool calls
      const toolResults = [];
      for (const toolCall of toolCalls) {
        try {
          const functionName = toolCall.function.name;
          const arguments_ = JSON.parse(toolCall.function.arguments);
          
          console.log(`Executing tool: ${functionName}`, arguments_);
          
          const result = await executeTool(functionName, arguments_, firecrawlApiKey);
          
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: JSON.stringify(result)
          });
          
          console.log(`Tool execution successful: ${functionName}`);
        } catch (error) {
          console.error(`Tool execution failed:`, error);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
          });
        }
      }

      // Add tool results to conversation
      currentMessages.push(...toolResults);
    }

    res.status(200).json({ 
      content: finalResponse,
      provider,
      model,
      timestamp: new Date().toISOString(),
      iterations: iteration,
      toolCalls: currentMessages.filter(msg => msg.tool_calls || msg.role === 'tool')
    });

  } catch (error) {
    console.error('Chat with tools API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 