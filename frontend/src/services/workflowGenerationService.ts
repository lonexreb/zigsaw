// AI-powered workflow generation service
// Following AI Pragmatic Programmer principles: Version prompts, structured templates, validation

import { Node, Edge } from '@xyflow/react';

export interface WorkflowGenerationRequest {
  description: string;
  userPreferences?: {
    preferredAIProvider?: 'anthropic' | 'openai' | 'groq';
    complexity?: 'simple' | 'intermediate' | 'advanced';
    includeErrorHandling?: boolean;
  };
}

export interface WorkflowGenerationResult {
  success: boolean;
  workflow?: {
    nodes: Node[];
    edges: Edge[];
    description: string;
    estimatedExecutionTime: number;
    requiredPermissions: string[];
    requiredApiKeys: string[];
  };
  questions?: UserQuestion[];
  error?: string;
}

export interface UserQuestion {
  id: string;
  question: string;
  type: 'text' | 'choice' | 'file' | 'api_key';
  options?: string[];
  required: boolean;
  context: string;
}

export interface NodeTemplate {
  type: string;
  label: string;
  description: string;
  requiredConfig: string[];
  optionalConfig: string[];
  inputs: string[];
  outputs: string[];
  category: 'ai' | 'integration' | 'data' | 'logic' | 'trigger';
}

