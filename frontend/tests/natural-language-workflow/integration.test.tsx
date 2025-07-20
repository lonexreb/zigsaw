/**
 * Integration tests for the complete Natural Language Workflow Creation flow
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NaturalLanguageWorkflowCreator from '../../src/components/NaturalLanguageWorkflowCreator';
import { WorkflowProvider } from '../../src/contexts/WorkflowContext';

// Mock the actual API call
global.fetch = jest.fn();

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

// Mock toast
const mockToast = jest.fn();
jest.mock('../../src/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock icons
jest.mock('lucide-react', () => ({
  Bot: () => <div data-testid="bot-icon" />,
  Send: () => <div data-testid="send-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  CheckCircle: () => <div data-testid="check-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  Play: () => <div data-testid="play-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  FileQuestion: () => <div data-testid="question-icon" />,
  Lightbulb: () => <div data-testid="lightbulb-icon" />,
  Workflow: () => <div data-testid="workflow-icon" />,
  ArrowRight: () => <div data-testid="arrow-icon" />,
  X: () => <div data-testid="x-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  Key: () => <div data-testid="key-icon" />,
  Maximize2: () => <div data-testid="maximize-icon" />,
  Minimize2: () => <div data-testid="minimize-icon" />,
  MessageSquare: () => <div data-testid="message-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock import.meta.env
Object.defineProperty(window, 'import', {
  value: {
    meta: {
      env: {
        VITE_BACKEND_URL: 'https://test-backend.com'
      }
    }
  }
});

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <WorkflowProvider>
    {children}
  </WorkflowProvider>
);

describe('Natural Language Workflow Creation - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API keys in localStorage
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      anthropic: 'sk-ant-test-key-123',
      openai: 'sk-test-key-123',
      groq: 'gsk_test-key-123'
    }));
  });

  describe('End-to-End Workflow Creation', () => {
    it('should complete the full workflow creation flow for David\'s use case', async () => {
      const user = userEvent.setup();

      // Mock successful AI response for GitHub → Claude → Email workflow
      const mockAIResponse = {
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
                    config: { triggerType: 'webhook', webhook: 'github_pr' },
                    description: 'Triggers when a GitHub PR is created'
                  }
                },
                {
                  id: 'github_1',
                  type: 'github',
                  label: 'GitHub PR Reader',
                  position: { x: 400, y: 100 },
                  data: {
                    config: { action: 'read_pr', token: 'required', repository: 'user/repo' },
                    description: 'Fetch GitHub PR details'
                  }
                },
                {
                  id: 'universal_agent_1',
                  type: 'universal_agent',
                  label: 'Claude Code Reviewer',
                  position: { x: 700, y: 100 },
                  data: {
                    config: { 
                      provider: 'anthropic',
                      model: 'claude-3-sonnet-20240229',
                      systemPrompt: 'You are a senior code reviewer. Analyze the provided code changes.',
                      userPrompt: 'Please review this pull request and provide feedback on code quality, potential issues, and suggestions for improvement.'
                    },
                    description: 'AI-powered code review using Claude'
                  }
                },
                {
                  id: 'gmail_1',
                  type: 'gmail',
                  label: 'Email Report Sender',
                  position: { x: 1000, y: 100 },
                  data: {
                    config: { action: 'send', credentials: 'oauth', to: 'team@company.com' },
                    description: 'Send email report with code review results'
                  }
                }
              ],
              edges: [
                { id: 'edge_1', source: 'trigger_1', target: 'github_1', sourceHandle: 'output', targetHandle: 'input' },
                { id: 'edge_2', source: 'github_1', target: 'universal_agent_1', sourceHandle: 'repo_data', targetHandle: 'text_input' },
                { id: 'edge_3', source: 'universal_agent_1', target: 'gmail_1', sourceHandle: 'text_output', targetHandle: 'email_content' }
              ],
              description: 'Automated GitHub PR code review with AI analysis and email reporting - David\'s workflow',
              estimatedExecutionTime: 25,
              requiredPermissions: ['github.read', 'gmail.send'],
              requiredApiKeys: ['anthropic', 'github']
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
          })
        })
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockAIResponse);

      render(
        <TestWrapper>
          <NaturalLanguageWorkflowCreator />
        </TestWrapper>
      );

      // Step 1: User describes David's use case
      const textarea = screen.getByPlaceholderText(/Describe the workflow you want to create/);
      const sendButton = screen.getByRole('button', { name: /send/i });

      const davidsRequest = "I need to analyze code commits and generate weekly reports. When someone creates a GitHub PR, I want AI to review the code and send an email summary to my team.";
      
      await user.type(textarea, davidsRequest);
      await user.click(sendButton);

      // Step 2: Verify AI service is called correctly
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://test-backend.com/api/v1/chat',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: expect.stringContaining(davidsRequest)
          })
        );
      });

      // Step 3: Verify success message appears
      await waitFor(() => {
        expect(screen.getByText(/Great! I've created a workflow for you/)).toBeInTheDocument();
        expect(screen.getByText(/David's workflow/)).toBeInTheDocument();
        expect(screen.getByText(/4 steps/)).toBeInTheDocument();
        expect(screen.getByText(/25 seconds/)).toBeInTheDocument();
      });

      // Step 4: Verify questions are displayed
      await waitFor(() => {
        expect(screen.getByText('Which GitHub repository should be monitored?')).toBeInTheDocument();
        expect(screen.getByText('Who should receive the code review reports?')).toBeInTheDocument();
      });

      // Step 5: Answer the questions
      const repoInput = screen.getByPlaceholderText('Enter your answer...');
      await user.type(repoInput, 'mycompany/main-app');

      const emailInputs = screen.getAllByPlaceholderText('Enter your answer...');
      await user.type(emailInputs[1], 'david@company.com, team@company.com');

      // Step 6: View workflow preview
      const viewWorkflowButton = screen.getByRole('button', { name: /View Workflow/i });
      await user.click(viewWorkflowButton);

      // Step 7: Verify workflow preview dialog
      await waitFor(() => {
        expect(screen.getByText('Workflow Preview')).toBeInTheDocument();
        expect(screen.getByText('Review your generated workflow before execution')).toBeInTheDocument();
      });

      // Step 8: Verify workflow details in preview
      expect(screen.getByText('4')).toBeInTheDocument(); // Steps count
      expect(screen.getByText('25s')).toBeInTheDocument(); // Estimated time
      expect(screen.getByText('3')).toBeInTheDocument(); // Connections count

      // Step 9: Verify workflow steps are listed
      expect(screen.getByText('GitHub PR Trigger')).toBeInTheDocument();
      expect(screen.getByText('GitHub PR Reader')).toBeInTheDocument();
      expect(screen.getByText('Claude Code Reviewer')).toBeInTheDocument();
      expect(screen.getByText('Email Report Sender')).toBeInTheDocument();

      // Step 10: Verify required permissions and API keys
      expect(screen.getByText('github.read')).toBeInTheDocument();
      expect(screen.getByText('gmail.send')).toBeInTheDocument();
      expect(screen.getByText('anthropic')).toBeInTheDocument();
      expect(screen.getByText('github')).toBeInTheDocument();

      // Step 11: Execute workflow
      const executeButton = screen.getByRole('button', { name: /Execute Workflow/i });
      expect(executeButton).toBeInTheDocument();
      
      // Note: We don't actually execute in this test to avoid mocking the entire workflow execution system
    });

    it('should handle the complete flow with API key requirement', async () => {
      const user = userEvent.setup();

      // Mock missing API key scenario
      localStorageMock.getItem.mockReturnValue('{}');

      render(
        <TestWrapper>
          <NaturalLanguageWorkflowCreator />
        </TestWrapper>
      );

      const textarea = screen.getByPlaceholderText(/Describe the workflow you want to create/);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(textarea, 'Create a simple Gmail workflow');
      await user.click(sendButton);

      // Verify API key requirement message
      await waitFor(() => {
        expect(screen.getByText(/Please configure your anthropic API key first/)).toBeInTheDocument();
        expect(screen.getByText('Please provide your anthropic API key')).toBeInTheDocument();
      });

      // User provides API key
      const apiKeyInput = screen.getByPlaceholderText('Enter API key...');
      await user.type(apiKeyInput, 'sk-ant-new-api-key-123');

      // Verify API key is captured
      expect(apiKeyInput).toHaveValue('sk-ant-new-api-key-123');
    });

    it('should handle workflow generation failure gracefully', async () => {
      const user = userEvent.setup();

      // Mock API failure
      const mockErrorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockErrorResponse);

      render(
        <TestWrapper>
          <NaturalLanguageWorkflowCreator />
        </TestWrapper>
      );

      const textarea = screen.getByPlaceholderText(/Describe the workflow you want to create/);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(textarea, 'Create a workflow that will fail');
      await user.click(sendButton);

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/I couldn't generate a workflow/)).toBeInTheDocument();
        expect(screen.getByText(/AI service error/)).toBeInTheDocument();
      });

      // Verify user can try again
      expect(textarea).toBeEnabled();
      expect(sendButton).toBeEnabled();
    });

    it('should handle malformed AI response gracefully', async () => {
      const user = userEvent.setup();

      // Mock malformed JSON response
      const mockBadResponse = {
        ok: true,
        json: async () => ({
          content: 'This is not a valid JSON workflow response from the AI'
        })
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockBadResponse);

      render(
        <TestWrapper>
          <NaturalLanguageWorkflowCreator />
        </TestWrapper>
      );

      const textarea = screen.getByPlaceholderText(/Describe the workflow you want to create/);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(textarea, 'Create a workflow');
      await user.click(sendButton);

      // Verify graceful error handling
      await waitFor(() => {
        expect(screen.getByText(/I couldn't generate a workflow/)).toBeInTheDocument();
        expect(screen.getByText(/Failed to parse AI response/)).toBeInTheDocument();
      });
    });
  });

  describe('User Experience Flow', () => {
    it('should provide good UX during the entire workflow creation process', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <NaturalLanguageWorkflowCreator />
        </TestWrapper>
      );

      // Step 1: Initial state should be welcoming
      expect(screen.getByText(/Welcome! I can help you create automated workflows/)).toBeInTheDocument();
      expect(screen.getByText('Try these examples:')).toBeInTheDocument();

      // Step 2: Input should be user-friendly
      const textarea = screen.getByPlaceholderText(/Describe the workflow you want to create/);
      expect(textarea).toBeInTheDocument();
      
      // Step 3: Send button should be disabled when empty
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();

      // Step 4: Send button should enable when user types
      await user.type(textarea, 'Test');
      expect(sendButton).not.toBeDisabled();

      // Step 5: Clear user feedback during typing
      await user.clear(textarea);
      expect(sendButton).toBeDisabled();
    });

    it('should handle Enter key for better UX', async () => {
      const user = userEvent.setup();

      const mockResponse = {
        ok: true,
        json: async () => ({
          content: JSON.stringify({
            workflow: {
              nodes: [],
              edges: [],
              description: 'Test workflow',
              estimatedExecutionTime: 1,
              requiredPermissions: [],
              requiredApiKeys: []
            }
          })
        })
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      render(
        <TestWrapper>
          <NaturalLanguageWorkflowCreator />
        </TestWrapper>
      );

      const textarea = screen.getByPlaceholderText(/Describe the workflow you want to create/);
      
      await user.type(textarea, 'Create a workflow');
      await user.keyboard('{Enter}');

      // Verify that workflow generation was triggered
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });
});