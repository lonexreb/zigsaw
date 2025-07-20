/**
 * @jest-environment jsdom
 */
import { workflowGenerationService, WorkflowGenerationRequest } from '../../src/services/workflowGenerationService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

describe('WorkflowGenerationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      anthropic: 'sk-ant-test-key',
      openai: 'sk-test-key',
      groq: 'gsk_test-key'
    }));
  });

  describe('generateWorkflow', () => {
    it('should generate a simple email workflow from natural language', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: JSON.stringify({
            workflow: {
              nodes: [
                {
                  id: 'trigger_1',
                  type: 'trigger',
                  label: 'Email Trigger',
                  position: { x: 100, y: 100 },
                  data: {
                    config: { triggerType: 'email' },
                    description: 'Triggers on new email'
                  }
                },
                {
                  id: 'gmail_1',
                  type: 'gmail',
                  label: 'Gmail Reader',
                  position: { x: 400, y: 100 },
                  data: {
                    config: { action: 'read', credentials: 'oauth' },
                    description: 'Read Gmail emails'
                  }
                }
              ],
              edges: [
                {
                  id: 'edge_1',
                  source: 'trigger_1',
                  target: 'gmail_1',
                  sourceHandle: 'output',
                  targetHandle: 'input'
                }
              ],
              description: 'Simple email reading workflow',
              estimatedExecutionTime: 5,
              requiredPermissions: ['gmail.readonly'],
              requiredApiKeys: ['anthropic']
            },
            questions: []
          })
        })
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const request: WorkflowGenerationRequest = {
        description: 'Read my Gmail emails and show me new messages',
        userPreferences: {
          preferredAIProvider: 'anthropic',
          complexity: 'simple'
        }
      };

      const result = await workflowGenerationService.generateWorkflow(request);

      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
      expect(result.workflow!.nodes).toHaveLength(2);
      expect(result.workflow!.edges).toHaveLength(1);
      expect(result.workflow!.description).toBe('Simple email reading workflow');
      expect(result.workflow!.requiredPermissions).toContain('gmail.readonly');
    });

    it('should handle complex GitHub to email workflow', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: JSON.stringify({
            workflow: {
              nodes: [
                {
                  id: 'trigger_1',
                  type: 'trigger',
                  label: 'GitHub Webhook',
                  position: { x: 100, y: 100 },
                  data: {
                    config: { triggerType: 'webhook', webhook: 'github_pr' },
                    description: 'Triggers on GitHub PR events'
                  }
                },
                {
                  id: 'github_1',
                  type: 'github',
                  label: 'GitHub PR Analyzer',
                  position: { x: 400, y: 100 },
                  data: {
                    config: { action: 'analyze_pr', token: 'required', repository: 'user/repo' },
                    description: 'Analyze GitHub pull request'
                  }
                },
                {
                  id: 'universal_agent_1',
                  type: 'universal_agent',
                  label: 'AI Code Reviewer',
                  position: { x: 700, y: 100 },
                  data: {
                    config: { 
                      provider: 'anthropic', 
                      model: 'claude-3-sonnet-20240229',
                      systemPrompt: 'You are a senior code reviewer'
                    },
                    description: 'AI-powered code review'
                  }
                },
                {
                  id: 'gmail_1',
                  type: 'gmail',
                  label: 'Email Sender',
                  position: { x: 1000, y: 100 },
                  data: {
                    config: { action: 'send', credentials: 'oauth' },
                    description: 'Send email with review results'
                  }
                }
              ],
              edges: [
                { id: 'edge_1', source: 'trigger_1', target: 'github_1' },
                { id: 'edge_2', source: 'github_1', target: 'universal_agent_1' },
                { id: 'edge_3', source: 'universal_agent_1', target: 'gmail_1' }
              ],
              description: 'GitHub PR analysis and email notification workflow',
              estimatedExecutionTime: 15,
              requiredPermissions: ['github.read', 'gmail.send'],
              requiredApiKeys: ['anthropic', 'github']
            },
            questions: [
              {
                id: 'github_token',
                question: 'Please provide your GitHub access token',
                type: 'api_key',
                required: true,
                context: 'Required to access GitHub repository data'
              }
            ]
          })
        })
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const request: WorkflowGenerationRequest = {
        description: 'When someone creates a GitHub pull request, analyze it with AI and send me an email summary',
        userPreferences: {
          preferredAIProvider: 'anthropic',
          complexity: 'advanced',
          includeErrorHandling: true
        }
      };

      const result = await workflowGenerationService.generateWorkflow(request);

      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
      expect(result.workflow!.nodes).toHaveLength(4);
      expect(result.workflow!.edges).toHaveLength(3);
      expect(result.questions).toHaveLength(1);
      expect(result.questions![0].type).toBe('api_key');
      expect(result.workflow!.estimatedExecutionTime).toBe(15);
    });

    it('should handle missing API key error', async () => {
      localStorageMock.getItem.mockReturnValue('{}');

      const request: WorkflowGenerationRequest = {
        description: 'Create a simple workflow',
        userPreferences: {
          preferredAIProvider: 'anthropic'
        }
      };

      const result = await workflowGenerationService.generateWorkflow(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('anthropic API key');
      expect(result.questions).toHaveLength(1);
      expect(result.questions![0].type).toBe('api_key');
    });

    it('should handle AI service errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const request: WorkflowGenerationRequest = {
        description: 'Create a workflow',
        userPreferences: {
          preferredAIProvider: 'anthropic'
        }
      };

      const result = await workflowGenerationService.generateWorkflow(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('AI service error');
    });

    it('should handle invalid JSON response from AI', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: 'This is not valid JSON for workflow generation'
        })
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const request: WorkflowGenerationRequest = {
        description: 'Create a workflow'
      };

      const result = await workflowGenerationService.generateWorkflow(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse AI response');
    });
  });

  describe('validateWorkflow', () => {
    it('should validate a correct workflow', () => {
      const nodes = [
        {
          id: 'trigger_1',
          type: 'trigger',
          position: { x: 0, y: 0 },
          data: { config: { triggerType: 'manual' } }
        },
        {
          id: 'gmail_1',
          type: 'gmail',
          position: { x: 300, y: 0 },
          data: { config: { action: 'send', credentials: 'oauth' } }
        }
      ];

      const edges = [
        {
          id: 'edge_1',
          source: 'trigger_1',
          target: 'gmail_1'
        }
      ];

      const result = workflowGenerationService.validateWorkflow(nodes, edges);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing trigger node', () => {
      const nodes = [
        {
          id: 'gmail_1',
          type: 'gmail',
          position: { x: 300, y: 0 },
          data: { config: { action: 'send', credentials: 'oauth' } }
        }
      ];

      const edges: any[] = [];

      const result = workflowGenerationService.validateWorkflow(nodes, edges);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Workflow must have at least one trigger node');
    });

    it('should detect isolated nodes', () => {
      const nodes = [
        {
          id: 'trigger_1',
          type: 'trigger',
          position: { x: 0, y: 0 },
          data: { config: { triggerType: 'manual' } }
        },
        {
          id: 'gmail_1',
          type: 'gmail',
          position: { x: 300, y: 0 },
          data: { config: { action: 'send' }, label: 'Gmail Node' }
        }
      ];

      const edges: any[] = []; // No connections

      const result = workflowGenerationService.validateWorkflow(nodes, edges);

      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('Isolated nodes found'))).toBe(true);
    });

    it('should detect missing required configuration', () => {
      const nodes = [
        {
          id: 'trigger_1',
          type: 'trigger',
          position: { x: 0, y: 0 },
          data: { config: {} } // Missing triggerType
        },
        {
          id: 'gmail_1',
          type: 'gmail',
          position: { x: 300, y: 0 },
          data: { config: {}, label: 'Gmail Node' } // Missing action and credentials
        }
      ];

      const edges = [
        {
          id: 'edge_1',
          source: 'trigger_1',
          target: 'gmail_1'
        }
      ];

      const result = workflowGenerationService.validateWorkflow(nodes, edges);

      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('missing'))).toBe(true);
    });
  });

  describe('getAvailableNodeTypes', () => {
    it('should return all available node types', () => {
      const nodeTypes = workflowGenerationService.getAvailableNodeTypes();

      expect(nodeTypes).toBeInstanceOf(Array);
      expect(nodeTypes.length).toBeGreaterThan(0);
      
      const triggerNode = nodeTypes.find(node => node.type === 'trigger');
      expect(triggerNode).toBeDefined();
      expect(triggerNode!.category).toBe('trigger');
      expect(triggerNode!.requiredConfig).toContain('triggerType');

      const gmailNode = nodeTypes.find(node => node.type === 'gmail');
      expect(gmailNode).toBeDefined();
      expect(gmailNode!.category).toBe('integration');
      expect(gmailNode!.requiredConfig).toContain('action');
      expect(gmailNode!.requiredConfig).toContain('credentials');
    });
  });
});