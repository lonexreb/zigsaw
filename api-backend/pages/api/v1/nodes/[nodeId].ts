import { NextApiRequest, NextApiResponse } from 'next';

interface NodeConfig {
  type: 'universal_agent' | 'trigger';
  name: string;
  description: string;
  position: { x: number; y: number };
  workflow_id: string;
  config: {
    model?: string;
    prompt?: string;
    tools?: string[];
    max_iterations?: number;
    temperature?: number;
    trigger_type?: string;
    eventData?: string;
  };
}

interface NodeResponseData {
  node_id: string;
  type: 'universal_agent' | 'trigger';
  name: string;
  description: string;
  position: { x: number; y: number };
  workflow_id: string;
  config: {
    model?: string;
    prompt?: string;
    tools?: string[];
    max_iterations?: number;
    temperature?: number;
    trigger_type?: string;
    eventData?: string;
  };
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: NodeResponseData;
  node_id?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { nodeId } = req.query;
  const { method } = req;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Validate nodeId
  if (!nodeId || typeof nodeId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Invalid node ID provided'
    });
  }

  try {
    switch (method) {
      case 'PUT':
        return await handlePutNode(req, res, nodeId);
      case 'DELETE':
        return await handleDeleteNode(req, res, nodeId);
      default:
        res.setHeader('Allow', ['PUT', 'DELETE']);
        return res.status(405).json({
          success: false,
          message: `Method ${method} Not Allowed`
        });
    }
  } catch (error) {
    console.error('Node API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

async function handlePutNode(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  nodeId: string
) {
  const { body } = req;

  // Validate request body
  if (!body) {
    return res.status(400).json({
      success: false,
      message: 'Request body is required'
    });
  }

  // Validate required fields
  const requiredFields = ['type', 'name', 'description', 'position', 'workflow_id', 'config'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return res.status(400).json({
        success: false,
        message: `Missing required field: ${field}`
      });
    }
  }

  // Validate node type
  if (!['universal_agent', 'trigger'].includes(body.type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid node type. Must be "universal_agent" or "trigger"'
    });
  }

  // Validate config based on node type
  if (body.type === 'universal_agent') {
    const config = body.config;
    if (!config.model || !config.prompt) {
      return res.status(400).json({
        success: false,
        message: 'Universal agent config must include model and prompt'
      });
    }
  } else if (body.type === 'trigger') {
    const config = body.config;
    if (!config.trigger_type) {
      return res.status(400).json({
        success: false,
        message: 'Trigger config must include trigger_type'
      });
    }
  }

  // In a real application, you would save this to a database
  // For now, we'll simulate successful saving
  console.log(`Saving node configuration for ${nodeId}:`, JSON.stringify(body, null, 2));

  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 100));

  return res.status(200).json({
    success: true,
    message: 'Node configuration saved successfully',
    data: {
      node_id: nodeId,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  });
}

async function handleDeleteNode(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  nodeId: string
) {
  // In a real application, you would delete this from a database
  // For now, we'll simulate successful deletion
  console.log(`Deleting node ${nodeId}`);

  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 100));

  return res.status(200).json({
    success: true,
    message: 'Node deleted successfully',
    node_id: nodeId
  });
} 