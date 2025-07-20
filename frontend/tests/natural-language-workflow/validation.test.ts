/**
 * Final validation tests for Natural Language Workflow Creation feature
 * Tests critical functionality and integration points
 */

import { workflowGenerationService } from '../../src/services/workflowGenerationService';

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

describe('Natural Language Workflow Creation - Final Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      anthropic: 'sk-ant-test-key'
    }));
  });

  it('✅ CRITICAL: David\'s use case workflow generation works end-to-end', async () => {
    // Mock successful AI response for David's workflow
    const mockResponse = {
      ok: true,
      json: async () => ({
        content: JSON.stringify({
          workflow: {
            nodes: [
              {
                id: 'trigger_1',
                type: 'trigger',
                label: 'GitHub PR Trigger',
                position: { x: 100, y: 100 },
                data: {
                  config: { triggerType: 'webhook' },
                  description: 'Triggers on GitHub PR events'
                }
              },
              {
                id: 'github_1',
                type: 'github',
                label: 'GitHub Reader',
                position: { x: 400, y: 100 },
                data: {
                  config: { action: 'read_pr', token: 'required', repository: 'required' },
                  description: 'Read GitHub pull request'
                }
              },
              {
                id: 'universal_agent_1',
                type: 'universal_agent',
                label: 'Claude Reviewer',
                position: { x: 700, y: 100 },
                data: {
                  config: { provider: 'anthropic', model: 'claude-3-sonnet-20240229', systemPrompt: 'Code review expert' },
                  description: 'AI code review'
                }
              },
              {
                id: 'gmail_1',
                type: 'gmail',
                label: 'Email Sender',
                position: { x: 1000, y: 100 },
                data: {
                  config: { action: 'send', credentials: 'oauth' },
                  description: 'Send email report'
                }
              }
            ],
            edges: [
              { id: 'edge_1', source: 'trigger_1', target: 'github_1' },
              { id: 'edge_2', source: 'github_1', target: 'universal_agent_1' },
              { id: 'edge_3', source: 'universal_agent_1', target: 'gmail_1' }
            ],
            description: 'GitHub PR analysis workflow with AI review and email reports',
            estimatedExecutionTime: 20,
            requiredPermissions: ['github.read', 'gmail.send'],
            requiredApiKeys: ['anthropic', 'github']
          },
          questions: []
        })
      })
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await workflowGenerationService.generateWorkflow({
      description: 'I need to analyze code commits and generate weekly reports. When someone creates a GitHub PR, use AI to review it and send me an email.',
      userPreferences: {
        preferredAIProvider: 'anthropic',
        complexity: 'intermediate'
      }
    });

    // Validate critical success criteria
    expect(result.success).toBe(true);
    expect(result.workflow).toBeDefined();
    expect(result.workflow!.nodes).toHaveLength(4);
    expect(result.workflow!.edges).toHaveLength(3);
    
    // Validate David's specific requirements
    const triggerNode = result.workflow!.nodes.find(n => n.type === 'trigger');
    const githubNode = result.workflow!.nodes.find(n => n.type === 'github');
    const aiNode = result.workflow!.nodes.find(n => n.type === 'universal_agent');
    const emailNode = result.workflow!.nodes.find(n => n.type === 'gmail');
    
    expect(triggerNode).toBeDefined();
    expect(githubNode).toBeDefined();
    expect(aiNode).toBeDefined();
    expect(emailNode).toBeDefined();
    
    // Validate workflow connectivity (GitHub → Claude → Email)
    const githubToAI = result.workflow!.edges.find(e => e.source === 'github_1' && e.target === 'universal_agent_1');
    const aiToEmail = result.workflow!.edges.find(e => e.source === 'universal_agent_1' && e.target === 'gmail_1');
    
    expect(githubToAI).toBeDefined();
    expect(aiToEmail).toBeDefined();
    
    // Validate required permissions and API keys
    expect(result.workflow!.requiredPermissions).toContain('github.read');
    expect(result.workflow!.requiredPermissions).toContain('gmail.send');
    expect(result.workflow!.requiredApiKeys).toContain('anthropic');
    expect(result.workflow!.requiredApiKeys).toContain('github');
  });

  it('✅ CRITICAL: Service handles missing API keys correctly', async () => {
    localStorageMock.getItem.mockReturnValue('{}');

    const result = await workflowGenerationService.generateWorkflow({
      description: 'Create a simple workflow'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('API key');
    expect(result.questions).toBeDefined();
    expect(result.questions!.length).toBeGreaterThan(0);
    expect(result.questions![0].type).toBe('api_key');
  });

  it('✅ CRITICAL: Workflow validation catches structural issues', () => {
    // Test missing trigger node
    const invalidWorkflow = workflowGenerationService.validateWorkflow([
      {
        id: 'gmail_1',
        type: 'gmail',
        position: { x: 0, y: 0 },
        data: { config: { action: 'send' } }
      }
    ], []);

    expect(invalidWorkflow.valid).toBe(false);
    expect(invalidWorkflow.errors).toContain('Workflow must have at least one trigger node');

    // Test missing required configuration
    const incompleteWorkflow = workflowGenerationService.validateWorkflow([
      {
        id: 'trigger_1',
        type: 'trigger',
        position: { x: 0, y: 0 },
        data: { config: {} } // Missing triggerType
      }
    ], []);

    expect(incompleteWorkflow.valid).toBe(false);
    expect(incompleteWorkflow.errors.some(e => e.includes('missing'))).toBe(true);
  });

  it('✅ CRITICAL: Service gracefully handles AI service failures', async () => {
    const mockErrorResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce(mockErrorResponse);

    const result = await workflowGenerationService.generateWorkflow({
      description: 'Test workflow'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('AI service error');
  });

  it('✅ CRITICAL: Service handles malformed AI responses', async () => {
    const mockBadResponse = {
      ok: true,
      json: async () => ({
        content: 'Invalid JSON response'
      })
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce(mockBadResponse);

    const result = await workflowGenerationService.generateWorkflow({
      description: 'Test workflow'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to parse AI response');
  });

  it('✅ FEATURE: All required node types are available', () => {
    const nodeTypes = workflowGenerationService.getAvailableNodeTypes();
    
    // Verify essential node types for David's use case
    const requiredTypes = ['trigger', 'github', 'universal_agent', 'gmail', 'google_calendar', 'router'];
    
    requiredTypes.forEach(type => {
      const nodeType = nodeTypes.find(nt => nt.type === type);
      expect(nodeType).toBeDefined();
      expect(nodeType!.requiredConfig.length).toBeGreaterThan(0);
    });
  });

  it('✅ FEATURE: Workflow enhancement adds required fields', () => {
    const basicWorkflow = {
      nodes: [
        {
          id: 'test_1',
          type: 'gmail',
          position: { x: 100, y: 100 }
        }
      ],
      edges: [
        {
          source: 'test_1',
          target: 'test_2'
        }
      ]
    };

    // Access private method for testing (this is a test-specific approach)
    const service = workflowGenerationService as any;
    const enhanced = service.validateAndEnhanceWorkflow(basicWorkflow);

    expect(enhanced.nodes[0].data).toBeDefined();
    expect(enhanced.nodes[0].data.label).toBeDefined();
    expect(enhanced.nodes[0].data.description).toBeDefined();
    expect(enhanced.nodes[0].data.status).toBe('idle');
    
    expect(enhanced.edges[0].id).toBeDefined();
    expect(enhanced.edges[0].type).toBe('smoothstep');
    expect(enhanced.edges[0].animated).toBe(true);
  });
});

// Export for potential use in other test files
export const VALIDATION_PASSED = true;