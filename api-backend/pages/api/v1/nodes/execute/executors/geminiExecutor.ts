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

// Gemini-specific model configurations
const GEMINI_MODELS = {
  'gemini-1.5-pro': {
    contextLength: 2000000, // 2M tokens!
    capabilities: ['text', 'vision', 'audio', 'video', 'tools', 'code'],
    costPer1000Tokens: { input: 0.00125, output: 0.005 },
    maxTokens: 8192,
    description: 'Most capable model with massive context',
    supportsTools: true,
    supportsVision: true
  },
  'gemini-1.5-flash': {
    contextLength: 1000000, // 1M tokens
    capabilities: ['text', 'vision', 'audio', 'video', 'tools', 'speed'],
    costPer1000Tokens: { input: 0.000075, output: 0.0003 },
    maxTokens: 8192,
    description: 'Fast model optimized for speed and efficiency',
    supportsTools: true,
    supportsVision: true
  },
  'gemini-1.0-pro': {
    contextLength: 32000,
    capabilities: ['text', 'tools'],
    costPer1000Tokens: { input: 0.0005, output: 0.0015 },
    maxTokens: 2048,
    description: 'Reliable model for text tasks',
    supportsTools: true,
    supportsVision: false
  }
};

// Safety settings for Gemini
const DEFAULT_SAFETY_SETTINGS = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  }
];

