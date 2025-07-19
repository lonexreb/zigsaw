import type { NextApiRequest, NextApiResponse } from 'next';
import { addAPICallLog } from '../logs';
import { incrementRequestCount } from '../stats';

// In-memory storage for tracking frontend requests (in production, use a database)
let frontendRequestCount = 0;
let lastFrontendRequest: string | null = null;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const startTime = Date.now();
    const { workflow, agentConfigs, test, timestamp, source, checkFrontendRequests } = req.body;

    // Log the API call
    addAPICallLog({
      method: 'POST',
      path: '/api/workflow/execute',
      source: source || 'unknown',
      status: 'processing',
      duration: 0,
      body: {
        hasWorkflow: !!workflow,
        hasAgentConfigs: !!agentConfigs,
        nodeCount: workflow?.nodes?.length || 0,
        edgeCount: workflow?.edges?.length || 0,
        isTest: !!test
      }
    });

    // Increment request count
    incrementRequestCount();

    console.log('🚀 Workflow execute request received:', {
      test,
      timestamp,
      source,
      checkFrontendRequests,
      hasWorkflow: !!workflow,
      hasAgentConfigs: !!agentConfigs,
      nodeCount: workflow?.nodes?.length || 0,
      edgeCount: workflow?.edges?.length || 0
    });

    // If this is a request to check frontend request statistics
    if (checkFrontendRequests) {
      const duration = Date.now() - startTime;
      
      // Update the log entry with final status
      addAPICallLog({
        method: 'POST',
        path: '/api/workflow/execute',
        source: 'backend-dashboard',
        status: '200',
        duration,
        body: { checkFrontendRequests: true }
      });

      return res.status(200).json({
        success: true,
        frontendRequests: {
          count: frontendRequestCount,
          lastRequest: lastFrontendRequest
        }
      });
    }

    // If this is a test request from the frontend
    if (test && source !== 'backend-dashboard') {
      const duration = Date.now() - startTime;
      
      // Track frontend request
      frontendRequestCount++;
      lastFrontendRequest = new Date().toISOString();
      
      console.log(`📊 Frontend test POST #${frontendRequestCount} received at ${lastFrontendRequest}`);
      
      // Update the log entry with final status
      addAPICallLog({
        method: 'POST',
        path: '/api/workflow/execute',
        source: 'frontend',
        status: '200',
        duration,
        body: {
          test: true,
          requestNumber: frontendRequestCount,
          hasWorkflow: !!workflow,
          hasAgentConfigs: !!agentConfigs,
          nodeCount: workflow?.nodes?.length || 0,
          edgeCount: workflow?.edges?.length || 0
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Test POST successful from frontend',
        timestamp: new Date().toISOString(),
        source: 'frontend',
        requestNumber: frontendRequestCount,
        receivedData: {
          hasWorkflow: !!workflow,
          hasAgentConfigs: !!agentConfigs,
          nodeCount: workflow?.nodes?.length || 0,
          edgeCount: workflow?.edges?.length || 0
        }
      });
    }

    // If this is a test request from the backend dashboard
    if (test && source === 'backend-dashboard') {
      return res.status(200).json({
        success: true,
        message: 'Test POST successful from backend dashboard',
        timestamp: new Date().toISOString(),
        source: 'backend-dashboard'
      });
    }

    // Handle actual workflow execution
    if (!workflow || !workflow.nodes || !workflow.edges) {
      return res.status(400).json({
        error: 'Invalid workflow data',
        required: ['workflow.nodes', 'workflow.edges']
      });
    }

    // Simulate workflow execution
    const executionResult = {
      success: true,
      message: 'Workflow executed successfully',
      timestamp: new Date().toISOString(),
      executionId: `exec_${Date.now()}`,
      results: {
        nodesProcessed: workflow.nodes.length,
        edgesProcessed: workflow.edges.length,
        agentConfigsCount: agentConfigs?.length || 0,
        executionTime: Math.random() * 1000 + 500 // Random execution time between 500-1500ms
      }
    };

    console.log('✅ Workflow execution completed:', executionResult);

    return res.status(200).json(executionResult);

  } catch (error) {
    console.error('❌ Workflow execution error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
