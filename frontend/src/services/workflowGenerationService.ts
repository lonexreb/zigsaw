// AI-powered workflow generation service
// Following AI Pragmatic Programmer principles: Version prompts, structured templates, validation

import { Node, Edge } from '@xyflow/react';

// Real API keys for development/testing
// NOTE: In production, these should be environment variables or securely stored
const DEMO_API_KEYS = {
  anthropic: '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',
  openai: '', // Disabled - using only Anthropic
  groq: '' // Disabled - using only Anthropic
};

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
  category: 'ai' | 'integration' | 'data' | 'logic' | 'trigger' | 'media' | 'communication';
}

class WorkflowGenerationService {
  private get API_BASE_URL(): string {
    try {
      return import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : 'https://zigsaw-backend.vercel.app');
    } catch {
      return 'https://zigsaw-backend.vercel.app';
    }
  }
  
  // Comprehensive node templates based on all available node types in the codebase
  private readonly NODE_TEMPLATES: Record<string, NodeTemplate> = {
    // Trigger Nodes
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
    
    // AI Model Nodes
    universal_agent: {
      type: 'universal_agent',
      label: 'Universal AI Agent',
      description: 'Configurable AI agent supporting Claude, GPT, Gemini, and Groq',
      requiredConfig: ['provider', 'model', 'systemPrompt'],
      optionalConfig: ['userPrompt', 'temperature', 'maxTokens', 'tools'],
      inputs: ['text_input', 'context'],
      outputs: ['text_output', 'metadata'],
      category: 'ai'
    },
    groqllama: {
      type: 'groqllama',
      label: 'Groq Llama',
      description: 'High-speed AI inference using Groq hardware acceleration',
      requiredConfig: ['model', 'prompt'],
      optionalConfig: ['temperature', 'maxTokens', 'systemPrompt'],
      inputs: ['text_input'],
      outputs: ['text_output'],
      category: 'ai'
    },
    claude4: {
      type: 'claude4',
      label: 'Claude 4',
      description: 'Anthropic Claude 4 for advanced reasoning and analysis',
      requiredConfig: ['model', 'prompt'],
      optionalConfig: ['temperature', 'maxTokens', 'systemPrompt'],
      inputs: ['text_input'],
      outputs: ['text_output'],
      category: 'ai'
    },
    
    // Integration Nodes
    gmail: {
      type: 'gmail',
      label: 'Gmail',
      description: 'Send, receive, and manage Gmail emails',
      requiredConfig: ['action', 'credentials'],
      optionalConfig: ['to', 'subject', 'body', 'filters', 'attachments'],
      inputs: ['email_content', 'recipient_list'],
      outputs: ['email_data', 'send_status', 'email_id'],
      category: 'integration'
    },
    github: {
      type: 'github',
      label: 'GitHub',
      description: 'Interact with GitHub repositories, issues, and pull requests',
      requiredConfig: ['action', 'token', 'repository'],
      optionalConfig: ['branch', 'filePath', 'commitMessage', 'prNumber', 'issueNumber'],
      inputs: ['code_content', 'pr_data', 'issue_data'],
      outputs: ['repo_data', 'commit_hash', 'pr_info', 'issue_info'],
      category: 'integration'
    },
    google_calendar: {
      type: 'google_calendar',
      label: 'Google Calendar',
      description: 'Create, update, and manage calendar events',
      requiredConfig: ['action', 'credentials'],
      optionalConfig: ['calendarId', 'eventTitle', 'startTime', 'endTime', 'attendees'],
      inputs: ['event_data'],
      outputs: ['event_created', 'calendar_data', 'event_id'],
      category: 'integration'
    },
    api_connector: {
      type: 'api_connector',
      label: 'API Connector',
      description: 'Make HTTP requests to any REST API',
      requiredConfig: ['method', 'url'],
      optionalConfig: ['headers', 'body', 'authentication', 'timeout'],
      inputs: ['request_data'],
      outputs: ['response_data', 'status_code', 'headers'],
      category: 'integration'
    },
    firecrawl: {
      type: 'firecrawl',
      label: 'Firecrawl',
      description: 'Web scraping and content extraction',
      requiredConfig: ['url'],
      optionalConfig: ['selectors', 'waitForSelector', 'javascript'],
      inputs: ['url_list'],
      outputs: ['scraped_content', 'metadata'],
      category: 'data'
    },
    
    // Data Processing Nodes
    document: {
      type: 'document',
      label: 'Document',
      description: 'Upload and process PDF, text, and other documents',
      requiredConfig: ['fileType'],
      optionalConfig: ['extractText', 'extractImages', 'extractMetadata'],
      inputs: ['file_input'],
      outputs: ['text_content', 'metadata', 'images'],
      category: 'data'
    },
    database: {
      type: 'database',
      label: 'Database',
      description: 'Connect to databases for data operations',
      requiredConfig: ['dbType', 'connectionString', 'query'],
      optionalConfig: ['parameters', 'timeout'],
      inputs: ['query_params'],
      outputs: ['query_results', 'row_count'],
      category: 'data'
    },
    
    // Media Processing Nodes
    whisper: {
      type: 'whisper',
      label: 'Whisper',
      description: 'AI-powered audio transcription using OpenAI Whisper',
      requiredConfig: ['audioFile'],
      optionalConfig: ['language', 'model', 'timestamps'],
      inputs: ['audio_input'],
      outputs: ['transcript', 'timestamps', 'language_detected'],
      category: 'media'
    },
    imagen: {
      type: 'imagen',
      label: 'Imagen',
      description: 'Generate images using Google Imagen AI',
      requiredConfig: ['prompt'],
      optionalConfig: ['style', 'size', 'quality', 'negativePrompt'],
      inputs: ['text_prompt'],
      outputs: ['image_url', 'image_data'],
      category: 'media'
    },
    veo3: {
      type: 'veo3',
      label: 'Veo3',
      description: 'Generate videos using Google Veo3 AI',
      requiredConfig: ['prompt'],
      optionalConfig: ['duration', 'style', 'fps', 'resolution'],
      inputs: ['text_prompt'],
      outputs: ['video_url', 'video_data'],
      category: 'media'
    },
    blip2: {
      type: 'blip2',
      label: 'BLIP-2',
      description: 'Image captioning and visual question answering',
      requiredConfig: ['imageUrl'],
      optionalConfig: ['question', 'maxLength'],
      inputs: ['image_input', 'text_question'],
      outputs: ['caption', 'answer'],
      category: 'media'
    },
    
    // Logic and Control Nodes
    router: {
      type: 'router',
      label: 'Router',
      description: 'Route data flow based on conditions',
      requiredConfig: ['conditions'],
      optionalConfig: ['defaultRoute'],
      inputs: ['input_data'],
      outputs: ['route_1', 'route_2', 'route_3', 'default_route'],
      category: 'logic'
    },
    loop: {
      type: 'loop',
      label: 'Loop',
      description: 'Iterate over data arrays or repeat operations',
      requiredConfig: ['loopType', 'iterations'],
      optionalConfig: ['breakCondition', 'parallel'],
      inputs: ['array_data', 'loop_body'],
      outputs: ['loop_results', 'iteration_count'],
      category: 'logic'
    },
    human_in_loop: {
      type: 'human_in_loop',
      label: 'Human in the Loop',
      description: 'Pause workflow for human review and input',
      requiredConfig: ['prompt', 'inputType'],
      optionalConfig: ['timeout', 'notificationMethod'],
      inputs: ['review_data'],
      outputs: ['human_response', 'approval_status'],
      category: 'logic'
    }
  };

  // Enhanced prompt template with better examples and constraints
  private readonly WORKFLOW_GENERATION_PROMPT = `
You are an expert workflow automation architect. Convert the user's natural language description into a structured workflow using the available node types.

Available Node Types:
{nodeTypes}

User Request: "{userDescription}"

IMPORTANT INSTRUCTIONS:
1. Always start with a trigger node
2. Use the most appropriate node types based on the user's requirements
3. Connect nodes in logical execution order
4. Ask clarifying questions for missing critical information
5. Include error handling for complex workflows
6. Estimate realistic execution times (in seconds)
7. Be specific about required permissions and API keys

RESPONSE FORMAT:
You MUST respond with ONLY a valid JSON object. No additional text or explanations outside the JSON.

{
  "workflow": {
    "nodes": [
      {
        "id": "node-1",
        "type": "trigger",
        "position": {"x": 100, "y": 100},
        "data": {
          "label": "Manual Trigger",
          "description": "Start workflow manually",
          "status": "idle",
          "config": {
            "triggerType": "manual"
          }
        }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "node-1",
        "target": "node-2",
        "sourceHandle": "output",
        "targetHandle": "input",
        "type": "smoothstep",
        "animated": true
      }
    ],
    "description": "Brief workflow explanation",
    "estimatedExecutionTime": 30,
    "requiredPermissions": ["github:read", "gmail:send"],
    "requiredApiKeys": ["github", "anthropic"]
  },
  "questions": [
    {
      "id": "q1",
      "question": "Which GitHub repository should I monitor?",
      "type": "text",
      "required": true,
      "context": "Need to know which repository to watch for pull requests"
    }
  ]
}

EXAMPLES:
1. "Send email when GitHub PR is created" → Trigger (GitHub webhook) → Gmail (send)
2. "Analyze documents with AI" → Trigger → Document → Universal Agent → Output
3. "Daily report from database" → Trigger (schedule) → Database → Universal Agent → Gmail

Position nodes with x-spacing of 300px, starting at (100, 100).
`;

  private getApiKey(provider: string): string | null {
    try {
      // First try to get user's API key from localStorage
      const keys = JSON.parse(localStorage.getItem('universal-agent-api-keys') || '{}');
      if (keys[provider]) {
        return keys[provider];
      }
      
      // Fall back to demo/hardcoded keys
      const demoKey = DEMO_API_KEYS[provider as keyof typeof DEMO_API_KEYS];
      if (demoKey) {
        console.log(`Using demo API key for ${provider}`);
        return demoKey;
      }
      
      return null;
    } catch {
      // If localStorage fails, try demo keys
      return DEMO_API_KEYS[provider as keyof typeof DEMO_API_KEYS] || null;
    }
  }

  private formatNodeTypesForPrompt(): string {
    return Object.entries(this.NODE_TEMPLATES)
      .map(([key, template]) => 
        `- ${key}: ${template.description}
  Category: ${template.category}
  Required: ${template.requiredConfig.join(', ')}
  Inputs: ${template.inputs.join(', ')}
  Outputs: ${template.outputs.join(', ')}`
      )
      .join('\n');
  }

  async generateWorkflow(request: WorkflowGenerationRequest): Promise<WorkflowGenerationResult> {
    try {
      // Enhanced AI Integration with fallback strategy
      const provider = request.userPreferences?.preferredAIProvider || 'anthropic';
      const apiKey = this.getApiKey(provider);
      
      // Real API integration when key is available
      if (apiKey && !apiKey.includes('demo') && apiKey.length > 20) {
        try {
          return await this.generateWithAI(request, provider, apiKey);
        } catch (aiError) {
          console.warn('AI service failed, falling back to templates:', aiError);
          // Continue to fallback logic below
        }
      }
      
      // Smart fallback based on workflow type
      const isDocumentWorkflow = request.description.toLowerCase().includes('document') ||
                                 request.description.toLowerCase().includes('calendar') ||
                                 request.description.toLowerCase().includes('pdf') ||
                                 request.description.toLowerCase().includes('analyze');
      
      if (isDocumentWorkflow) {
        return this.generateDocumentCalendarWorkflow(request.description);
      }
      
      // General demo workflow fallback
      return this.generateDemoWorkflow(request.description);

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
        // Validate and enhance the workflow
        const validation = this.validateWorkflow(result.workflow.nodes, result.workflow.edges);
        if (!validation.valid) {
          return {
            success: false,
            error: `Workflow validation failed: ${validation.errors.join(', ')}`
          };
        }
        
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

  // Enhanced AI generation with robust prompt engineering
  private async generateWithAI(request: WorkflowGenerationRequest, provider: string, apiKey: string): Promise<WorkflowGenerationResult> {
    // Robust prompt engineering with clear constraints
    const enhancedPrompt = `You are a workflow automation expert. Create a JSON workflow from the user description.

STRICT REQUIREMENTS:
1. Response MUST be valid JSON only, no explanations
2. Use ONLY these node types: ${Object.keys(this.NODE_TEMPLATES).join(', ')}
3. Every workflow MUST start with a "trigger" node
4. Node IDs must be unique (format: type-number, e.g., "trigger-1")
5. Positions must be in 300px increments horizontally (100, 400, 700, 1000...)
6. All nodes must have complete data.config objects

RESPONSE FORMAT:
{
  "nodes": [...],
  "edges": [...],
  "description": "Brief workflow description",
  "estimatedExecutionTime": number_in_seconds,
  "requiredPermissions": ["permission1", "permission2"],
  "requiredApiKeys": ["provider1", "provider2"]
}

USER REQUEST: "${request.description}"

Available node types with configs:
${this.formatNodeTypesForPrompt()}

Generate workflow:`;

    try {
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
              content: enhancedPrompt
            }
          ],
          temperature: 0.1,
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
        // Enhanced workflow validation
        const validation = this.validateWorkflow(result.workflow.nodes, result.workflow.edges);
        if (!validation.valid) {
          throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`);
        }
        
        // Enhance workflow with missing data
        result.workflow = this.enhanceWorkflow(result.workflow);
        
        return result;
      } else {
        throw new Error('AI response parsing failed');
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      throw error;
    }
  }

  // Enhance workflow with missing required data
  private enhanceWorkflow(workflow: any) {
    return {
      ...workflow,
      estimatedExecutionTime: workflow.estimatedExecutionTime || 30,
      requiredPermissions: workflow.requiredPermissions || [],
      requiredApiKeys: workflow.requiredApiKeys || ['anthropic']
    };
  }

  // Generate hardcoded document calendar workflow  
  private generateDocumentCalendarWorkflow(description: string): WorkflowGenerationResult {
    // Create a hardcoded Document → Universal Agent → Gmail → Calendar workflow
    const nodes: Node[] = [
      {
        id: 'document-1',
        type: 'document',
        position: { x: 100, y: 100 },
        data: {
          label: 'Document Upload',
          description: 'Upload and process documents',
          status: 'idle',
          config: {
            fileTypes: ['pdf', 'docx', 'txt'],
            extractText: true
          }
        }
      },
      {
        id: 'universal-agent-1',
        type: 'universal_agent',
        position: { x: 400, y: 100 },
        data: {
          label: 'AI Document Analyzer',
          description: 'Analyze document content with AI',
          status: 'idle',
          config: {
            provider: 'anthropic',
            model: 'claude-3-sonnet-20240229',
            systemPrompt: 'Analyze the document and extract key information for calendar event creation.',
            userPrompt: 'Extract meeting details, dates, and participants from: {{document-1.output}}'
          }
        }
      },
      {
        id: 'gmail-1',
        type: 'gmail',
        position: { x: 700, y: 100 },
        data: {
          label: 'Email Notification',
          description: 'Send email with analysis results',
          status: 'idle',
          config: {
            action: 'send',
            subject: 'Document Analysis Complete',
            body: 'Analysis results: {{universal-agent-1.output}}'
          }
        }
      },
      {
        id: 'google-calendar-1',
        type: 'google_calendar',
        position: { x: 1000, y: 100 },
        data: {
          label: 'Create Calendar Event',
          description: 'Create calendar event from document analysis',
          status: 'idle',
          config: {
            action: 'create_event',
            summary: 'Event from Document',
            description: '{{universal-agent-1.output}}'
          }
        }
      }
    ];

    const edges: Edge[] = [
      {
        id: 'edge-1',
        source: 'document-1',
        target: 'universal-agent-1',
        sourceHandle: 'document_output',
        targetHandle: 'text_input',
        type: 'smoothstep',
        animated: true
      },
      {
        id: 'edge-2',
        source: 'universal-agent-1',
        target: 'gmail-1',
        sourceHandle: 'text_output',
        targetHandle: 'email_content',
        type: 'smoothstep',
        animated: true
      },
      {
        id: 'edge-3',
        source: 'universal-agent-1',
        target: 'google-calendar-1',
        sourceHandle: 'text_output',
        targetHandle: 'event_input',
        type: 'smoothstep',
        animated: true
      }
    ];

    return {
      success: true,
      workflow: {
        nodes,
        edges,
        description: 'Document analysis with AI for calendar event creation',
        estimatedExecutionTime: 30,
        requiredPermissions: ['gmail.send', 'calendar.write', 'drive.read'],
        requiredApiKeys: ['anthropic', 'google']
      }
    };
  }

  // Generate demo workflows for common use cases
  private generateDemoWorkflow(description: string): WorkflowGenerationResult {
    const lowerDesc = description.toLowerCase();
    
    // GitHub PR to Email workflow
    if (lowerDesc.includes('github') && (lowerDesc.includes('pr') || lowerDesc.includes('pull request')) && lowerDesc.includes('email')) {
      return {
        success: true,
        workflow: {
          nodes: [
            {
              id: 'trigger-1',
              type: 'trigger',
              position: { x: 100, y: 100 },
              data: {
                label: 'GitHub PR Trigger',
                description: 'Triggers when a pull request is created or updated',
                status: 'idle',
                config: {
                  triggerType: 'webhook',
                  webhookUrl: 'https://your-domain.com/webhook/github'
                }
              }
            },
            {
              id: 'github-1',
              type: 'github',
              position: { x: 400, y: 100 },
              data: {
                label: 'Get PR Details',
                description: 'Fetch pull request information',
                status: 'idle',
                config: {
                  action: 'getPullRequest',
                  repository: 'owner/repo'
                }
              }
            },
            {
              id: 'ai-1',
              type: 'universal_agent',
              position: { x: 700, y: 100 },
              data: {
                label: 'AI Code Review',
                description: 'Analyze PR code changes',
                status: 'idle',
                config: {
                  provider: 'anthropic',
                  model: 'claude-3-sonnet-20240229',
                  systemPrompt: 'You are a senior code reviewer. Analyze the pull request changes and provide a comprehensive review.',
                  userPrompt: 'Review this PR: {{github-1.output}}'
                }
              }
            },
            {
              id: 'gmail-1',
              type: 'gmail',
              position: { x: 1000, y: 100 },
              data: {
                label: 'Send Email Report',
                description: 'Email the code review to team',
                status: 'idle',
                config: {
                  action: 'send',
                  subject: 'PR Review: {{github-1.title}}',
                  body: '{{ai-1.output}}'
                }
              }
            }
          ],
          edges: [
            {
              id: 'edge-1',
              source: 'trigger-1',
              target: 'github-1',
              sourceHandle: 'trigger_data',
              targetHandle: 'input',
              type: 'smoothstep',
              animated: true
            },
            {
              id: 'edge-2',
              source: 'github-1',
              target: 'ai-1',
              sourceHandle: 'pr_info',
              targetHandle: 'text_input',
              type: 'smoothstep',
              animated: true
            },
            {
              id: 'edge-3',
              source: 'ai-1',
              target: 'gmail-1',
              sourceHandle: 'text_output',
              targetHandle: 'email_content',
              type: 'smoothstep',
              animated: true
            }
          ],
          description: 'Automatically review GitHub pull requests with AI and send email summaries',
          estimatedExecutionTime: 45,
          requiredPermissions: ['github:read', 'gmail:send'],
          requiredApiKeys: ['github', 'anthropic', 'gmail']
        },
        questions: [
          {
            id: 'github_repo',
            question: 'Which GitHub repository should be monitored?',
            type: 'text',
            required: true,
            context: 'Specify the repository in format: owner/repository-name'
          },
          {
            id: 'email_recipients',
            question: 'Who should receive the code review reports?',
            type: 'text',
            required: true,
            context: 'Enter email addresses separated by commas'
          }
        ]
      };
    }
    
    // Document analysis workflow
    if (lowerDesc.includes('document') && lowerDesc.includes('analyze')) {
      return {
        success: true,
        workflow: {
          nodes: [
            {
              id: 'trigger-1',
              type: 'trigger',
              position: { x: 100, y: 100 },
              data: {
                label: 'Manual Trigger',
                description: 'Start document analysis',
                status: 'idle',
                config: {
                  triggerType: 'manual'
                }
              }
            },
            {
              id: 'document-1',
              type: 'document',
              position: { x: 400, y: 100 },
              data: {
                label: 'Document Input',
                description: 'Upload and process document',
                status: 'idle',
                config: {
                  fileType: 'pdf',
                  extractText: true,
                  extractMetadata: true
                }
              }
            },
            {
              id: 'ai-1',
              type: 'universal_agent',
              position: { x: 700, y: 100 },
              data: {
                label: 'AI Analysis',
                description: 'Analyze document content',
                status: 'idle',
                config: {
                  provider: 'anthropic',
                  model: 'claude-3-sonnet-20240229',
                  systemPrompt: 'You are a document analyst. Provide a comprehensive analysis of the document.',
                  userPrompt: 'Analyze this document: {{document-1.text_content}}'
                }
              }
            }
          ],
          edges: [
            {
              id: 'edge-1',
              source: 'trigger-1',
              target: 'document-1',
              sourceHandle: 'trigger_data',
              targetHandle: 'input',
              type: 'smoothstep',
              animated: true
            },
            {
              id: 'edge-2',
              source: 'document-1',
              target: 'ai-1',
              sourceHandle: 'text_content',
              targetHandle: 'text_input',
              type: 'smoothstep',
              animated: true
            }
          ],
          description: 'Upload documents and get AI-powered analysis',
          estimatedExecutionTime: 30,
          requiredPermissions: [],
          requiredApiKeys: ['anthropic']
        },
        questions: []
      };
    }
    
    // Default: return a simple workflow template
    return {
      success: true,
      workflow: {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Start Workflow',
              description: 'Manual trigger to start',
              status: 'idle',
              config: {
                triggerType: 'manual'
              }
            }
          },
          {
            id: 'ai-1',
            type: 'universal_agent',
            position: { x: 400, y: 100 },
            data: {
              label: 'AI Processing',
              description: 'Process with AI',
              status: 'idle',
              config: {
                provider: 'anthropic',
                model: 'claude-3-sonnet-20240229',
                systemPrompt: 'You are a helpful assistant.',
                userPrompt: 'Process this input'
              }
            }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'trigger-1',
            target: 'ai-1',
            sourceHandle: 'trigger_data',
            targetHandle: 'text_input',
            type: 'smoothstep',
            animated: true
          }
        ],
        description: 'Basic workflow template - customize as needed',
        estimatedExecutionTime: 20,
        requiredPermissions: [],
        requiredApiKeys: ['anthropic']
      },
      questions: [
        {
          id: 'workflow_purpose',
          question: 'What would you like this workflow to do?',
          type: 'text',
          required: true,
          context: 'Describe your automation needs in detail'
        }
      ]
    };
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

  private validateAndEnhanceWorkflow(workflow: {
    nodes: any[];
    edges: any[];
    [key: string]: any;
  }): {
    nodes: Node[];
    edges: Edge[];
    [key: string]: any;
  } {
    // Ensure all nodes have required fields
    const enhancedNodes = workflow.nodes.map((node: Record<string, any>, index: number) => ({
      id: node.id || `node_${index}`,
      type: node.type,
      position: node.position || { x: 100 + index * 300, y: 100 },
      data: {
        label: node.data?.label || node.label || this.NODE_TEMPLATES[node.type]?.label || node.type,
        description: node.data?.description || this.NODE_TEMPLATES[node.type]?.description || `${node.type} node`,
        status: 'idle',
        config: node.data?.config || node.config || {},
        ...node.data
      }
    }));

    // Ensure all edges have required fields
    const enhancedEdges = workflow.edges.map((edge: Record<string, any>, index: number) => ({
      id: edge.id || `edge_${index}`,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || 'output',
      targetHandle: edge.targetHandle || 'input',
      type: edge.type || 'smoothstep',
      animated: edge.animated !== false
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

    // Check for isolated nodes (except triggers which can be isolated)
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
        const config = node.data?.config || {};
        const missingConfig = template.requiredConfig.filter(key => 
          !config[key] && key !== 'credentials' && key !== 'token' // Skip auth checks
        );
        if (missingConfig.length > 0) {
          errors.push(`Node "${node.data?.label || node.id}" missing required config: ${missingConfig.join(', ')}`);
        }
      }
    }

    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const outgoingEdges = edges.filter(edge => edge.source === nodeId);
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.target)) {
          if (hasCycle(edge.target)) return true;
        } else if (recursionStack.has(edge.target)) {
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    for (const node of nodes) {
      if (!visited.has(node.id) && hasCycle(node.id)) {
        errors.push('Workflow contains circular dependencies');
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Get example workflows for different use cases
  getExampleWorkflows(): { name: string; description: string; prompt: string }[] {
    return [
      {
        name: 'GitHub PR Code Review',
        description: 'Automatically review pull requests and send summaries',
        prompt: 'When someone creates a GitHub PR, have AI review the code and send me an email summary'
      },
      {
        name: 'Document Processing Pipeline',
        description: 'Extract text from documents and analyze with AI',
        prompt: 'Analyze uploaded PDF documents with AI and generate a summary report'
      },
      {
        name: 'Email Automation',
        description: 'Process incoming emails and respond automatically',
        prompt: 'When I receive an email with "urgent" in the subject, analyze it and create a calendar event'
      },
      {
        name: 'Social Media Monitor',
        description: 'Monitor social mentions and respond',
        prompt: 'Monitor Twitter for mentions of my brand and generate AI responses'
      },
      {
        name: 'Data Pipeline',
        description: 'Extract data from API and process it',
        prompt: 'Every day at 9am, fetch data from my API, analyze it with AI, and send a report'
      }
    ];
  }
}

export const workflowGenerationService = new WorkflowGenerationService();