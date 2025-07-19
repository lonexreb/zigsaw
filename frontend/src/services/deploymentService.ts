import { Node, Edge } from '@xyflow/react';

const API_BASE_URL = 'http://localhost:8000/api';

export interface DeploymentRequest {
  workflow: {
    id: string;
    name: string;
    description: string;
    nodes: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      data: any;
      config?: any;
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      source_handle?: string;
      target_handle?: string;
    }>;
  };
  selectedOption: 'local' | 'cloud';
  debug?: boolean;
}

export interface DeploymentResponse {
  success: boolean;
  message: string;
  deployment_id?: string;
  workflow_received?: {
    name: string;
    node_count: number;
    edge_count: number;
    node_types: string[];
  };
  endpoints?: Array<{
    method: string;
    path: string;
    description: string;
    url?: string;
  }>;
}

export interface WorkflowExecutionRequest {
  input_data?: any;
  parameters?: Record<string, any>;
  debug?: boolean;
}

export interface WorkflowExecutionResponse {
  success: boolean;
  deployment_id: string;
  execution_time_ms: number;
  nodes_executed: string[];
  execution_order: string[];
  final_output: any;
  node_outputs: Record<string, any>;
  message: string;
}

export class DeploymentService {
  /**
   * Step 1: Send workflow to backend
   * This is the main function that converts React Flow nodes/edges to workflow format
   * and sends it to the backend for processing
   */
  async sendWorkflowToBackend(nodes: Node[], edges: Edge[], selectedOption: 'local' | 'cloud'): Promise<DeploymentResponse> {
    // 🔍 DEBUG: Frontend input analysis
    console.log('🔍 FRONTEND DEBUG - Input to sendWorkflowToBackend:');
    console.log('   📋 Input nodes count:', nodes.length);
    console.log('   🔗 Input edges count:', edges.length);
    console.log('   📋 Input node details:', nodes.map(n => ({ id: n.id, type: n.type })));
    console.log('   🔗 Input edge details:', edges.map(e => ({ id: e.id, source: e.source, target: e.target })));
    
    // Convert React Flow nodes to workflow format
    const workflow = this.convertNodesToWorkflow(nodes, edges);
    
    // 🔍 DEBUG: Post-conversion analysis
    console.log('🔍 FRONTEND DEBUG - After convertNodesToWorkflow:');
    console.log('   📋 Converted nodes count:', workflow.nodes.length);
    console.log('   🔗 Converted edges count:', workflow.edges.length);
    console.log('   📋 Converted node details:', workflow.nodes.map(n => ({ id: n.id, type: n.type })));
    console.log('   🔗 Converted edge details:', workflow.edges.map(e => ({ id: e.id, source: e.source, target: e.target })));
    
    const deploymentRequest: DeploymentRequest = {
      workflow,
      selectedOption,
      debug: true
    };

    console.log('🚀 Sending workflow to backend:', {
      name: workflow.name,
      nodeCount: workflow.nodes.length,
      edgeCount: workflow.edges.length,
      selectedOption
    });
    
    // 🔍 DEBUG: Final request payload analysis
    console.log('🔍 FRONTEND DEBUG - Final request payload:');
    console.log('   📦 Request workflow nodes count:', deploymentRequest.workflow.nodes.length);
    console.log('   📦 Request workflow edges count:', deploymentRequest.workflow.edges.length);
    console.log('   📦 Full request structure:', JSON.stringify(deploymentRequest, null, 2));

    try {
      const response = await fetch(`${API_BASE_URL}/deployment/send-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deploymentRequest)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Backend response:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to send workflow to backend:', error);
      throw error;
    }
  }

  /**
   * Test the connection to the backend
   */
  async testBackendConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/deployment/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return {
          connected: false,
          message: `Backend not responding: ${response.status} ${response.statusText}`
        };
      }

      const result = await response.json();
      return {
        connected: true,
        message: result.message || 'Backend is healthy'
      };
    } catch (error) {
      return {
        connected: false,
        message: `Cannot connect to backend: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Execute a deployed workflow using the automatic execution endpoint
   */
  async executeWorkflow(
    deploymentId: string, 
    executionRequest: WorkflowExecutionRequest = {}
  ): Promise<WorkflowExecutionResponse> {
    const requestData = {
      input_data: executionRequest.input_data || "Execute the workflow with the current configuration",
      parameters: executionRequest.parameters || {},
      debug: executionRequest.debug !== false // Default to true
    };

    console.log('🚀 Executing workflow:', {
      deploymentId,
      inputPreview: typeof requestData.input_data === 'string' 
        ? requestData.input_data.substring(0, 100) + (requestData.input_data.length > 100 ? '...' : '')
        : typeof requestData.input_data,
      hasParameters: Object.keys(requestData.parameters).length > 0,
      debug: requestData.debug
    });

    try {
      const response = await fetch(`${API_BASE_URL}/deployed/${deploymentId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Workflow execution completed:', {
        success: result.success,
        executionTime: result.execution_time_ms,
        nodesExecuted: result.nodes_executed?.length || 0,
        hasOutput: !!result.final_output
      });
      
      return result;
    } catch (error) {
      console.error('❌ Failed to execute workflow:', error);
      throw error;
    }
  }

  /**
   * Execute a deployed workflow with real-time streaming updates
   */
  async executeWorkflowWithProgress(
    deploymentId: string,
    executionRequest: WorkflowExecutionRequest = {},
    onProgress: (update: any) => void
  ): Promise<WorkflowExecutionResponse> {
    const requestData = {
      input_data: executionRequest.input_data || "Execute the workflow with the current configuration",
      parameters: executionRequest.parameters || {},
      debug: executionRequest.debug !== false
    };

    console.log('🚀 Starting streaming workflow execution:', { deploymentId });

    try {
      const response = await fetch(`${API_BASE_URL}/deployed/${deploymentId}/execute-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const decoder = new TextDecoder();
      let finalResult: WorkflowExecutionResponse | null = null;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const update = JSON.parse(data);
              
              // Call progress callback
              onProgress(update);
              
              // Store final result
              if (update.type === 'workflow_complete') {
                finalResult = {
                  success: update.success,
                  deployment_id: deploymentId,
                  execution_time_ms: update.execution_time_ms,
                  nodes_executed: update.nodes_executed,
                  execution_order: update.execution_order,
                  final_output: update.final_output,
                  node_outputs: update.node_outputs,
                  message: update.message
                };
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }

      if (!finalResult) {
        throw new Error('Workflow execution completed but no final result received');
      }

      return finalResult;
    } catch (error) {
      console.error('❌ Failed to execute streaming workflow:', error);
      throw error;
    }
  }

  /**
   * Convert React Flow nodes and edges to backend workflow format
   */
  private convertNodesToWorkflow(nodes: Node[], edges: Edge[]) {
    const timestamp = new Date().toISOString();
    
    // Extract API keys from nodes
    const extractedApiKeys: Record<string, string> = {};
    
    nodes.forEach(node => {
      // Extract API keys from different node types
      if (node.type === 'groqllama') {
        // Try to get API key from localStorage
        const groqApiKey = localStorage.getItem('groqllama_api_key');
        if (groqApiKey) {
          extractedApiKeys.groqllama = groqApiKey;
          console.log('📦 Extracted GroqLlama API key from localStorage');
        }
        
        // Also check node data for API key
        const nodeApiKey = (node.data as any)?.apiKey || (node.data as any)?.config?.api_key;
        if (nodeApiKey) {
          extractedApiKeys.groqllama = nodeApiKey;
          console.log('📦 Extracted GroqLlama API key from node data');
        }
      }
      
      // Extract API keys from other node types as needed
      if (node.type === 'claude4') {
        const claudeApiKey = localStorage.getItem('claude4_api_key');
        if (claudeApiKey) {
          extractedApiKeys.claude4 = claudeApiKey;
        }
      }
      
      if (node.type === 'gemini') {
        const geminiApiKey = localStorage.getItem('gemini_api_key');
        if (geminiApiKey) {
          extractedApiKeys.gemini = geminiApiKey;
        }
      }
    });
    
    console.log('🔑 Extracted API keys for deployment:', Object.keys(extractedApiKeys));
    
    return {
      id: `workflow-${Date.now()}`,
      name: `Deployed Workflow ${new Date().toLocaleString()}`,
      description: `Auto-generated workflow with ${nodes.length} nodes and ${edges.length} connections`,
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type || 'unknown',
        position: node.position,
        data: node.data || {},
        config: (node.data as any)?.config || {}
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        source_handle: edge.sourceHandle,
        target_handle: edge.targetHandle
      })),
      created_at: timestamp,
      frontend_api_keys: extractedApiKeys // Include extracted API keys
    };
  }

  /**
   * Get the unique node types in the workflow
   */
  getNodeTypes(nodes: Node[]): string[] {
    const types = new Set(nodes.map(node => node.type || 'unknown'));
    return Array.from(types);
  }

  /**
   * Validate workflow before sending
   */
  validateWorkflow(nodes: Node[], edges: Edge[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }

    // Check for duplicate node IDs
    const nodeIds = nodes.map(n => n.id);
    const duplicateIds = nodeIds.filter((id, index) => nodeIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate node IDs found: ${duplicateIds.join(', ')}`);
    }

    // Check edge validity
    for (const edge of edges) {
      if (!nodeIds.includes(edge.source)) {
        errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`);
      }
      if (!nodeIds.includes(edge.target)) {
        errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const deploymentService = new DeploymentService(); 