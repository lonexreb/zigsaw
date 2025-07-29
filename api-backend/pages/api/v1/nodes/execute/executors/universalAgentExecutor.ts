interface NodeExecutionRequest {
  nodeId: string;
  config: {
    provider?: string;
    model?: string;
    systemPrompt?: string;
    userPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    tools?: any[];
    apiKey?: string;
    [key: string]: any;
  };
  inputData?: any;
  workflowContext?: {
    executionId: string;
    variables: Record<string, any>;
  };
}

interface NodeExecutionResponse {
  success: boolean;
  nodeId: string;
  executionId?: string;
  outputData: {
    type: 'text' | 'json' | 'error' | 'stream';
    content: string | any;
    metadata?: {
      model?: string;
      provider?: string;
      tokens_used?: number;
      cost_usd?: number;
      execution_time_ms: number;
      tool_calls?: any[];
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export async function executeUniversalAgentInternal(
  request: NodeExecutionRequest,
  executionId: string
): Promise<NodeExecutionResponse> {
  const startTime = Date.now();
  
  try {
    console.log('🤖 Universal Agent execution started:', {
      nodeId: request.nodeId,
      provider: request.config.provider,
      model: request.config.model,
      hasTools: !!request.config.tools?.length,
      hasInputData: !!request.inputData
    });

    // Extract and validate configuration
    const {
      provider = 'groq',
      model = 'llama-3.1-8b-instant',
      systemPrompt = 'You are a helpful AI assistant.',
      userPrompt = '',
      temperature = 0.7,
      maxTokens = 1000,
      tools = [],
      apiKey
    } = request.config;

    // Validate required fields
    if (!provider) {
      throw new Error('Provider is required for Universal Agent');
    }

    if (!model) {
      throw new Error('Model is required for Universal Agent');
    }

    // Build user message from userPrompt and inputData
    let userMessage = userPrompt || '';
    
    // If we have input data from previous nodes, incorporate it
    if (request.inputData) {
      if (typeof request.inputData === 'string') {
        userMessage = request.inputData;
      } else if (request.inputData.content) {
        userMessage = request.inputData.content;
      } else if (request.inputData.text) {
        userMessage = request.inputData.text;
      } else {
        // JSON input data - include it in the user message
        userMessage = `${userMessage}\n\nInput data: ${JSON.stringify(request.inputData, null, 2)}`;
      }
    }

    if (!userMessage.trim()) {
      userMessage = 'Hello! How can I help you today?';
    }

    // Prepare messages for the API
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    // Determine which endpoint to use based on tools
    const hasTools = tools && tools.length > 0;
    const endpoint = hasTools ? 'chat-with-tools' : 'chat';

    console.log(`📡 Calling ${endpoint} API:`, {
      provider,
      model,
      messagesCount: messages.length,
      toolsCount: tools.length
    });

    // Prepare request body similar to existing chat APIs
    const requestBody: any = {
      provider,
      model,
      messages,
      systemPrompt,
      temperature,
      maxTokens,
      apiKey
    };

    // Add tools if present
    if (hasTools) {
      // Extract tool IDs from tool objects for chat-with-tools endpoint
      const toolIds = tools.map((tool: any) => {
        if (typeof tool === 'string') {
          return tool; // Already a tool ID
        } else if (tool.id) {
          return tool.id; // Extract ID from tool object
        } else if (tool.name) {
          return tool.name; // Use name as ID
        }
        return null;
      }).filter(Boolean);
      
      requestBody.tools = toolIds;
      requestBody.maxIterations = 5; // Default max iterations for tool usage
      
      console.log('🔧 Extracted tool IDs:', toolIds);
    }

    // Make the API call to our existing chat endpoint
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `API request failed: ${response.status} ${response.statusText}`);
    }

    const apiResult = await response.json();
    console.log('📡 API response received:', {
      hasContent: !!apiResult.content,
      hasToolCalls: !!apiResult.tool_calls?.length,
      contentLength: typeof apiResult.content === 'string' ? apiResult.content.length : 0
    });

    // Extract content and metadata
    const content = apiResult.content || '';
    const toolCalls = apiResult.tool_calls || [];
    
    // Calculate execution metadata
    const executionTime = Date.now() - startTime;
    const metadata = {
      model,
      provider,
      execution_time_ms: executionTime,
      tool_calls: toolCalls,
      // Add token usage if available
      ...(apiResult.usage && {
        tokens_used: apiResult.usage.total_tokens,
        cost_usd: calculateCost(provider, model, apiResult.usage.total_tokens)
      })
    };

    // Determine output type
    let outputType: 'text' | 'json' = 'text';
    let outputContent: string | any = content;

    // Try to parse as JSON if it looks like JSON
    if (typeof content === 'string' && content.trim().startsWith('{')) {
      try {
        const jsonContent = JSON.parse(content);
        outputType = 'json';
        outputContent = jsonContent;
      } catch {
        // Keep as text if JSON parsing fails
      }
    }

    const result: NodeExecutionResponse = {
      success: true,
      nodeId: request.nodeId,
      executionId,
      outputData: {
        type: outputType,
        content: outputContent,
        metadata
      }
    };

    console.log('✅ Universal Agent execution completed:', {
      nodeId: request.nodeId,
      executionTime,
      outputType,
      toolCallsCount: toolCalls.length
    });

    return result;

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('❌ Universal Agent execution failed:', error);
    
    return {
      success: false,
      nodeId: request.nodeId,
      executionId,
      outputData: {
        type: 'error',
        content: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: { execution_time_ms: executionTime }
      },
      error: {
        code: 'EXECUTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    };
  }
}

// Simple cost calculation (placeholder - can be enhanced)
function calculateCost(provider: string, model: string, tokens: number): number {
  // Basic cost estimation per 1000 tokens
  const costPer1000Tokens: Record<string, Record<string, number>> = {
    'anthropic': {
      'claude-3-5-sonnet-20241022': 0.003,
      'claude-3-opus-20240229': 0.015,
      'claude-3-haiku-20240307': 0.00025
    },
    'openai': {
      'gpt-4o': 0.005,
      'gpt-4o-mini': 0.00015,
      'gpt-4-turbo': 0.01
    },
    'groq': {
      'llama-3.1-8b-instant': 0.0001,
      'llama-3.1-405b-reasoning': 0.001,
      'mixtral-8x7b-32768': 0.0005
    }
  };

  const providerCosts = costPer1000Tokens[provider];
  if (!providerCosts) return 0;

  const modelCost = providerCosts[model];
  if (!modelCost) return 0;

  return (tokens / 1000) * modelCost;
} 