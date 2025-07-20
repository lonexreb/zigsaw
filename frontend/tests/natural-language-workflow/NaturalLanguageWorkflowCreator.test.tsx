/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NaturalLanguageWorkflowCreator from '../../src/components/NaturalLanguageWorkflowCreator';
import { WorkflowProvider } from '../../src/contexts/WorkflowContext';
import { workflowGenerationService } from '../../src/services/workflowGenerationService';

// Mock the workflow generation service
jest.mock('../../src/services/workflowGenerationService');
const mockWorkflowGenerationService = workflowGenerationService as jest.Mocked<typeof workflowGenerationService>;

// Mock toast
const mockToast = jest.fn();
jest.mock('../../src/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons
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
}));

// Create a test wrapper with WorkflowProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <WorkflowProvider>
    {children}
  </WorkflowProvider>
);

describe('NaturalLanguageWorkflowCreator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders welcome message and input field', () => {
    render(
      <TestWrapper>
        <NaturalLanguageWorkflowCreator />
      </TestWrapper>
    );

    expect(screen.getByText(/Welcome! I can help you create automated workflows/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Describe the workflow you want to create/)).toBeInTheDocument();
    expect(screen.getByText('AI Workflow Creator')).toBeInTheDocument();
  });

  it('shows example prompts', () => {
    render(
      <TestWrapper>
        <NaturalLanguageWorkflowCreator />
      </TestWrapper>
    );

    expect(screen.getByText('Try these examples:')).toBeInTheDocument();
    
    // Check that at least one example prompt is visible
    const exampleButtons = screen.getAllByRole('button');
    const hasExamplePrompt = exampleButtons.some(button => 
      button.textContent?.includes('GitHub') || 
      button.textContent?.includes('email') ||
      button.textContent?.includes('Gmail')
    );
    expect(hasExamplePrompt).toBe(true);
  });

  it('handles user input and workflow generation', async () => {
    const user = userEvent.setup();
    
    const mockWorkflowResult = {
      success: true,
      workflow: {
        nodes: [
          {
            id: 'trigger_1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: { label: 'Email Trigger', description: 'Triggers on new email' }
          }
        ],
        edges: [],
        description: 'Simple email workflow',
        estimatedExecutionTime: 5,
        requiredPermissions: ['gmail.readonly'],
        requiredApiKeys: ['anthropic']
      },
      questions: []
    };

    mockWorkflowGenerationService.generateWorkflow.mockResolvedValueOnce(mockWorkflowResult);

    render(
      <TestWrapper>
        <NaturalLanguageWorkflowCreator />
      </TestWrapper>
    );

    const textarea = screen.getByPlaceholderText(/Describe the workflow you want to create/);
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Type a workflow description
    await user.type(textarea, 'Create a workflow to read my Gmail emails');
    
    // Click send
    await user.click(sendButton);

    // Wait for the workflow generation service to be called
    await waitFor(() => {
      expect(mockWorkflowGenerationService.generateWorkflow).toHaveBeenCalledWith({
        description: 'Create a workflow to read my Gmail emails',
        userPreferences: {
          preferredAIProvider: 'anthropic',
          complexity: 'intermediate',
          includeErrorHandling: true
        }
      });
    });

    // Check that success message appears
    await waitFor(() => {
      expect(screen.getByText(/Great! I've created a workflow for you/)).toBeInTheDocument();
    });
  });

  it('handles workflow generation errors', async () => {
    const user = userEvent.setup();
    
    const mockErrorResult = {
      success: false,
      error: 'API key is required'
    };

    mockWorkflowGenerationService.generateWorkflow.mockResolvedValueOnce(mockErrorResult);

    render(
      <TestWrapper>
        <NaturalLanguageWorkflowCreator />
      </TestWrapper>
    );

    const textarea = screen.getByPlaceholderText(/Describe the workflow you want to create/);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(textarea, 'Create a workflow');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/I couldn't generate a workflow/)).toBeInTheDocument();
      expect(screen.getByText(/API key is required/)).toBeInTheDocument();
    });
  });

  it('handles questions from workflow generation', async () => {
    const user = userEvent.setup();
    
    const mockQuestionResult = {
      success: false,
      questions: [
        {
          id: 'api_key',
          question: 'Please provide your API key',
          type: 'api_key' as const,
          required: true,
          context: 'Required for AI processing'
        }
      ]
    };

    mockWorkflowGenerationService.generateWorkflow.mockResolvedValueOnce(mockQuestionResult);

    render(
      <TestWrapper>
        <NaturalLanguageWorkflowCreator />
      </TestWrapper>
    );

    const textarea = screen.getByPlaceholderText(/Describe the workflow you want to create/);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(textarea, 'Create a complex workflow');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Please provide your API key')).toBeInTheDocument();
      expect(screen.getByText('Required for AI processing')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter API key...')).toBeInTheDocument();
    });
  });

  it('shows loading state during workflow generation', async () => {
    const user = userEvent.setup();
    
    // Create a promise that we can resolve manually
    let resolvePromise: (value: any) => void;
    const mockPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockWorkflowGenerationService.generateWorkflow.mockReturnValueOnce(mockPromise);

    render(
      <TestWrapper>
        <NaturalLanguageWorkflowCreator />
      </TestWrapper>
    );

    const textarea = screen.getByPlaceholderText(/Describe the workflow you want to create/);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(textarea, 'Create a workflow');
    await user.click(sendButton);

    // Check loading state
    expect(screen.getByText('Generating your workflow...')).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();

    // Resolve the promise to complete the test
    resolvePromise!({
      success: true,
      workflow: {
        nodes: [],
        edges: [],
        description: 'Test workflow',
        estimatedExecutionTime: 1,
        requiredPermissions: [],
        requiredApiKeys: []
      }
    });

    await waitFor(() => {
      expect(screen.queryByText('Generating your workflow...')).not.toBeInTheDocument();
    });
  });

  it('allows clicking on example prompts to fill input', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <NaturalLanguageWorkflowCreator />
      </TestWrapper>
    );

    const textarea = screen.getByPlaceholderText(/Describe the workflow you want to create/);
    
    // Find an example button (assuming GitHub is in the first 3 examples)
    const exampleButtons = screen.getAllByRole('button');
    const githubExampleButton = exampleButtons.find(button => 
      button.textContent?.includes('GitHub') || button.textContent?.includes('pull')
    );

    if (githubExampleButton) {
      await user.click(githubExampleButton);
      
      // Check that the textarea was filled
      expect(textarea).toHaveValue(expect.stringContaining('GitHub'));
    }
  });

  it('disables send button when textarea is empty', () => {
    render(
      <TestWrapper>
        <NaturalLanguageWorkflowCreator />
      </TestWrapper>
    );

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when textarea has content', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <NaturalLanguageWorkflowCreator />
      </TestWrapper>
    );

    const textarea = screen.getByPlaceholderText(/Describe the workflow you want to create/);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(textarea, 'Test input');
    
    expect(sendButton).not.toBeDisabled();
  });

  it('handles Enter key to send message', async () => {
    const user = userEvent.setup();
    
    const mockWorkflowResult = {
      success: true,
      workflow: {
        nodes: [],
        edges: [],
        description: 'Test workflow',
        estimatedExecutionTime: 1,
        requiredPermissions: [],
        requiredApiKeys: []
      }
    };

    mockWorkflowGenerationService.generateWorkflow.mockResolvedValueOnce(mockWorkflowResult);

    render(
      <TestWrapper>
        <NaturalLanguageWorkflowCreator />
      </TestWrapper>
    );

    const textarea = screen.getByPlaceholderText(/Describe the workflow you want to create/);

    await user.type(textarea, 'Test workflow');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockWorkflowGenerationService.generateWorkflow).toHaveBeenCalled();
    });
  });
});