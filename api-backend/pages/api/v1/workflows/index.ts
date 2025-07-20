import { NextApiRequest, NextApiResponse } from 'next';

interface WorkflowConfig {
  nodes: any[];
  edges: any[];
  nodeIdCounter: number;
  lastSaved: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { method } = req;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (method) {
      case 'POST':
        return await handleSaveWorkflow(req, res);
      case 'GET':
        return await handleLoadWorkflow(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({
          success: false,
          message: `Method ${method} Not Allowed`
        });
    }
  } catch (error) {
    console.error('Workflow API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

async function handleSaveWorkflow(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { body } = req;

  // Validate request body
  if (!body) {
    return res.status(400).json({
      success: false,
      message: 'Request body is required'
    });
  }

  // Validate workflow config structure
  if (!body.nodes || !body.edges || typeof body.nodeIdCounter !== 'number') {
    return res.status(400).json({
      success: false,
      message: 'Invalid workflow configuration. Must include nodes, edges, and nodeIdCounter'
    });
  }

  // In a real application, you would save this to a database
  // For now, we'll simulate successful saving
  console.log('Saving workflow configuration:', JSON.stringify(body, null, 2));

  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 100));

  return res.status(200).json({
    success: true,
    message: 'Workflow saved successfully',
    data: {
      workflow_id: 'default-workflow',
      ...body,
      saved_at: new Date().toISOString()
    }
  });
}

async function handleLoadWorkflow(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // In a real application, you would load this from a database
  // For now, we'll return a default empty workflow
  console.log('Loading workflow configuration');

  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 100));

  const defaultWorkflow: WorkflowConfig = {
    nodes: [],
    edges: [],
    nodeIdCounter: 0,
    lastSaved: new Date().toISOString()
  };

  return res.status(200).json({
    success: true,
    message: 'Workflow loaded successfully',
    data: defaultWorkflow
  });
} 