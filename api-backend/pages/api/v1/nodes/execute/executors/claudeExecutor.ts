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

// Claude-specific model configurations
const CLAUDE_MODELS = {
  'claude-3-5-sonnet-20241022': {
    contextLength: 200000,
    capabilities: ['text', 'vision', 'tools', 'reasoning'],
    costPer1000Tokens: { input: 0.003, output: 0.015 },
    maxTokens: 8192,
    description: 'Most capable model with advanced reasoning'
  },
  'claude-3-opus-20240229': {
    contextLength: 200000,
    capabilities: ['text', 'vision', 'tools', 'complex-reasoning'],
    costPer1000Tokens: { input: 0.015, output: 0.075 },
    maxTokens: 4096,
    description: 'Highest intelligence for complex tasks'
  },
  'claude-3-haiku-20240307': {
    contextLength: 200000,
    capabilities: ['text', 'vision', 'tools', 'speed'],
    costPer1000Tokens: { input: 0.00025, output: 0.00125 },
    maxTokens: 4096,
    description: 'Fastest model for quick responses'
  }
};

export async function executeClaudeInternal(
  request: NodeExecutionRequest,
  executionId: string
): Promise<NodeExecutionResponse> {
  const startTime = Date.now();
  
  try {
    console.log('🧠 Claude execution started:', {
      nodeId: request.nodeId,
      model: request.config.model,
      hasInputData: !!request.inputData,
      hasTools: !!request.config.tools?.length
    });

    // Extract and validate configuration with Claude-specific defaults
    const {
      model = 'claude-3-5-sonnet-20241022',
      systemPrompt = 'You are Claude, an AI assistant created by Anthropic. You are helpful, harmless, and honest.',
      userPrompt = '',
      temperature = 0.7,
      maxTokens = 1000,
      tools = [],
      apiKey
    } = request.config;

    // Validate model is supported
    if (!CLAUDE_MODELS[model as keyof typeof CLAUDE_MODELS]) {
      throw new Error(`Unsupported Claude model: ${model}. Supported models: ${Object.keys(CLAUDE_MODELS).join(', ')}`);
    }

    const modelConfig = CLAUDE_MODELS[model as keyof typeof CLAUDE_MODELS];

    // Validate API key
    const claudeApiKey = apiKey || process.env.CLAUDE_API_KEY;
    if (!claudeApiKey) {
      throw new Error('Claude API key is required. Please provide it in the config or set CLAUDE_API_KEY environment variable.');
    }

    // Build user message from userPrompt and inputData
    let userMessage = userPrompt || '';
    
    // If we have input data from previous nodes, incorporate it with Claude's analytical strengths
    if (request.inputData) {
      if (typeof request.inputData === 'string') {
        userMessage = request.inputData;
      } else if (request.inputData.content) {
        userMessage = request.inputData.content;
      } else if (request.inputData.text) {
        userMessage = request.inputData.text;
      } else {
        // For complex data, leverage Claude's reasoning capabilities
        userMessage = `${userMessage}\n\nPlease analyze and provide insights on the following data. Use your reasoning capabilities to identify patterns, extract key information, and provide actionable insights:\n\n${JSON.stringify(request.inputData, null, 2)}`;
      }
    }

    if (!userMessage.trim()) {
      userMessage = 'Hello! I\'d like to engage in a thoughtful conversation. How can you help me today?';
    }

    // Enhance system prompt for Claude's capabilities
    const enhancedSystemPrompt = `${systemPrompt}

You have access to advanced reasoning capabilities. When analyzing data or solving problems:
1. Think step by step through complex problems
2. Consider multiple perspectives and potential edge cases
3. Provide clear, well-structured responses
4. Be thorough but concise in your analysis

${modelConfig.capabilities.includes('vision') ? 'You can analyze images if provided.' : ''}
${tools.length > 0 ? 'You have access to tools - use them when they would be helpful for the task.' : ''}`;

    // Prepare messages for Claude API format
    const messages = [
      { role: 'user', content: userMessage }
    ];

    console.log('📡 Calling Claude API:', {
      model,
      messagesCount: messages.length,
      capabilities: modelConfig.capabilities,
      hasTools: tools.length > 0,
      contextLength: modelConfig.contextLength
    });

    // Determine endpoint based on tools
    const hasTools = tools && tools.length > 0;
    const endpoint = hasTools ? 'chat-with-tools' : 'chat';

    // Prepare request body for Claude
    const requestBody: any = {
      provider: 'anthropic',
      model,
      messages,
      systemPrompt: enhancedSystemPrompt,
      temperature,
      maxTokens: Math.min(maxTokens, modelConfig.maxTokens),
      apiKey: claudeApiKey
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
      requestBody.maxIterations = 5; // Claude can handle more complex tool interactions
      
      console.log('🔧 Claude extracted tool IDs:', toolIds);
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
      throw new Error(errorData.error || `Claude API request failed: ${response.status} ${response.statusText}`);
    }

    const apiResult = await response.json();
    const executionTime = Date.now() - startTime;
    
    console.log('🧠 Claude API response received:', {
      hasContent: !!apiResult.content,
      executionTime,
      model,
      contentLength: typeof apiResult.content === 'string' ? apiResult.content.length : 0,
      hasToolCalls: !!apiResult.tool_calls?.length
    });

    // Extract content and tool calls
    let content = '';
    let toolCalls = [];

    // Handle Claude's response format
    if (Array.isArray(apiResult.content)) {
      // Claude returns array of content blocks
      content = apiResult.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');
    } else if (typeof apiResult.content === 'string') {
      content = apiResult.content;
    } else if (apiResult.content?.text) {
      content = apiResult.content.text;
    }

    if (apiResult.tool_calls) {
      toolCalls = apiResult.tool_calls;
    }

    // Calculate cost based on Claude's pricing
    const estimatedInputTokens = Math.ceil(userMessage.length / 4);
    const estimatedOutputTokens = Math.ceil(content.length / 4);
    const inputCost = (estimatedInputTokens / 1000) * modelConfig.costPer1000Tokens.input;
    const outputCost = (estimatedOutputTokens / 1000) * modelConfig.costPer1000Tokens.output;
    const totalCost = inputCost + outputCost;

    // Build metadata with Claude-specific information
    const metadata = {
      model,
      provider: 'anthropic',
      execution_time_ms: executionTime,
      capabilities: modelConfig.capabilities,
      context_length: modelConfig.contextLength,
      estimated_input_tokens: estimatedInputTokens,
      estimated_output_tokens: estimatedOutputTokens,
      cost_usd: totalCost,
      tool_calls: toolCalls,
      // Add actual usage data if available from API
      ...(apiResult.usage && {
        tokens_used: apiResult.usage.total_tokens,
        input_tokens: apiResult.usage.input_tokens,
        output_tokens: apiResult.usage.output_tokens,
        cost_usd: (apiResult.usage.input_tokens / 1000) * modelConfig.costPer1000Tokens.input + 
                 (apiResult.usage.output_tokens / 1000) * modelConfig.costPer1000Tokens.output
      })
    };

    // Determine output type and format
    let outputType: 'text' | 'json' = 'text';
    let outputContent: string | any = content;

    // Try to parse JSON responses (Claude is good at structured output)
    if (typeof content === 'string' && (content.trim().startsWith('{') || content.trim().startsWith('['))) {
      try {
        const jsonContent = JSON.parse(content.trim());
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

    console.log('✅ Claude execution completed:', {
      nodeId: request.nodeId,
      executionTime,
      model,
      outputType,
      toolCallsCount: toolCalls.length,
      estimatedCost: totalCost.toFixed(4)
    });

    return result;

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('❌ Claude execution failed:', error);
    
    return {
      success: false,
      nodeId: request.nodeId,
      executionId,
      outputData: {
        type: 'error',
        content: error instanceof Error ? error.message : 'Claude execution failed',
        metadata: { 
          execution_time_ms: executionTime,
          provider: 'anthropic'
        }
      },
      error: {
        code: 'CLAUDE_EXECUTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    };
  }
} 