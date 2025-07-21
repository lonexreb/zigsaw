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
  }
};

// Execute a tool based on the function call
async function executeTool(functionName: string, arguments_: any, firecrawlApiKey?: string) {
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
            } catch (e) {
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