class WorkflowGenerationService {
  private readonly API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : 'https://zigsaw-backend.vercel.app');
  
  // Available node templates based on current codebase
  private readonly NODE_TEMPLATES: Record<string, NodeTemplate> = {
    universal_agent: {
      type: 'universal_agent',
      label: 'AI Agent',
      description: 'Configurable AI agent for text processing and analysis',
      requiredConfig: ['provider', 'model', 'systemPrompt'],
      optionalConfig: ['userPrompt', 'temperature', 'maxTokens'],
      inputs: ['text_input'],
      outputs: ['text_output'],
      category: 'ai'
    },
    gmail: {
      type: 'gmail',
      label: 'Gmail',
      description: 'Send, receive, and manage Gmail emails',
      requiredConfig: ['action', 'credentials'],
      optionalConfig: ['to', 'subject', 'body', 'filters'],
      inputs: ['email_content', 'recipient_list'],
      outputs: ['email_data', 'send_status'],
      category: 'integration'
    },
    github: {
      type: 'github',
      label: 'GitHub',
      description: 'Interact with GitHub repositories, issues, and pull requests',
      requiredConfig: ['action', 'token', 'repository'],
      optionalConfig: ['branch', 'filePath', 'commitMessage'],
      inputs: ['code_content', 'pr_data'],
      outputs: ['repo_data', 'commit_hash'],
      category: 'integration'
    },
    google_calendar: {
      type: 'google_calendar',
      label: 'Google Calendar',
      description: 'Create, update, and manage calendar events',
      requiredConfig: ['action', 'credentials'],
      optionalConfig: ['calendarId', 'eventTitle', 'startTime', 'endTime'],
      inputs: ['event_data'],
      outputs: ['event_created', 'calendar_data'],
      category: 'integration'
    },
    trigger: {
      type: 'trigger',
      label: 'Trigger',
      description: 'Start workflow execution with various trigger conditions',
      requiredConfig: ['triggerType'],
      optionalConfig: ['schedule', 'webhook', 'conditions'],
      inputs: [],
      outputs: ['trigger_data'],
      category: 'trigger'
    },
    router: {
      type: 'router',
      label: 'Router',
      description: 'Route data flow based on conditions',
      requiredConfig: ['conditions'],
      optionalConfig: ['defaultRoute'],
      inputs: ['input_data'],
      outputs: ['route_1', 'route_2', 'route_3'],
      category: 'logic'
    }
  };

  // Structured prompt template for workflow generation
  private readonly WORKFLOW_GENERATION_PROMPT = `
You are a workflow automation expert. Convert the user's description into a structured workflow using available nodes.

Available Node Types:
{nodeTypes}

User Request: "{userDescription}"

IMPORTANT: Respond with ONLY a valid JSON object in this exact format:
{
  "workflow": {
    "nodes": [
      {
        "id": "unique_id",
        "type": "node_type",
        "label": "Human readable label",
        "position": {"x": number, "y": number},
        "data": {
          "config": {
            "key": "value"
          },
          "description": "What this node does"
        }
      }
    ],
    "edges": [
      {
        "id": "edge_id",
        "source": "source_node_id", 
        "target": "target_node_id",
        "sourceHandle": "output_name",
        "targetHandle": "input_name"
      }
    ],
    "description": "Brief workflow explanation",
    "estimatedExecutionTime": seconds_as_number,
    "requiredPermissions": ["list", "of", "permissions"],
    "requiredApiKeys": ["list", "of", "providers"]
  },
  "questions": [
    {
      "id": "question_id",
      "question": "What information do you need?",
      "type": "text|choice|file|api_key",
      "options": ["option1", "option2"],
      "required": true,
      "context": "Why this is needed"
    }
  ]
}

Guidelines:
1. Position nodes logically (start at x:100, y:100, space 300px apart)
2. Always include a trigger node as the first node
3. Connect nodes in logical execution order
4. Ask questions for missing critical information
5. Include error handling for complex workflows
6. Estimate realistic execution times
7. Be specific about required permissions and API keys
`;

  private getApiKey(provider: string): string | null {
    try {
      const keys = JSON.parse(localStorage.getItem('universal-agent-api-keys') || '{}');
      return keys[provider] || null;
    } catch {
      return null;
    }
  }

  private formatNodeTypesForPrompt(): string {
    return Object.entries(this.NODE_TEMPLATES)
      .map(([key, template]) => 
        `- ${key}: ${template.description}
  Required: ${template.requiredConfig.join(', ')}
  Optional: ${template.optionalConfig.join(', ')}
  Category: ${template.category}`
      )
      .join('\n');
  }

  async generateWorkflow(request: WorkflowGenerationRequest): Promise<WorkflowGenerationResult> {
    try {
      // Get API key for AI provider
      const provider = request.userPreferences?.preferredAIProvider || 'anthropic';
      const apiKey = this.getApiKey(provider);
      
      if (!apiKey) {
        return {
          success: false,
          error: `Please configure your ${provider} API key first`,
          questions: [{
            id: 'api_key',
            question: `Please provide your ${provider} API key`,
            type: 'api_key',
            required: true,
            context: 'Required to generate workflows using AI'
          }]
        };
      }

      // Prepare the prompt with node types
      const prompt = this.WORKFLOW_GENERATION_PROMPT
        .replace('{nodeTypes}', this.formatNodeTypesForPrompt())
        .replace('{userDescription}', request.description);

      // Call AI service
      const response = await fetch(`${this.API_BASE_URL}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          model: this.getModelForProvider(provider),
          messages: [
            {
              role: 'system',
              content: 'You are a workflow automation expert. Respond only with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1, // Low temperature for consistent structured output
          maxTokens: 2000,
          apiKey
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const result = this.parseAIResponse(aiResponse.content);
      
      if (result.success && result.workflow) {
        // Add missing IDs and validate structure
        result.workflow = this.validateAndEnhanceWorkflow(result.workflow);
      }

      return result;

    } catch (error) {
      console.error('Workflow generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate workflow'
      };
    }
  }

  private getModelForProvider(provider: string): string {
    switch (provider) {
      case 'anthropic':
        return 'claude-3-sonnet-20240229';
      case 'openai':
        return 'gpt-4';
      case 'groq':
        return 'llama3-70b-8192';
      default:
        return 'claude-3-sonnet-20240229';
    }
  }

  private parseAIResponse(content: string): WorkflowGenerationResult {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required structure
      if (!parsed.workflow || !parsed.workflow.nodes || !parsed.workflow.edges) {
        throw new Error('Invalid workflow structure in AI response');
      }

      return {
        success: true,
        workflow: parsed.workflow,
        questions: parsed.questions || []
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private validateAndEnhanceWorkflow(workflow: any): any {
    // Ensure all nodes have required fields
    const enhancedNodes = workflow.nodes.map((node: any, index: number) => ({
      id: node.id || `node_${index}`,
      type: node.type,
      position: node.position || { x: 100 + index * 300, y: 100 },
      data: {
        label: node.label || node.type,
        description: node.data?.description || `${node.type} node`,
        status: 'idle',
        config: node.data?.config || {},
        ...node.data
      }
    }));

    // Ensure all edges have required fields
    const enhancedEdges = workflow.edges.map((edge: any, index: number) => ({
      id: edge.id || `edge_${index}`,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || 'output',
      targetHandle: edge.targetHandle || 'input',
      type: 'smoothstep',
      animated: true
    }));

    return {
      ...workflow,
      nodes: enhancedNodes,
      edges: enhancedEdges
    };
  }

  // Get available node types for UI
  getAvailableNodeTypes(): NodeTemplate[] {
    return Object.values(this.NODE_TEMPLATES);
  }

  // Validate workflow before execution
  validateWorkflow(nodes: Node[], edges: Edge[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for at least one trigger node
    const triggerNodes = nodes.filter(node => node.type === 'trigger');
    if (triggerNodes.length === 0) {
      errors.push('Workflow must have at least one trigger node');
    }

    // Check for isolated nodes
    const nodeIds = new Set(nodes.map(node => node.id));
    const connectedNodes = new Set([
      ...edges.map(edge => edge.source),
      ...edges.map(edge => edge.target)
    ]);

    const isolatedNodes = nodes.filter(node => 
      node.type !== 'trigger' && !connectedNodes.has(node.id)
    );

    if (isolatedNodes.length > 0) {
      errors.push(`Isolated nodes found: ${isolatedNodes.map(n => n.data?.label || n.id).join(', ')}`);
    }

    // Check for required configurations
    for (const node of nodes) {
      const template = this.NODE_TEMPLATES[node.type];
      if (template) {
        const missingConfig = template.requiredConfig.filter(key => 
          !node.data?.config?.[key]
        );
        if (missingConfig.length > 0) {
          errors.push(`Node "${node.data?.label || node.id}" missing: ${missingConfig.join(', ')}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const workflowGenerationService = new WorkflowGenerationService();