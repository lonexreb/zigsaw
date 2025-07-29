import { NextApiRequest, NextApiResponse } from 'next';

// Types for node execution
interface NodeExecutionRequest {
  nodeId: string;
  config: {
    provider?: string;        // anthropic, openai, groq, google
    model?: string;          // model name
    systemPrompt?: string;   // system instructions
    userPrompt?: string;     // user input
    temperature?: number;    // 0-1
    maxTokens?: number;      // token limit
    tools?: any[];          // enabled tools
    apiKey?: string;         // provider API key
    [key: string]: any;     // Additional node-specific config
  };
  inputData?: any;           // From previous nodes in workflow
  workflowContext?: {        // Shared workflow state
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

// Supported node types
const SUPPORTED_NODE_TYPES = [
  'universal-agent',
  'groq-llama', 
  'claude',
  'gemini'
] as const;

type NodeType = typeof SUPPORTED_NODE_TYPES[number];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NodeExecutionResponse>
) {
  const startTime = Date.now();
  const { nodeType } = req.query;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      nodeId: '',
      outputData: { type: 'error', content: 'Method not allowed' },
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are supported'
      }
    });
  }

  try {
    // Validate node type
    if (!nodeType || typeof nodeType !== 'string') {
      return res.status(400).json({
        success: false,
        nodeId: '',
        outputData: { type: 'error', content: 'Invalid node type' },
        error: {
          code: 'INVALID_NODE_TYPE',
          message: 'Node type is required and must be a string'
        }
      });
    }

    const normalizedNodeType = nodeType.toLowerCase();
    if (!SUPPORTED_NODE_TYPES.includes(normalizedNodeType as NodeType)) {
      return res.status(400).json({
        success: false,
        nodeId: '',
        outputData: { type: 'error', content: 'Unsupported node type' },
        error: {
          code: 'UNSUPPORTED_NODE_TYPE',
          message: `Node type '${nodeType}' is not supported. Supported types: ${SUPPORTED_NODE_TYPES.join(', ')}`
        }
      });
    }

    // Validate request body
    const body = req.body as NodeExecutionRequest;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        success: false,
        nodeId: '',
        outputData: { type: 'error', content: 'Invalid request body' },
        error: {
          code: 'INVALID_REQUEST_BODY',
          message: 'Request body is required and must be a valid JSON object'
        }
      });
    }

    // Validate required fields
    if (!body.nodeId || typeof body.nodeId !== 'string') {
      return res.status(400).json({
        success: false,
        nodeId: '',
        outputData: { type: 'error', content: 'Invalid nodeId' },
        error: {
          code: 'INVALID_NODE_ID',
          message: 'nodeId is required and must be a string'
        }
      });
    }

    if (!body.config || typeof body.config !== 'object') {
      return res.status(400).json({
        success: false,
        nodeId: body.nodeId,
        outputData: { type: 'error', content: 'Invalid config' },
        error: {
          code: 'INVALID_CONFIG',
          message: 'config is required and must be an object'
        }
      });
    }

    console.log(`🚀 Executing ${normalizedNodeType} node:`, {
      nodeId: body.nodeId,
      provider: body.config.provider,
      model: body.config.model,
      hasInputData: !!body.inputData,
      hasWorkflowContext: !!body.workflowContext
    });

    // Generate execution ID if not provided
    const executionId = body.workflowContext?.executionId || `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Route to specific node executor
    let result: NodeExecutionResponse;
    
    switch (normalizedNodeType as NodeType) {
      case 'universal-agent':
        result = await executeUniversalAgent(body, executionId);
        break;
      case 'groq-llama':
        result = await executeGroqLlama(body, executionId);
        break;
      case 'claude':
        result = await executeClaude(body, executionId);
        break;
      case 'gemini':
        result = await executeGemini(body, executionId);
        break;
      default:
        throw new Error(`Unhandled node type: ${normalizedNodeType}`);
    }

    // Add execution metadata
    const executionTime = Date.now() - startTime;
    if (result.outputData.metadata) {
      result.outputData.metadata.execution_time_ms = executionTime;
    } else {
      result.outputData.metadata = { execution_time_ms: executionTime };
    }

    console.log(`✅ ${normalizedNodeType} execution completed:`, {
      nodeId: body.nodeId,
      success: result.success,
      executionTime,
      outputType: result.outputData.type
    });

    return res.status(200).json(result);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ Node execution error:`, error);
    
    return res.status(500).json({
      success: false,
      nodeId: req.body?.nodeId || '',
      outputData: { 
        type: 'error', 
        content: 'Internal server error',
        metadata: { execution_time_ms: executionTime }
      },
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    });
  }
}

// Individual node executors
async function executeUniversalAgent(
  request: NodeExecutionRequest, 
  executionId: string
): Promise<NodeExecutionResponse> {
  try {
    // Import and leverage existing chat-with-tools functionality
    const { executeUniversalAgentInternal } = await import('./executors/universalAgentExecutor');
    return await executeUniversalAgentInternal(request, executionId);
  } catch (error) {
    console.error('Universal Agent execution error:', error);
    return {
      success: false,
      nodeId: request.nodeId,
      executionId,
      outputData: {
        type: 'error',
        content: 'Universal Agent execution failed',
        metadata: { execution_time_ms: 0 }
      },
      error: {
        code: 'UNIVERSAL_AGENT_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

async function executeGroqLlama(
  request: NodeExecutionRequest,
  executionId: string  
): Promise<NodeExecutionResponse> {
  try {
    // Import and leverage existing Groq functionality
    const { executeGroqLlamaInternal } = await import('./executors/groqLlamaExecutor');
    return await executeGroqLlamaInternal(request, executionId);
  } catch (error) {
    console.error('GroqLlama execution error:', error);
    return {
      success: false,
      nodeId: request.nodeId,
      executionId,
      outputData: {
        type: 'error',
        content: 'GroqLlama execution failed',
        metadata: { execution_time_ms: 0 }
      },
      error: {
        code: 'GROQ_LLAMA_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

async function executeClaude(
  request: NodeExecutionRequest,
  executionId: string
): Promise<NodeExecutionResponse> {
  try {
    // Import and leverage existing Claude functionality
    const { executeClaudeInternal } = await import('./executors/claudeExecutor');
    return await executeClaudeInternal(request, executionId);
  } catch (error) {
    console.error('Claude execution error:', error);
    return {
      success: false,
      nodeId: request.nodeId,
      executionId,
      outputData: {
        type: 'error',
        content: 'Claude execution failed',
        metadata: { execution_time_ms: 0 }
      },
      error: {
        code: 'CLAUDE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

async function executeGemini(
  request: NodeExecutionRequest,
  executionId: string
): Promise<NodeExecutionResponse> {
  try {
    // Import new Gemini functionality
    const { executeGeminiInternal } = await import('./executors/geminiExecutor');
    return await executeGeminiInternal(request, executionId);
  } catch (error) {
    console.error('Gemini execution error:', error);
    return {
      success: false,
      nodeId: request.nodeId,
      executionId,
      outputData: {
        type: 'error',
        content: 'Gemini execution failed',
        metadata: { execution_time_ms: 0 }
      },
      error: {
        code: 'GEMINI_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
} 