import { apiService } from './apiService';
import { Node, Edge } from '@xyflow/react';

export interface WorkflowConfig {
  nodes: Node[];
  edges: Edge[];
  nodeIdCounter: number;
  lastSaved: string;
}

class WorkflowPersistenceService {
  private saveTimeout: NodeJS.Timeout | null = null;
  private readonly SAVE_DELAY = 2000; // 2 seconds debounce

  /**
   * Save workflow configuration to the backend
   */
  async saveWorkflow(config: WorkflowConfig, idToken: string): Promise<void> {
    try {
      console.log('Saving workflow config:', config);
      await apiService.post('/api/user/workflow', {
        ...config,
        lastSaved: new Date().toISOString()
      }, idToken);
      console.log('Workflow saved successfully');
    } catch (error) {
      console.error('Failed to save workflow:', error);
      throw error;
    }
  }

  /**
   * Load workflow configuration from the backend
   */
  async loadWorkflow(idToken: string): Promise<WorkflowConfig | null> {
    try {
      console.log('Loading workflow from backend...');
      const response = await apiService.get('/api/user/workflow', idToken);
      
      console.log('Backend response:', response.data);
      
      // If no workflow config exists, return null
      if (!response.data || Object.keys(response.data).length === 0) {
        console.log('No workflow config found in backend');
        return null;
      }

      console.log('Workflow loaded successfully:', response.data);
      return response.data as WorkflowConfig;
    } catch (error) {
      console.error('Failed to load workflow:', error);
      return null;
    }
  }

  /**
   * Auto-save workflow with debouncing to avoid too many API calls
   */
  autoSaveWorkflow(config: WorkflowConfig, idToken: string): void {
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Set new timeout
    this.saveTimeout = setTimeout(() => {
      this.saveWorkflow(config, idToken).catch(error => {
        console.error('Auto-save failed:', error);
      });
    }, this.SAVE_DELAY);
  }

  /**
   * Clear any pending auto-save
   */
  clearAutoSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
  }

  /**
   * Save node configuration to the backend
   */
  async saveNodeConfig(nodeId: string, config: any, nodeType: 'TRIGGER' | 'UNIVERSAL_AGENT', idToken: string, position?: { x: number, y: number }): Promise<any> {
    try {
      console.log(`🔧 Saving node ${nodeId} config:`, JSON.stringify(config, null, 2));
      console.log(`🔧 Node type: ${nodeType}`);
      
      let payload: any = {
        type: nodeType
      };

      // Transform config based on node type
      if (nodeType === 'UNIVERSAL_AGENT') {
        // Debug individual field extraction
        console.log('🔍 Extracting fields:');
        console.log('  - model:', config.model);
        console.log('  - systemPrompt:', config.systemPrompt);
        console.log('  - temperature:', config.temperature);
        console.log('  - tools:', config.tools);
        
        const extractedTools = config.tools ? config.tools.map((tool: any) => {
          console.log('  - processing tool:', tool);
          return tool.id || tool.name || tool;
        }) : [];
        
        console.log('  - extracted tool IDs:', extractedTools);
        
        // Transform frontend config to backend expected structure
        // Backend expects 'universal_agent' not 'UNIVERSAL_AGENT'
        payload = {
          type: 'universal_agent',  // Use lowercase with underscore
          name: `Universal Agent ${nodeId}`,  // Add required name field
          description: 'AI agent with customizable configuration',  // Add required description field
          position: position || { x: 100, y: 100 },  // Add required position field
          workflow_id: 'default-workflow',  // Add required workflow_id field
          config: {
            model: config.model || 'claude-3-5-sonnet-20241022',
            prompt: config.systemPrompt || 'You are a helpful AI assistant.',
            tools: extractedTools,
            max_iterations: 10, // Default value
            temperature: config.temperature || 0.7
          }
        };
        
        console.log('🔧 Transformed config object:', JSON.stringify(payload.config, null, 2));
      } else if (nodeType === 'TRIGGER') {
        // For trigger nodes, use lowercase 'trigger'
        payload = {
          type: 'trigger',  // Use lowercase
          name: `Trigger ${nodeId}`,  // Add required name field  
          description: 'Workflow trigger configuration',  // Add required description field
          position: position || { x: 100, y: 100 },  // Add required position field
          workflow_id: 'default-workflow',  // Add required workflow_id field
          config: {
            trigger_type: config?.eventType || 'manual',
            eventData: config?.eventData || ''
          }
        };
      }
      
      console.log('📤 Full payload being sent:', JSON.stringify(payload, null, 2));
      console.log('📤 Sending to endpoint:', `/api/v1/nodes/${nodeId}`);
      
      const response = await apiService.put(`/api/v1/nodes/${nodeId}`, payload, idToken);
      
      console.log('✅ Node configuration saved successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to save node configuration:', error);
      console.error('❌ Error details:', error);
      if ((error as any)?.response) {
        console.error('❌ Response status:', (error as any).response.status);
        console.error('❌ Response data:', (error as any).response.data);
        console.error('❌ Response headers:', (error as any).response.headers);
      }
      throw error;
    }
  }

  /**
   * Check if workflow configuration is valid
   */
  isValidWorkflowConfig(config: any): config is WorkflowConfig {
    return (
      config &&
      Array.isArray(config.nodes) &&
      Array.isArray(config.edges) &&
      typeof config.nodeIdCounter === 'number'
    );
  }
}

export const workflowPersistenceService = new WorkflowPersistenceService();