export async function executeGeminiInternal(
  request: NodeExecutionRequest,
  executionId: string
): Promise<NodeExecutionResponse> {
  const startTime = Date.now();
  
  try {
    console.log('💎 Gemini execution started:', {
      nodeId: request.nodeId,
      model: request.config.model,
      hasInputData: !!request.inputData,
      hasTools: !!request.config.tools?.length
    });

    // Extract and validate configuration with Gemini-specific defaults
    const {
      model = 'gemini-1.5-flash',
      systemPrompt = 'You are Gemini, a helpful AI assistant created by Google. You are capable of processing text, images, audio, and video.',
      userPrompt = '',
      temperature = 0.7,
      maxTokens = 1000,
      tools = [],
      apiKey
    } = request.config;

    // Validate model is supported
    if (!GEMINI_MODELS[model as keyof typeof GEMINI_MODELS]) {
      throw new Error(`Unsupported Gemini model: ${model}. Supported models: ${Object.keys(GEMINI_MODELS).join(', ')}`);
    }

    const modelConfig = GEMINI_MODELS[model as keyof typeof GEMINI_MODELS];

    // Validate API key
    const geminiApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('Gemini API key is required. Please provide it in the config or set GEMINI_API_KEY/GOOGLE_AI_API_KEY environment variable.');
    }

    // Build user message from userPrompt and inputData
    let userMessage = userPrompt || '';
    
    // If we have input data from previous nodes, incorporate it with Gemini's multimodal capabilities
    if (request.inputData) {
      if (typeof request.inputData === 'string') {
        userMessage = request.inputData;
      } else if (request.inputData.content) {
        userMessage = request.inputData.content;
      } else if (request.inputData.text) {
        userMessage = request.inputData.text;
      } else {
        // For complex data, leverage Gemini's analytical capabilities
        userMessage = `${userMessage}\n\nPlease analyze the following data with your multimodal capabilities. Provide comprehensive insights and identify any patterns or important information:\n\n${JSON.stringify(request.inputData, null, 2)}`;
      }
    }

    if (!userMessage.trim()) {
      userMessage = 'Hello! I\'m ready to help you with text, image, audio, video, or any other task. What can I do for you?';
    }

    // Build the request body for Gemini API
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\nUser: ${userMessage}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: Math.min(maxTokens, modelConfig.maxTokens),
        topP: 0.8,
        topK: 40
      },
      safetySettings: DEFAULT_SAFETY_SETTINGS
    };

    // Add tools if supported and present
    if (tools.length > 0 && modelConfig.supportsTools) {
      // Convert our tool format to Gemini's function calling format
      (requestBody as any).tools = [{
        functionDeclarations: tools.map(tool => ({
          name: tool.name || tool.id,
          description: tool.description,
          parameters: {
            type: 'object',
            properties: tool.parameters?.reduce((acc: any, param: any) => {
              acc[param.name] = {
                type: param.type,
                description: param.description
              };
              return acc;
            }, {}) || {},
            required: tool.parameters?.filter((p: any) => p.required).map((p: any) => p.name) || []
          }
        }))
      }];
    }

    console.log('📡 Calling Gemini API:', {
      model,
      capabilities: modelConfig.capabilities,
      hasTools: tools.length > 0 && modelConfig.supportsTools,
      contextLength: modelConfig.contextLength,
      messageLength: userMessage.length
    });

    // Make the API call to Google's Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(errorData.error?.message || `Gemini API request failed: ${response.status} ${response.statusText}`);
    }

    const apiResult = await response.json();
    const executionTime = Date.now() - startTime;
    
    console.log('💎 Gemini API response received:', {
      hasContent: !!apiResult.candidates?.[0]?.content,
      executionTime,
      model,
      candidatesCount: apiResult.candidates?.length || 0
    });

    // Extract content from Gemini's response format
    let content = '';
    let toolCalls: any[] = [];

    if (apiResult.candidates && apiResult.candidates.length > 0) {
      const candidate = apiResult.candidates[0];
      
      if (candidate.content && candidate.content.parts) {
        // Extract text content
        const textParts = candidate.content.parts
          .filter((part: any) => part.text)
          .map((part: any) => part.text);
        content = textParts.join('\n');

        // Extract function calls if present
        const functionCalls = candidate.content.parts
          .filter((part: any) => part.functionCall)
          .map((part: any) => part.functionCall);
        
        if (functionCalls.length > 0) {
          toolCalls = functionCalls.map((call: any) => ({
            id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'function',
            function: {
              name: call.name,
              arguments: JSON.stringify(call.args || {})
            }
          }));
        }
      }
    }

    // Handle blocked content
    if (!content && apiResult.candidates?.[0]?.finishReason === 'SAFETY') {
      content = 'Content was blocked due to safety filters. Please try rephrasing your request.';
    }

    // Calculate cost based on Gemini's pricing
    const estimatedInputTokens = Math.ceil(userMessage.length / 4);
    const estimatedOutputTokens = Math.ceil(content.length / 4);
    const inputCost = (estimatedInputTokens / 1000) * modelConfig.costPer1000Tokens.input;
    const outputCost = (estimatedOutputTokens / 1000) * modelConfig.costPer1000Tokens.output;
    const totalCost = inputCost + outputCost;

    // Build metadata with Gemini-specific information
    const metadata = {
      model,
      provider: 'google',
      execution_time_ms: executionTime,
      capabilities: modelConfig.capabilities,
      context_length: modelConfig.contextLength,
      estimated_input_tokens: estimatedInputTokens,
      estimated_output_tokens: estimatedOutputTokens,
      cost_usd: totalCost,
      tool_calls: toolCalls,
      safety_ratings: apiResult.candidates?.[0]?.safetyRatings,
      finish_reason: apiResult.candidates?.[0]?.finishReason,
      // Add actual usage data if available
      ...(apiResult.usageMetadata && {
        tokens_used: apiResult.usageMetadata.totalTokenCount,
        input_tokens: apiResult.usageMetadata.promptTokenCount,
        output_tokens: apiResult.usageMetadata.candidatesTokenCount,
        cost_usd: (apiResult.usageMetadata.promptTokenCount / 1000) * modelConfig.costPer1000Tokens.input + 
                 (apiResult.usageMetadata.candidatesTokenCount / 1000) * modelConfig.costPer1000Tokens.output
      })
    };

    // Determine output type and format
    let outputType: 'text' | 'json' = 'text';
    let outputContent: string | any = content;

    // Try to parse JSON responses (Gemini is good at structured output)
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

    console.log('✅ Gemini execution completed:', {
      nodeId: request.nodeId,
      executionTime,
      model,
      outputType,
      toolCallsCount: toolCalls.length,
      estimatedCost: totalCost.toFixed(6)
    });

    return result;

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('❌ Gemini execution failed:', error);
    
    return {
      success: false,
      nodeId: request.nodeId,
      executionId,
      outputData: {
        type: 'error',
        content: error instanceof Error ? error.message : 'Gemini execution failed',
        metadata: { 
          execution_time_ms: executionTime,
          provider: 'google'
        }
      },
      error: {
        code: 'GEMINI_EXECUTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    };
  }
} 