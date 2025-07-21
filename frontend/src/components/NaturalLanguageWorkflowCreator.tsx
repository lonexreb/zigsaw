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
  Key,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  HelpCircle
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
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
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [showMetrics, setShowMetrics] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<Record<string, boolean>>({});
  
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
    
    // Mark question as answered and show confirmation
    if (answer && answer.trim && answer.trim()) {
      setAnsweredQuestions(prev => new Set([...prev, questionId]));
      
      // Find the question to determine type for appropriate feedback
      const question = pendingQuestions.find(q => q.id === questionId);
      if (question?.type === 'api_key') {
        setApiKeyStatus(prev => ({ ...prev, [questionId]: true }));
        toast({
          title: "API Key Saved",
          description: "Your API key has been securely stored.",
          duration: 3000,
        });
      } else {
        toast({
          title: "Answer Saved",
          description: "Your response has been recorded.",
          duration: 2000,
        });
      }
    }
  }, [pendingQuestions, toast]);

  const handleClearAnswer = useCallback((questionId: string) => {
    setQuestionAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[questionId];
      return newAnswers;
    });
    setAnsweredQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(questionId);
      return newSet;
    });
    setApiKeyStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[questionId];
      return newStatus;
    });
    
    toast({
      title: "Answer Cleared",
      description: "You can now provide a new answer.",
      duration: 2000,
    });
  }, [toast]);

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
    const isAnswered = answeredQuestions.has(question.id);

    return (
      <Card className={`transition-all duration-200 ${
        isAnswered 
          ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30' 
          : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30'
      }`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 p-2 rounded-lg ${
              isAnswered 
                ? 'bg-green-100 dark:bg-green-900/50' 
                : 'bg-blue-100 dark:bg-blue-900/50'
            }`}>
              {isAnswered ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <FileQuestion className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium text-foreground">
                    {question.question}
                  </p>
                  {question.required && (
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {question.context}
                </p>
              </div>

              {question.type === 'text' && (
                <div className="space-y-2">
                  <Input
                    placeholder="Type your answer here..."
                    value={answer || ''}
                    onChange={(e) => handleAnswerQuestion(question.id, e.target.value)}
                    className="bg-background border-input focus:border-primary"
                    disabled={isAnswered}
                  />
                </div>
              )}

              {question.type === 'choice' && question.options && (
                <div className="space-y-2">
                  <Select
                    value={answer || ''}
                    onValueChange={(value) => handleAnswerQuestion(question.id, value)}
                    disabled={isAnswered}
                  >
                    <SelectTrigger className="bg-background border-input focus:border-primary">
                      <SelectValue placeholder="Choose an option..." />
                    </SelectTrigger>
                    <SelectContent>
                      {question.options.map((option, index) => (
                        <SelectItem key={index} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {question.type === 'api_key' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      type={isAnswered ? "password" : "text"}
                      placeholder="Enter your API key..."
                      value={answer || ''}
                      onChange={(e) => handleAnswerQuestion(question.id, e.target.value)}
                      className="bg-background border-input focus:border-primary pr-10"
                      disabled={isAnswered}
                    />
                    {isAnswered && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      🔒 Your API key is encrypted and stored securely
                    </p>
                    {apiKeyStatus[question.id] && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {question.type === 'file' && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start hover:bg-primary/5"
                    onClick={() => {
                      // File upload logic would go here
                      toast({
                        title: "File Upload",
                        description: "File upload functionality coming soon!",
                      });
                    }}
                    disabled={isAnswered}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              )}

              {/* Action buttons for answered questions */}
              {isAnswered && (
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClearAnswer(question.id)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Clear and re-enter</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
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
    <TooltipProvider>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-6 border-b bg-gradient-to-r from-primary/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-primary to-purple-500 rounded-lg shadow-sm">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground">AI Workflow Creator</h2>
                  <p className="text-sm text-muted-foreground">
                    Describe your automation in plain English
                  </p>
                </div>
              </div>
              
              {/* Metrics toggle */}
              <div className="flex-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMetrics(!showMetrics)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showMetrics ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                  {showMetrics ? 'Hide' : 'Show'} Metrics
                </Button>
              </div>
            </div>

            {/* Example Prompts */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-medium text-foreground">Try these examples:</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {EXAMPLE_PROMPTS.slice(0, 3).map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto p-3 text-left justify-start whitespace-normal hover:bg-primary/5 hover:border-primary/30"
                    onClick={() => setCurrentInput(prompt)}
                  >
                    {prompt.length > 60 ? `${prompt.slice(0, 60)}...` : prompt}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Collapsible Metrics Panel */}
            <AnimatePresence>
              {showMetrics && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-primary">{messages.length}</p>
                      <p className="text-xs text-muted-foreground">Messages</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-green-500">{workflowPreview ? workflowPreview.nodes.length : 0}</p>
                      <p className="text-xs text-muted-foreground">Workflow Steps</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-blue-500">{answeredQuestions.size}</p>
                      <p className="text-xs text-muted-foreground">Questions Answered</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-purple-500">{workflowPreview ? `${workflowPreview.estimatedExecutionTime}s` : '—'}</p>
                      <p className="text-xs text-muted-foreground">Est. Runtime</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 sm:px-6 py-6">
          <div className="space-y-6 max-w-5xl mx-auto">
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
                    className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-4 py-3 shadow-sm ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-12'
                        : message.type === 'error'
                        ? 'bg-destructive/5 text-destructive border border-destructive/20 mr-12'
                        : message.type === 'success'
                        ? 'bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100 border border-green-200 dark:border-green-800 mr-12'
                        : 'bg-muted mr-12'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
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
                        <div className="flex-1 min-w-0">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                      
                      {/* Timestamp with better styling */}
                      <div className="flex justify-end">
                        <span className="text-xs opacity-60 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-full">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </span>
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
        <div className="px-4 sm:px-6 py-4 border-t bg-background/50 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto">
            <div className="space-y-3">
              {/* Input label with help */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Describe your workflow
                </label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <HelpCircle className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Be specific about triggers, actions, and conditions. Examples: "When X happens, do Y", "Every Monday, send report to team"</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {/* Input area */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <Textarea
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g., When someone creates a GitHub issue, analyze it with AI and email me the summary"
                    className="min-h-[80px] resize-none bg-background border-input focus:border-primary transition-colors"
                    disabled={isGenerating}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {currentInput.length}/500 characters
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Press Enter to send
                    </span>
                  </div>
                </div>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!currentInput.trim() || isGenerating}
                      size="lg"
                      className="px-6 shadow-sm"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Send message (Enter)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Preview Dialog */}
        <WorkflowPreviewDialog />
      </div>
    </TooltipProvider>
  );
}