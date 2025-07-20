import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Settings, 
  FileQuestion,
  Lightbulb,
  Workflow,
  ArrowRight,
  X,
  Upload,
  Key
} from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { useToast } from './ui/use-toast';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  workflowGenerationService, 
  WorkflowGenerationRequest, 
  WorkflowGenerationResult,
  UserQuestion 
} from '../services/workflowGenerationService';
import { useWorkflow } from '../contexts/WorkflowContext';
import { Node, Edge } from '@xyflow/react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'workflow' | 'question' | 'error' | 'success';
  data?: any;
}

interface WorkflowPreview {
  nodes: Node[];
  edges: Edge[];
  description: string;
  estimatedExecutionTime: number;
  requiredPermissions: string[];
  requiredApiKeys: string[];
}

const EXAMPLE_PROMPTS = [
  "Analyze GitHub pull requests and send summary emails to team members",
  "Convert Gmail attachments to text and create calendar events from meeting invites", 
  "Monitor social media mentions and respond with AI-generated replies",
  "Process customer support tickets and create tasks in project management tools",
  "Generate weekly reports from database queries and post to Slack channels"
];

export default function NaturalLanguageWorkflowCreator() {
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [workflowPreview, setWorkflowPreview] = useState<WorkflowPreview | null>(null);
  const [pendingQuestions, setPendingQuestions] = useState<UserQuestion[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, any>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Refs and hooks
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { addNodes, addEdges, executeWorkflow } = useWorkflow();

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add initial welcome message
  useEffect(() => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: 'Welcome! I can help you create automated workflows using natural language. Just describe what you want to automate, and I\'ll build it for you.',
      timestamp: new Date(),
      type: 'success'
    }]);
  }, []);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!currentInput.trim() || isGenerating) return;

    const userMessage = currentInput.trim();
    setCurrentInput('');

    // Add user message to chat
    addMessage({
      role: 'user',
      content: userMessage,
    });

    setIsGenerating(true);

    try {
      // Generate workflow from natural language
      const request: WorkflowGenerationRequest = {
        description: userMessage,
        userPreferences: {
          preferredAIProvider: 'anthropic',
          complexity: 'intermediate',
          includeErrorHandling: true
        }
      };

      const result = await workflowGenerationService.generateWorkflow(request);

      if (result.success && result.workflow) {
        // Add successful generation message
        addMessage({
          role: 'assistant',
          content: `Great! I've created a workflow for you: "${result.workflow.description}". The workflow has ${result.workflow.nodes.length} steps and should take approximately ${result.workflow.estimatedExecutionTime} seconds to execute.`,
          type: 'success',
          data: result.workflow
        });

        // Set workflow preview
        setWorkflowPreview(result.workflow);
        setShowPreview(true);

        // Handle any questions
        if (result.questions && result.questions.length > 0) {
          setPendingQuestions(result.questions);
          addMessage({
            role: 'assistant',
            content: `I need some additional information to complete the workflow setup. Please answer ${result.questions.length} question(s):`,
            type: 'question',
            data: result.questions
          });
        }

      } else if (result.questions && result.questions.length > 0) {
        // Handle case where we need questions first
        setPendingQuestions(result.questions);
        addMessage({
          role: 'assistant',
          content: 'I need some additional information to create your workflow. Please provide the following:',
          type: 'question',
          data: result.questions
        });

      } else {
        // Handle error
        addMessage({
          role: 'assistant',
          content: `I couldn't generate a workflow from that description. ${result.error || 'Please try rephrasing your request or be more specific about what you want to automate.'}`,
          type: 'error'
        });
      }

    } catch (error) {
      console.error('Workflow generation error:', error);
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error while generating your workflow. Please try again.',
        type: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [currentInput, isGenerating, addMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleAnswerQuestion = useCallback((questionId: string, answer: any) => {
    setQuestionAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  }, []);

  const handleExecuteWorkflow = useCallback(async () => {
    if (!workflowPreview) return;

    setIsExecuting(true);

    try {
      // Add nodes and edges to the workflow canvas
      addNodes(workflowPreview.nodes);
      addEdges(workflowPreview.edges);

      // Execute the workflow
      await executeWorkflow(workflowPreview.nodes, workflowPreview.edges);

      addMessage({
        role: 'assistant',
        content: 'Workflow executed successfully! You can see the results in the main workflow canvas.',
        type: 'success'
      });

      toast({
        title: "Workflow Executed",
        description: "Your workflow has been added to the canvas and executed.",
      });

      // Close preview
      setShowPreview(false);
      setWorkflowPreview(null);

    } catch (error) {
      console.error('Workflow execution error:', error);
      addMessage({
        role: 'assistant',
        content: 'Failed to execute the workflow. Please check the configuration and try again.',
        type: 'error'
      });

      toast({
        title: "Execution Failed",
        description: "There was an error executing your workflow.",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  }, [workflowPreview, addNodes, addEdges, executeWorkflow, addMessage, toast]);

  const QuestionCard = ({ question }: { question: UserQuestion }) => {
    const answer = questionAnswers[question.id];

    return (
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileQuestion className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  {question.question}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {question.context}
                </p>
              </div>

              {question.type === 'text' && (
                <Input
                  placeholder="Enter your answer..."
                  value={answer || ''}
                  onChange={(e) => handleAnswerQuestion(question.id, e.target.value)}
                  className="bg-white dark:bg-gray-800"
                />
              )}

              {question.type === 'choice' && question.options && (
                <Select
                  value={answer || ''}
                  onValueChange={(value) => handleAnswerQuestion(question.id, value)}
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800">
                    <SelectValue placeholder="Select an option..." />
                  </SelectTrigger>
                  <SelectContent>
                    {question.options.map((option, index) => (
                      <SelectItem key={index} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {question.type === 'api_key' && (
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Enter API key..."
                    value={answer || ''}
                    onChange={(e) => handleAnswerQuestion(question.id, e.target.value)}
                    className="bg-white dark:bg-gray-800"
                  />
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Your API key will be stored securely and only used for this workflow.
                  </p>
                </div>
              )}

              {question.type === 'file' && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      // File upload logic would go here
                      toast({
                        title: "File Upload",
                        description: "File upload functionality coming soon!",
                      });
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              )}

              {answer && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Answered</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const WorkflowPreviewDialog = () => (
    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Workflow Preview
          </DialogTitle>
          <DialogDescription>
            Review your generated workflow before execution
          </DialogDescription>
        </DialogHeader>

        {workflowPreview && (
          <div className="space-y-6">
            {/* Workflow Description */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Workflow Description
              </h3>
              <p className="text-blue-800 dark:text-blue-200">
                {workflowPreview.description}
              </p>
            </div>

            {/* Workflow Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {workflowPreview.nodes.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Steps</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {workflowPreview.estimatedExecutionTime}s
                  </div>
                  <div className="text-sm text-muted-foreground">Est. Time</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {workflowPreview.edges.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Connections</div>
                </CardContent>
              </Card>
            </div>

            {/* Workflow Steps */}
            <div>
              <h3 className="font-medium mb-3">Workflow Steps</h3>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {workflowPreview.nodes.map((node, index) => (
                    <div
                      key={node.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{node.data.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {node.data.description}
                        </div>
                      </div>
                      <Badge variant="outline">{node.type}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Required Permissions */}
            {workflowPreview.requiredPermissions.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Required Permissions</h3>
                <div className="flex flex-wrap gap-2">
                  {workflowPreview.requiredPermissions.map((permission, index) => (
                    <Badge key={index} variant="secondary">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Required API Keys */}
            {workflowPreview.requiredApiKeys.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Required API Keys</h3>
                <div className="flex flex-wrap gap-2">
                  {workflowPreview.requiredApiKeys.map((provider, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      <Key className="h-3 w-3" />
                      {provider}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleExecuteWorkflow}
                disabled={isExecuting}
                className="flex-1"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute Workflow
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
                disabled={isExecuting}
              >
                <Settings className="h-4 w-4 mr-2" />
                Customize
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">AI Workflow Creator</h2>
            <p className="text-sm text-muted-foreground">
              Describe your automation needs in plain English
            </p>
          </div>
        </div>

        {/* Example Prompts */}
        <div className="mt-4">
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Try these examples:
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.slice(0, 3).map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => setCurrentInput(prompt)}
              >
                {prompt.length > 50 ? `${prompt.slice(0, 50)}...` : prompt}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.type === 'error'
                      ? 'bg-destructive/10 text-destructive border border-destructive/20'
                      : message.type === 'success'
                      ? 'bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100 border border-green-200 dark:border-green-800'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 mt-0.5">
                        {message.type === 'error' ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : message.type === 'success' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : message.type === 'question' ? (
                          <FileQuestion className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <div className="text-xs opacity-60 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* Render questions if this is a question message */}
                  {message.type === 'question' && message.data && (
                    <div className="mt-4 space-y-3">
                      {message.data.map((question: UserQuestion) => (
                        <QuestionCard key={question.id} question={question} />
                      ))}
                    </div>
                  )}

                  {/* Render workflow preview button if this is a success message with workflow */}
                  {message.type === 'success' && message.data && (
                    <div className="mt-4">
                      <Button
                        onClick={() => setShowPreview(true)}
                        variant="outline"
                        size="sm"
                        className="bg-white dark:bg-gray-800"
                      >
                        <Workflow className="h-4 w-4 mr-2" />
                        View Workflow
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Pending questions */}
          {pendingQuestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <h3 className="font-medium">Additional Information Needed:</h3>
              {pendingQuestions.map((question) => (
                <QuestionCard key={question.id} question={question} />
              ))}
            </motion.div>
          )}

          {/* Loading indicator */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-muted rounded-lg px-4 py-3 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p>Generating your workflow...</p>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-6 border-t bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <Textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe the workflow you want to create... (e.g., 'Send me an email whenever someone creates a GitHub issue')"
              className="min-h-[80px] resize-none"
              disabled={isGenerating}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!currentInput.trim() || isGenerating}
              size="lg"
              className="px-6"
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Workflow Preview Dialog */}
      <WorkflowPreviewDialog />
    </div>
  );
}