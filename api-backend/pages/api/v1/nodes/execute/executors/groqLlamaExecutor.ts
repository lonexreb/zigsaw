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

// Groq-specific model configurations
const GROQ_MODELS = {
  'llama-3.1-8b-instant': {
    contextLength: 131072,
    speed: 'ultra-fast',
    costPer1000Tokens: 0.05,
    supportsTools: false
  },
  'llama-3.1-405b-reasoning': {
    contextLength: 131072,
    speed: 'fast',
    costPer1000Tokens: 0.59,
    supportsTools: false
  },
  'mixtral-8x7b-32768': {
    contextLength: 32768,
    speed: 'fast',
    costPer1000Tokens: 0.24,
    supportsTools: false
  },
  'gemma2-9b-it': {
    contextLength: 8192,
    speed: 'ultra-fast',
    costPer1000Tokens: 0.20,
    supportsTools: false
  },
  'llama3-groq-70b-8192-tool-use-preview': {
    contextLength: 8192,
    speed: 'fast',
    costPer1000Tokens: 0.89,
    supportsTools: true
  },
  'llama3-groq-8b-8192-tool-use-preview': {
    contextLength: 8192,
    speed: 'ultra-fast', 
    costPer1000Tokens: 0.19,
    supportsTools: true
  }
};

export async function executeGroqLlamaInternal(
  request: NodeExecutionRequest,
  executionId: string
): Promise<NodeExecutionResponse> {
  const startTime = Date.now();
  
  try {
    console.log('⚡ GroqLlama execution started:', {
      nodeId: request.nodeId,
      model: request.config.model,
      hasInputData: !!request.inputData
    });

    // Extract and validate configuration with Groq-specific defaults
    const {
      model = 'llama-3.1-8b-instant',
      systemPrompt = 'You are a helpful AI assistant powered by Groq for ultra-fast responses.',
      userPrompt = '',
      temperature = 0.7,
      maxTokens = 1000,
      tools = []
    } = request.config;

    // Validate model is supported
    if (!GROQ_MODELS[model as keyof typeof GROQ_MODELS]) {
      throw new Error(`Unsupported Groq model: ${model}. Supported models: ${Object.keys(GROQ_MODELS).join(', ')}`);
    }

    const modelConfig = GROQ_MODELS[model as keyof typeof GROQ_MODELS];

    // Check if tools are requested but model doesn't support them
    if (tools.length > 0 && !modelConfig.supportsTools) {
      console.warn(`⚠️ Model ${model} does not support tools. Using llama3-groq-70b-8192-tool-use-preview instead.`);
      // Auto-switch to tool-capable model
      request.config.model = 'llama3-groq-70b-8192-tool-use-preview';
    }

    // Build user message from userPrompt and inputData
    let userMessage = userPrompt || '';
    
    // If we have input data from previous nodes, incorporate it intelligently
    if (request.inputData) {
      if (typeof request.inputData === 'string') {
        userMessage = request.inputData;
      } else if (request.inputData.content) {
        userMessage = request.inputData.content;
      } else if (request.inputData.text) {
        userMessage = request.inputData.text;
      } else {
        // For complex data, provide structured context
        userMessage = `${userMessage}\n\nPlease analyze the following data:\n${JSON.stringify(request.inputData, null, 2)}`;
      }
    }

    if (!userMessage.trim()) {
      userMessage = 'Hello! I need your help with a task.';
    }

    // Optimize prompt for Groq's speed
    const optimizedSystemPrompt = `${systemPrompt}\n\nImportant: Provide concise, accurate responses optimized for speed. Be direct and helpful.`;

    // Prepare messages for the API
    const messages = [
      { role: 'system', content: optimizedSystemPrompt },
      { role: 'user', content: userMessage }
    ];

    console.log('📡 Calling Groq API:', {
      model: request.config.model,
      messagesCount: messages.length,
      expectedSpeed: modelConfig.speed,
      contextLength: modelConfig.contextLength
    });

    // Use the environment Groq API key
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured in environment');
    }

    // Prepare request body for Groq
    const requestBody: any = {
      provider: 'groq',
      model: request.config.model,
      messages,
      systemPrompt: optimizedSystemPrompt,
      temperature,
      maxTokens: Math.min(maxTokens, modelConfig.contextLength), // Respect model limits
      // Don't send API key in request body - it's handled by environment
    };

    // Add tools if supported and present
    if (tools.length > 0 && modelConfig.supportsTools) {
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
      requestBody.maxIterations = 3; // Lower iterations for speed
      
      console.log('🔧 Groq extracted tool IDs:', toolIds);
    }

    // Make the API call to our existing chat endpoint
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const endpoint = (tools.length > 0 && modelConfig.supportsTools) ? 'chat-with-tools' : 'chat';
    
    const response = await fetch(`${baseUrl}/api/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Groq API request failed: ${response.status} ${response.statusText}`);
    }

    const apiResult = await response.json();
    const executionTime = Date.now() - startTime;
    
    console.log('⚡ Groq API response received:', {
      hasContent: !!apiResult.content,
      executionTime,
      speed: modelConfig.speed,
      contentLength: typeof apiResult.content === 'string' ? apiResult.content.length : 0
    });

    // Extract content
    const content = apiResult.content || '';
    const toolCalls = apiResult.tool_calls || [];
    
    // Calculate cost based on Groq pricing
    const estimatedTokens = Math.ceil((userMessage.length + content.length) / 4); // Rough estimation
    const cost = (estimatedTokens / 1000) * modelConfig.costPer1000Tokens;

    // Build metadata with Groq-specific information
    const metadata = {
      model: request.config.model,
      provider: 'groq',
      execution_time_ms: executionTime,
      speed_category: modelConfig.speed,
      context_length: modelConfig.contextLength,
      estimated_tokens: estimatedTokens,
      cost_usd: cost,
      tool_calls: toolCalls,
      // Add usage data if available from API
      ...(apiResult.usage && {
        tokens_used: apiResult.usage.total_tokens,
        cost_usd: (apiResult.usage.total_tokens / 1000) * modelConfig.costPer1000Tokens
      })
    };

    // Determine output type and format
    let outputType: 'text' | 'json' = 'text';
    let outputContent: string | any = content;

    // Try to parse JSON responses
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

    console.log('✅ GroqLlama execution completed:', {
      nodeId: request.nodeId,
      executionTime,
      model: request.config.model,
      speed: modelConfig.speed,
      outputType,
      estimatedCost: cost
    });

    return result;

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('❌ GroqLlama execution failed:', error);
    
    return {
      success: false,
      nodeId: request.nodeId,
      executionId,
      outputData: {
        type: 'error',
        content: error instanceof Error ? error.message : 'GroqLlama execution failed',
        metadata: { 
          execution_time_ms: executionTime,
          provider: 'groq'
        }
      },
      error: {
        code: 'GROQ_EXECUTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    };
  }
} 