import React, { memo, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  Bot, 
  Cpu, 
  Activity, 
  Settings, 
  RotateCcw, 
  Save, 
  FileText, 
  Zap, 
  Search, 
  Plus, 
  Brain,
  Wrench,
  Code,
  Database,
  MessageSquare,
  Globe,
  Calculator,
  Calendar,
  Mail,
  Image,
  Play,
  Pause,
  Check,
  Star,
  Layers,
  Trash2,
  Maximize2,
  Minimize2,
  Key,
  X,
  Send,
  TestTube
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { NodeDataOutputDialog } from '../ui/dialog';
import { useToast } from '../ui/use-toast';
import { cn } from '../../lib/utils';
import { Tool, ToolCategory } from '../../types/tools';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { workflowPersistenceService } from '../../services/workflowPersistenceService';
import { useAuth } from '../../contexts/AuthContext';

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

// AI Provider Configuration
interface AIProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  models: Model[];
  supportsTools: boolean;
  supportsVision: boolean;
  supportsFunction: boolean;
  maxTokens: number;
  costPerToken: number;
}

interface Model {
  id: string;
  name: string;
  contextLength: number;
  costMultiplier: number;
  capabilities: string[];
}

// Tool Configuration (using types from types/tools.ts)

interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  toolCalls?: any[];
}

interface UniversalAgentNodeProps {
  data: {
    label: string;
    description: string;
    status: 'idle' | 'active' | 'running' | 'completed' | 'error';
    config?: {
      provider?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      userPrompt?: string;
      messages?: AgentMessage[];
      tools?: ToolWithIcon[];
      toolPresets?: string[];
      streamResponse?: boolean;
      autoRetry?: boolean;
      retryCount?: number;
      timeout?: number;
    };
    onConfigChange?: (config: any) => void;
    outputData?: any;
    onShowOutputData?: () => void;
  };
  id?: string;
  selected: boolean;
}

// AI Providers Data
const aiProviders: AIProvider[] = [
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    icon: <Brain className="h-4 w-4" />,
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', contextLength: 200000, costMultiplier: 1.0, capabilities: ['text', 'vision', 'tools'] },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', contextLength: 200000, costMultiplier: 1.5, capabilities: ['text', 'vision', 'tools'] },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', contextLength: 200000, costMultiplier: 0.25, capabilities: ['text', 'vision', 'tools'] },
    ],
    supportsTools: true,
    supportsVision: true,
    supportsFunction: true,
    maxTokens: 4096,
    costPerToken: 0.00001,
  },
  {
    id: 'openai',
    name: 'OpenAI GPT',
    icon: <Zap className="h-4 w-4" />,
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', contextLength: 128000, costMultiplier: 1.0, capabilities: ['text', 'vision', 'tools'] },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextLength: 128000, costMultiplier: 0.15, capabilities: ['text', 'vision', 'tools'] },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextLength: 128000, costMultiplier: 1.2, capabilities: ['text', 'vision', 'tools'] },
    ],
    supportsTools: true,
    supportsVision: true,
    supportsFunction: true,
    maxTokens: 4096,
    costPerToken: 0.00001,
  },
  {
    id: 'groq',
    name: 'Groq',
    icon: <Cpu className="h-4 w-4" />,
    models: [
      { id: 'llama3-70b-8192', name: 'Llama 3 70B', contextLength: 8192, costMultiplier: 1.0, capabilities: ['text', 'tools'] },
      { id: 'llama3-8b-8192', name: 'Llama 3 8B', contextLength: 8192, costMultiplier: 0.1, capabilities: ['text', 'tools'] },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', contextLength: 32768, costMultiplier: 0.5, capabilities: ['text', 'tools'] },
    ],
    supportsTools: true,
    supportsVision: false,
    supportsFunction: true,
    maxTokens: 4096,
    costPerToken: 0.000001,
  },
];

// Available Tools with React Icons
interface ToolWithIcon extends Omit<Tool, 'icon'> {
  icon: React.ReactNode;
}

const availableTools: ToolWithIcon[] = [
  {
    id: 'firecrawl_scraper',
    name: 'Firecrawl Web Scraper',
    description: 'Scrape and extract content from web pages using Firecrawl',
    category: 'scraping',
    icon: <Globe className="h-4 w-4" />,
    version: '1.0.0',
    author: 'System',
    parameters: [
      { name: 'url', type: 'string', description: 'URL to scrape', required: true },
      { name: 'extract_text', type: 'boolean', description: 'Extract text content', required: false, default: true },
      { name: 'extract_links', type: 'boolean', description: 'Extract links', required: false, default: false },
      { name: 'extract_images', type: 'boolean', description: 'Extract image URLs', required: false, default: false },
    ],
    required: false,
    enabled: false,
    tags: ['web', 'scraping', 'content', 'firecrawl'],
    rating: 4.8,
    downloads: 500,
    cost: 0.02,
    provider: 'system',
    supportedModels: ['all'],
    documentation: 'https://docs.firecrawl.dev',
    examples: [
      {
        title: 'Basic Web Scraping',
        description: 'Extract text content from a webpage',
        parameters: { url: 'https://example.com', extract_text: true }
      }
    ]
  },
  {
    id: 'web_search',
    name: 'Web Search',
    description: 'Search the web for current information',
    category: 'search',
    icon: <Globe className="h-4 w-4" />,
    version: '1.0.0',
    author: 'System',
    parameters: [
      { name: 'query', type: 'string', description: 'What to search for', required: true },
      { name: 'num_results', type: 'number', description: 'How many results to show', required: false, default: 10 },
    ],
    required: false,
    enabled: false,
    tags: ['web', 'search', 'information'],
    rating: 4.5,
    downloads: 1000,
    cost: 0.01,
    provider: 'system',
    supportedModels: ['all'],
    documentation: 'https://docs.example.com/web-search',
    examples: [
      {
        title: 'Basic Search',
        description: 'Search for information about AI',
        parameters: { query: 'artificial intelligence news', num_results: 5 }
      }
    ]
  },
  {
    id: 'code_interpreter',
    name: 'Code Interpreter',
    description: 'Execute Python code safely',
    category: 'development',
    icon: <Code className="h-4 w-4" />,
    version: '1.0.0',
    author: 'System',
    parameters: [
      { name: 'code', type: 'string', description: 'Code to run', required: true },
      { name: 'timeout', type: 'number', description: 'Time limit (seconds)', required: false, default: 30 },
    ],
    required: false,
    enabled: false,
    tags: ['python', 'code', 'execution'],
    rating: 4.8,
    downloads: 2500,
    cost: 0.02,
    provider: 'system',
    supportedModels: ['all'],
    documentation: 'https://docs.example.com/code-interpreter',
    examples: [
      {
        title: 'Simple Calculation',
        description: 'Perform a mathematical calculation',
        parameters: { code: 'print(2 + 2)', timeout: 10 }
      }
    ]
  },
  {
    id: 'database_query',
    name: 'Database Query',
    description: 'Query database with SQL',
    category: 'data',
    icon: <Database className="h-4 w-4" />,
    version: '1.0.0',
    author: 'System',
    parameters: [
      { name: 'query', type: 'string', description: 'Database question', required: true },
      { name: 'connection_string', type: 'string', description: 'Database location', required: true },
    ],
    required: false,
    enabled: false,
    tags: ['sql', 'database', 'query'],
    rating: 4.2,
    downloads: 800,
    cost: 0.03,
    provider: 'system',
    supportedModels: ['all'],
    documentation: 'https://docs.example.com/database-query',
    examples: [
      {
        title: 'Select Query',
        description: 'Query user data',
        parameters: { 
          query: 'SELECT * FROM users LIMIT 10',
          connection_string: 'postgresql://user:pass@localhost:5432/db'
        }
      }
    ]
  },
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Perform mathematical calculations',
    category: 'utility',
    icon: <Calculator className="h-4 w-4" />,
    version: '1.0.0',
    author: 'System',
    parameters: [
      { name: 'expression', type: 'string', description: 'Math problem to solve', required: true },
    ],
    required: false,
    enabled: false,
    tags: ['math', 'calculation', 'arithmetic'],
    rating: 4.3,
    downloads: 1200,
    cost: 0.001,
    provider: 'system',
    supportedModels: ['all'],
    documentation: 'https://docs.example.com/calculator',
    examples: [
      {
        title: 'Basic Calculation',
        description: 'Perform arithmetic operations',
        parameters: { expression: '2 + 2 * 3' }
      }
    ]
  },
  {
    id: 'email_sender',
    name: 'Email Sender',
    description: 'Send emails via SMTP',
    category: 'communication',
    icon: <Mail className="h-4 w-4" />,
    version: '1.0.0',
    author: 'System',
    parameters: [
      { name: 'to', type: 'string', description: 'Who to send to', required: true },
      { name: 'subject', type: 'string', description: 'Email title', required: true },
      { name: 'body', type: 'string', description: 'Email message', required: true },
    ],
    required: false,
    enabled: false,
    tags: ['email', 'communication', 'smtp'],
    rating: 4.0,
    downloads: 600,
    cost: 0.005,
    provider: 'system',
    supportedModels: ['all'],
    documentation: 'https://docs.example.com/email-sender',
    examples: [
      {
        title: 'Send Email',
        description: 'Send a simple email',
        parameters: { 
          to: 'user@example.com',
          subject: 'Hello',
          body: 'Hello, this is a test email.'
        }
      }
    ]
  },
  {
    id: 'calendar_manager',
    name: 'Calendar Manager',
    description: 'Manage calendar events',
    category: 'productivity',
    icon: <Calendar className="h-4 w-4" />,
    version: '1.0.0',
    author: 'System',
    parameters: [
      { name: 'action', type: 'select', description: 'What to do', required: true, options: ['create', 'update', 'delete', 'list'] },
      { name: 'event_details', type: 'json', description: 'Event information', required: false },
    ],
    required: false,
    enabled: false,
    tags: ['calendar', 'events', 'scheduling'],
    rating: 4.4,
    downloads: 900,
    cost: 0.008,
    provider: 'system',
    supportedModels: ['all'],
    documentation: 'https://docs.example.com/calendar-manager',
    examples: [
      {
        title: 'Create Event',
        description: 'Create a new calendar event',
        parameters: { 
          action: 'create',
          event_details: {
            title: 'Meeting',
            start: '2024-01-01T10:00:00Z',
            end: '2024-01-01T11:00:00Z'
          }
        }
      }
    ]
  },
  {
    id: 'image_analyzer',
    name: 'Image Analyzer',
    description: 'Analyze and describe images',
    category: 'vision',
    icon: <Image className="h-4 w-4" />,
    version: '1.0.0',
    author: 'System',
    parameters: [
      { name: 'image_url', type: 'string', description: 'Picture location', required: true },
      { name: 'analysis_type', type: 'select', description: 'What to look for', required: false, options: ['description', 'objects', 'text', 'faces'] },
    ],
    required: false,
    enabled: false,
    tags: ['vision', 'image', 'analysis'],
    rating: 4.6,
    downloads: 1500,
    cost: 0.02,
    provider: 'system',
    supportedModels: ['all'],
    documentation: 'https://docs.example.com/image-analyzer',
    examples: [
      {
        title: 'Analyze Image',
        description: 'Analyze an image and describe its contents',
        parameters: { 
          image_url: 'https://example.com/image.jpg',
          analysis_type: 'description'
        }
      }
    ]
  },
];

// Tool Categories with React Icons
interface ToolCategoryWithIcon extends Omit<ToolCategory, 'icon'> {
  icon: React.ReactNode;
}

const toolCategories: ToolCategoryWithIcon[] = [
  { id: 'all', name: 'All Tools', icon: <Layers className="h-4 w-4" />, count: 0 },
  { id: 'scraping', name: 'Web Scraping', icon: <Globe className="h-4 w-4" />, count: 0 },
  { id: 'search', name: 'Search', icon: <Search className="h-4 w-4" />, count: 0 },
  { id: 'development', name: 'Development', icon: <Code className="h-4 w-4" />, count: 0 },
  { id: 'data', name: 'Data', icon: <Database className="h-4 w-4" />, count: 0 },
  { id: 'communication', name: 'Communication', icon: <MessageSquare className="h-4 w-4" />, count: 0 },
  { id: 'utility', name: 'Utility', icon: <Calculator className="h-4 w-4" />, count: 0 },
  { id: 'productivity', name: 'Productivity', icon: <Calendar className="h-4 w-4" />, count: 0 },
  { id: 'vision', name: 'Vision', icon: <Image className="h-4 w-4" />, count: 0 },
];

// Tool Presets
const toolPresets = [
  { id: 'data_analyst', name: 'Data Analyst', tools: ['database_query', 'code_interpreter', 'calculator', 'web_search'] },
  { id: 'customer_support', name: 'Customer Support', tools: ['email_sender', 'calendar_manager', 'web_search'] },
  { id: 'content_creator', name: 'Content Creator', tools: ['web_search', 'image_analyzer', 'code_interpreter'] },
  { id: 'developer', name: 'Developer', tools: ['code_interpreter', 'web_search', 'database_query'] },
  { id: 'research_assistant', name: 'Research Assistant', tools: ['web_search', 'database_query', 'calculator'] },
];

// System Prompt Presets
const systemPromptPresets = [
  {
    id: 'general_assistant',
    name: 'General Assistant',
    prompt: 'You are a helpful AI assistant with access to various tools. When you have access to tools like web scraping, use them to gather information and provide more accurate, up-to-date responses. Always explain what you\'re doing and use tools when they would be helpful to answer the user\'s question. Be friendly, professional, and thorough in your responses.'
  },
  {
    id: 'data_analyst',
    name: 'Data Analyst',
    prompt: 'You are an expert data analyst with access to powerful tools for data processing, analysis, and visualization. Help users understand their data, identify patterns, and make data-driven decisions. Always explain your reasoning and provide clear insights.'
  },
  {
    id: 'customer_support',
    name: 'Customer Support',
    prompt: 'You are a professional customer support agent. Help users with their inquiries, troubleshoot issues, and provide excellent service. Be empathetic, patient, and solution-oriented. Always aim to resolve issues efficiently while maintaining a positive tone.'
  },
  {
    id: 'content_creator',
    name: 'Content Creator',
    prompt: 'You are a creative content creator with expertise in writing, research, and multimedia content. Help users create engaging, high-quality content for various platforms. Be creative, original, and adapt your style to different audiences and formats.'
  },
  {
    id: 'developer_assistant',
    name: 'Developer Assistant',
    prompt: 'You are a skilled developer assistant with expertise in programming, debugging, and software development. Help users with code reviews, debugging, architecture decisions, and technical implementation. Provide clear, well-documented solutions and best practices.'
  },
  {
    id: 'research_assistant',
    name: 'Research Assistant',
    prompt: 'You are a research assistant with access to comprehensive tools for gathering and analyzing information. Help users conduct thorough research, synthesize findings, and present well-structured conclusions. Always cite sources and maintain academic rigor.'
  },
  {
    id: 'creative_writer',
    name: 'Creative Writer',
    prompt: 'You are a creative writer with a vivid imagination and strong storytelling abilities. Help users develop characters, plots, dialogue, and creative content. Be imaginative, engaging, and adapt your style to different genres and audiences.'
  },
  {
    id: 'business_consultant',
    name: 'Business Consultant',
    prompt: 'You are a business consultant with expertise in strategy, operations, and market analysis. Help users with business planning, market research, competitive analysis, and strategic decision-making. Provide actionable insights and practical recommendations.'
  }
];

// User Prompt Presets
const userPromptPresets = [
  {
    id: 'general_help',
    name: 'General Help',
    prompt: 'Hello! How can I help you today?'
  },
  {
    id: 'data_analysis',
    name: 'Data Analysis',
    prompt: 'I need help analyzing some data. Can you help me understand the patterns and insights?'
  },
  {
    id: 'content_creation',
    name: 'Content Creation',
    prompt: 'I need help creating engaging content. Can you assist me with research and writing?'
  },
  {
    id: 'technical_support',
    name: 'Technical Support',
    prompt: 'I have a technical issue that needs solving. Can you help me troubleshoot this?'
  },
  {
    id: 'research_project',
    name: 'Research Project',
    prompt: 'I\'m working on a research project and need comprehensive information on this topic.'
  },
  {
    id: 'creative_writing',
    name: 'Creative Writing',
    prompt: 'I want to work on a creative writing project. Can you help me develop ideas and content?'
  },
  {
    id: 'business_planning',
    name: 'Business Planning',
    prompt: 'I need help with business strategy and planning. Can you provide insights and recommendations?'
  },
  {
    id: 'custom',
    name: 'Custom',
    prompt: ''
  }
];

// Default Configuration
const defaultConfig = {
  provider: 'groq',
  model: 'llama3-70b-8192',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: 'You are a helpful AI assistant with access to various tools. Use them appropriately to help the user.',
  userPrompt: 'Hello! How can I help you today?',
  messages: [
    { role: 'user' as const, content: 'Hello! How can I help you today?', timestamp: new Date() }
  ],
  tools: [],
  toolPresets: [],
  streamResponse: true,
  autoRetry: true,
  retryCount: 3,
  timeout: 30000,
};

// Component
const UniversalAgentNode: React.FC<UniversalAgentNodeProps> = ({ data, id, selected }) => {
  const { updateNodeConfig, getSelectedNode } = useWorkflow();
  const { currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('config');
  const [showToolMarketplace, setShowToolMarketplace] = useState(false);
  const [toolSearchQuery, setToolSearchQuery] = useState('');
  const [selectedToolCategory, setSelectedToolCategory] = useState('all');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [showDataOutput, setShowDataOutput] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [selectedSystemPromptPreset, setSelectedSystemPromptPreset] = useState<string | null>(null);
  const [selectedUserPromptPreset, setSelectedUserPromptPreset] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<{[key: string]: string}>({});
  const [isValidatingApiKey, setIsValidatingApiKey] = useState<{[key: string]: boolean}>({});
  const [apiKeyValidation, setApiKeyValidation] = useState<{[key: string]: {valid: boolean, message: string}}>({});
  const [firecrawlApiKey, setFirecrawlApiKey] = useState('');
  const [isValidatingFirecrawl, setIsValidatingFirecrawl] = useState(false);
  const [firecrawlValidation, setFirecrawlValidation] = useState<{valid: boolean, message: string} | null>(null);
  const [chatMessages, setChatMessages] = useState<AgentMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Debounced save function to prevent excessive API calls
  const debouncedSave = useMemo(
    () => debounce(async (nodeId: string, config: any) => {
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          const selectedNode = getSelectedNode();
          const position = selectedNode?.position || { x: 100, y: 100 };
          
          await workflowPersistenceService.saveNodeConfig(nodeId, config, 'UNIVERSAL_AGENT', idToken, position);
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error('Auto-save failed:', error);
          setHasUnsavedChanges(true);
          
          // Show user-friendly error for model validation issues
          if (error instanceof Error && error.message.includes('Model') && error.message.includes('not available')) {
            toast({
              title: "Model Validation Error",
              description: `The selected model "${config.model}" is not available on the backend. Please check your backend configuration.`,
              variant: "destructive",
            });
          } else if (error instanceof Error && error.message.includes('workflow')) {
            toast({
              title: "Workflow Save Error", 
              description: "Failed to save to workflow. Changes are preserved locally.",
              variant: "destructive",
            });
          }
        }
      }
    }, 500), // 500ms debounce
    [currentUser, getSelectedNode, toast]
  );
  
  // Local configuration state
  const [config, setConfig] = useState(() => {
    const selectedNode = getSelectedNode();
    const nodeConfig = selectedNode?.id === id ? selectedNode?.data?.config : data.config;
    
    return {
      provider: (nodeConfig as any)?.provider || defaultConfig.provider,
      model: (nodeConfig as any)?.model || defaultConfig.model,
      temperature: (nodeConfig as any)?.temperature || defaultConfig.temperature,
      maxTokens: (nodeConfig as any)?.maxTokens || defaultConfig.maxTokens,
      systemPrompt: (nodeConfig as any)?.systemPrompt || defaultConfig.systemPrompt,
      userPrompt: (nodeConfig as any)?.userPrompt || defaultConfig.userPrompt,
      messages: (nodeConfig as any)?.messages || defaultConfig.messages,
      tools: (nodeConfig as any)?.tools || defaultConfig.tools,
      toolPresets: (nodeConfig as any)?.toolPresets || defaultConfig.toolPresets,
      streamResponse: (nodeConfig as any)?.streamResponse || defaultConfig.streamResponse,
      autoRetry: (nodeConfig as any)?.autoRetry || defaultConfig.autoRetry,
      retryCount: (nodeConfig as any)?.retryCount || defaultConfig.retryCount,
      timeout: (nodeConfig as any)?.timeout || defaultConfig.timeout,
    };
  });

  // Initialize as having unsaved changes if this is a new node (no saved config)
  useEffect(() => {
    const selectedNode = getSelectedNode();
    const nodeConfig = selectedNode?.id === id ? selectedNode?.data?.config : data.config;
    
    // If the node has no config or very minimal config, consider it as needing to be saved
    if (!nodeConfig || Object.keys(nodeConfig).length === 0) {
      setHasUnsavedChanges(true);
    }
  }, [id, getSelectedNode, data.config]);

  // Sync config when node data changes
  useEffect(() => {
    const selectedNode = getSelectedNode();
    const nodeConfig = selectedNode?.id === id ? selectedNode?.data?.config : data.config;
    
    if (nodeConfig) {
      setConfig(prev => ({
        provider: (nodeConfig as any)?.provider || prev.provider,
        model: (nodeConfig as any)?.model || prev.model,
        temperature: (nodeConfig as any)?.temperature || prev.temperature,
        maxTokens: (nodeConfig as any)?.maxTokens || prev.maxTokens,
        systemPrompt: (nodeConfig as any)?.systemPrompt || prev.systemPrompt,
        userPrompt: (nodeConfig as any)?.userPrompt || prev.userPrompt,
        messages: (nodeConfig as any)?.messages || prev.messages,
        tools: (nodeConfig as any)?.tools || prev.tools,
        toolPresets: (nodeConfig as any)?.toolPresets || prev.toolPresets,
        streamResponse: (nodeConfig as any)?.streamResponse !== undefined ? (nodeConfig as any).streamResponse : prev.streamResponse,
        autoRetry: (nodeConfig as any)?.autoRetry !== undefined ? (nodeConfig as any).autoRetry : prev.autoRetry,
        retryCount: (nodeConfig as any)?.retryCount || prev.retryCount,
        timeout: (nodeConfig as any)?.timeout || prev.timeout,
      }));
    }
  }, [id, getSelectedNode, data.config]);

  // Load saved API keys from localStorage
  useEffect(() => {
    const savedApiKeys = localStorage.getItem('universal-agent-api-keys');
    if (savedApiKeys) {
      try {
        const parsedKeys = JSON.parse(savedApiKeys);
        setApiKeys(parsedKeys);
      } catch (error) {
        console.error('Failed to parse saved API keys:', error);
      }
    }

    // Load Firecrawl API key
    const savedFirecrawlKey = localStorage.getItem('universal-agent-firecrawl-key');
    if (savedFirecrawlKey) {
      setFirecrawlApiKey(savedFirecrawlKey);
    }
  }, []);

  // Load chat messages from config
  useEffect(() => {
    if (config.messages && config.messages.length > 0) {
      setChatMessages(config.messages);
    }
  }, [config.messages]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Get current provider and model
  const currentProvider = useMemo(() => 
    aiProviders.find(p => p.id === config.provider) || aiProviders[0], 
    [config.provider]
  );
  
  const currentModel = useMemo(() => 
    currentProvider.models.find(m => m.id === config.model) || currentProvider.models[0], 
    [currentProvider, config.model]
  );

  // Filter tools based on search and category
  const filteredTools = useMemo(() => {
    return availableTools.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(toolSearchQuery.toLowerCase()) ||
                           tool.description.toLowerCase().includes(toolSearchQuery.toLowerCase());
      const matchesCategory = selectedToolCategory === 'all' || tool.category === selectedToolCategory;
      return matchesSearch && matchesCategory;
    });
  }, [toolSearchQuery, selectedToolCategory]);

  // Handle configuration changes with auto-save
  const handleConfigChange = useCallback((key: string, value: any) => {
    // Update local state immediately for reactive UI
    setConfig(prev => {
      const newConfig = { ...prev, [key]: value };
      
      // If provider is changing, clear API key validation for the old provider
      if (key === 'provider') {
        setApiKeyValidation(prev => {
          const newState = { ...prev };
          // Clear validation for the current provider before it changes
          delete newState[config.provider];
          return newState;
        });
      }
      
      // Update the workflow context with the complete config
      if (id) {
        updateNodeConfig(id, newConfig);
      }
      
      // Trigger debounced auto-save
      if (id) {
        setHasUnsavedChanges(true); // Show unsaved state immediately
        debouncedSave(id, newConfig);
      }
      
      return newConfig;
    });
  }, [id, updateNodeConfig, debouncedSave]);

  // Handle tool toggle
  const handleToolToggle = useCallback((toolId: string) => {
    const toolIndex = config.tools.findIndex((t: ToolWithIcon) => t.id === toolId);
    const tool = availableTools.find(t => t.id === toolId);
    
    if (!tool) return;
    
    let newTools: ToolWithIcon[];
    if (toolIndex >= 0) {
      // Remove tool
      newTools = config.tools.filter((_: ToolWithIcon, index: number) => index !== toolIndex);
    } else {
      // Add tool
      newTools = [...config.tools, { ...tool, enabled: true }];
    }
    
    handleConfigChange('tools', newTools);
    setActivePreset(null); // Clear active preset when manually removing/adding tools
  }, [config.tools, handleConfigChange]);

  // Handle tool preset selection
  const handleToolPresetSelection = useCallback((presetId: string) => {
    const preset = toolPresets.find(p => p.id === presetId);
    if (!preset) return;
    
    const presetTools = preset.tools.map(toolId => {
      const tool = availableTools.find(t => t.id === toolId);
      return tool ? { ...tool, enabled: true } : null;
    }).filter(Boolean) as ToolWithIcon[];
    
    handleConfigChange('tools', presetTools);
    setActivePreset(presetId);
    setShowToolMarketplace(false);
    
    toast({
      title: "Tool Preset Applied",
      description: `${preset.name} tools have been configured.`,
    });
  }, [handleConfigChange, toast]);

  // Handle system prompt preset selection
  const handleSystemPromptPresetSelection = useCallback((presetId: string) => {
    const preset = systemPromptPresets.find(p => p.id === presetId);
    if (!preset) return;
    
    if (presetId === 'custom') {
      // For custom preset, just clear the selection to allow manual editing
      setSelectedSystemPromptPreset(null);
      return;
    }
    
    handleConfigChange('systemPrompt', preset.prompt);
    setSelectedSystemPromptPreset(presetId);
    
    toast({
      title: "System Prompt Applied",
      description: `${preset.name} system prompt has been applied.`,
    });
  }, [handleConfigChange, toast]);

  // Handle user prompt preset selection
  const handleUserPromptPresetSelection = useCallback((presetId: string) => {
    const preset = userPromptPresets.find(p => p.id === presetId);
    if (!preset) return;
    
    if (presetId === 'custom') {
      // For custom preset, just clear the selection to allow manual editing
      setSelectedUserPromptPreset(null);
      return;
    }
    
    handleConfigChange('userPrompt', preset.prompt);
    setSelectedUserPromptPreset(presetId);
    
    toast({
      title: "User Prompt Applied",
      description: `${preset.name} user prompt has been applied.`,
    });
  }, [handleConfigChange, toast]);

  // Validate API key for selected provider
  const validateApiKey = useCallback(async (provider: string, apiKey: string) => {
    if (!apiKey.trim()) {
      setApiKeyValidation(prev => ({
        ...prev,
        [provider]: { valid: false, message: 'API key is required' }
      }));
      return false;
    }

    setIsValidatingApiKey(prev => ({ ...prev, [provider]: true }));

    try {
      // Simple validation - check if key has correct format
      let isValid = false;
      let message = '';

      switch (provider) {
        case 'anthropic':
          // Claude API keys start with 'sk-ant-'
          isValid = apiKey.startsWith('sk-ant-') && apiKey.length > 20;
          message = isValid ? 'Valid Claude API key' : 'Invalid Claude API key format';
          break;
        case 'openai':
          // OpenAI API keys start with 'sk-'
          isValid = apiKey.startsWith('sk-') && apiKey.length > 20;
          message = isValid ? 'Valid OpenAI API key' : 'Invalid OpenAI API key format';
          break;
        case 'groq':
          // Groq API keys start with 'gsk_'
          isValid = apiKey.startsWith('gsk_') && apiKey.length > 20;
          message = isValid ? 'Valid Groq API key' : 'Invalid Groq API key format';
          break;
        default:
          isValid = false;
          message = 'Unknown provider';
      }

      setApiKeyValidation(prev => ({
        ...prev,
        [provider]: { valid: isValid, message }
      }));

      if (isValid) {
        toast({
          title: "API Key Valid",
          description: message,
        });
      } else {
        toast({
          title: "API Key Invalid",
          description: message,
          variant: "destructive",
        });
      }

      return isValid;
    } catch (error) {
      setApiKeyValidation(prev => ({
        ...prev,
        [provider]: { valid: false, message: 'Validation failed' }
      }));
      toast({
        title: "Validation Error",
        description: "Failed to validate API key",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsValidatingApiKey(prev => ({ ...prev, [provider]: false }));
    }
  }, [toast]);

  // Handle API key change
  const handleApiKeyChange = useCallback((provider: string, apiKey: string) => {
    const newApiKeys = { ...apiKeys, [provider]: apiKey };
    setApiKeys(newApiKeys);
    
    // Save to localStorage
    localStorage.setItem('universal-agent-api-keys', JSON.stringify(newApiKeys));
    
    // Clear validation when user starts typing
    if (apiKeyValidation[provider]) {
      setApiKeyValidation(prev => {
        const newState = { ...prev };
        delete newState[provider];
        return newState;
      });
    }
  }, [apiKeys, apiKeyValidation]);

  // Handle API key validation
  const handleValidateApiKey = useCallback((provider: string) => {
    const apiKey = apiKeys[provider] || '';
    validateApiKey(provider, apiKey);
  }, [apiKeys, validateApiKey]);

  // Validate Firecrawl API key
  const validateFirecrawlApiKey = useCallback(async () => {
    if (!firecrawlApiKey.trim()) {
      setFirecrawlValidation({ valid: false, message: 'Firecrawl API key is required' });
      return false;
    }

    setIsValidatingFirecrawl(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : 'https://zigsaw-backend.vercel.app');
      const response = await fetch(`${backendUrl}/api/v1/validate-firecrawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: firecrawlApiKey
        })
      });

      const data = await response.json();

      if (data.valid) {
        setFirecrawlValidation({ valid: true, message: data.message || 'Valid Firecrawl API key' });
        toast({
          title: "Firecrawl API Key Valid",
          description: "Your Firecrawl API key is working correctly.",
        });
        return true;
      } else {
        setFirecrawlValidation({ valid: false, message: data.error || 'Invalid API key' });
        toast({
          title: "Firecrawl API Key Invalid",
          description: data.error || "Please check your Firecrawl API key.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      setFirecrawlValidation({ valid: false, message: 'Validation failed' });
      toast({
        title: "Validation Error",
        description: "Failed to validate Firecrawl API key",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsValidatingFirecrawl(false);
    }
  }, [firecrawlApiKey, toast]);

  // Handle web scraping with Firecrawl
  const handleWebScraping = useCallback(async (url: string, options: {
    extract_text?: boolean;
    extract_links?: boolean;
    extract_images?: boolean;
  } = {}) => {
    if (!firecrawlApiKey) {
      toast({
        title: "Firecrawl API Key Required",
        description: "Please enter your Firecrawl API key to use web scraping.",
        variant: "destructive",
      });
      return null;
    }

    if (!firecrawlValidation?.valid) {
      toast({
        title: "Invalid Firecrawl API Key",
        description: "Please validate your Firecrawl API key first.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : 'https://zigsaw-backend.vercel.app');
      const response = await fetch(`${backendUrl}/api/v1/firecrawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          extract_text: options.extract_text ?? true,
          extract_links: options.extract_links ?? false,
          extract_images: options.extract_images ?? false,
          apiKey: firecrawlApiKey
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Scraping failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Add scraping result to chat
      const scrapingMessage: AgentMessage = {
        role: 'assistant',
        content: `I've scraped the webpage at ${url}. Here's what I found:\n\n**Title:** ${data.title}\n**Description:** ${data.description}\n\n**Content:**\n${data.content.substring(0, 1000)}${data.content.length > 1000 ? '...' : ''}`,
        timestamp: new Date(),
      };

      const newMessages = [...chatMessages, scrapingMessage];
      setChatMessages(newMessages);
      handleConfigChange('messages', newMessages);

      toast({
        title: "Web Scraping Complete",
        description: `Successfully scraped content from ${url}`,
      });

      return data;
    } catch (error) {
      console.error('Web scraping error:', error);
      toast({
        title: "Web Scraping Failed",
        description: error instanceof Error ? error.message : "Failed to scrape the webpage",
        variant: "destructive",
      });
      return null;
    }
  }, [firecrawlApiKey, firecrawlValidation, chatMessages, handleConfigChange, toast]);

  // Send message to AI service with tool support
  const sendMessage = useCallback(async (message: string) => {
    console.log('Environment variables:', {
      VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
      fallback: 'https://zigsaw-backend.vercel.app'
    });

    if (!currentProvider || !currentModel) {
      toast({
        title: "Configuration Error",
        description: "Please select an AI service and model first.",
        variant: "destructive",
      });
      return;
    }

    const apiKey = apiKeys[config.provider];
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: `Please enter your ${currentProvider.name} API key.`,
        variant: "destructive",
      });
      return;
    }

    const validation = apiKeyValidation[config.provider];
    if (!validation?.valid) {
      toast({
        title: "Invalid API Key",
        description: `Please validate your ${currentProvider.name} API key first.`,
        variant: "destructive",
      });
      return;
    }

    // Check if tools are enabled and Firecrawl API key is required
    const enabledTools = config.tools.map((tool: ToolWithIcon) => tool.id);
    const needsFirecrawlKey = enabledTools.includes('firecrawl_scraper');
    
    if (needsFirecrawlKey && (!firecrawlApiKey || !firecrawlValidation?.valid)) {
      toast({
        title: "Firecrawl API Key Required",
        description: "Please enter and validate your Firecrawl API key to use web scraping tools.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingMessage(true);

    // Add user message to chat
    const userMessage: AgentMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    const messagesWithUser = [...chatMessages, userMessage];
    setChatMessages(messagesWithUser);

    try {
      // Prepare messages for the API
      const messages = [
        { role: 'system', content: config.systemPrompt },
        ...messagesWithUser.map(msg => ({ role: msg.role, content: msg.content }))
      ];

      const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : 'https://zigsaw-backend.vercel.app');
      const endpoint = enabledTools.length > 0 ? '/api/v1/chat-with-tools' : '/api/v1/chat';
      
      console.log('Sending chat request to:', `${backendUrl}${endpoint}`);
      console.log('Request payload:', {
        provider: config.provider,
        model: config.model,
        messages: messages,
        systemPrompt: config.systemPrompt,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        tools: enabledTools,
        firecrawlApiKey: needsFirecrawlKey ? '***' : undefined,
        apiKey: apiKey ? '***' : 'missing'
      });

      // Call our backend API which will proxy to the AI service
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: config.provider,
          model: config.model,
          messages: messages,
          systemPrompt: config.systemPrompt,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          tools: enabledTools,
          firecrawlApiKey: needsFirecrawlKey ? firecrawlApiKey : undefined,
          apiKey: apiKey
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Chat API error response:', errorData);
        throw new Error(errorData.error || `API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Chat API response:', data);
      const assistantContent = data.content || 'No response received';

      // Add assistant message to chat
      const assistantMessage: AgentMessage = {
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
        toolCalls: data.toolCalls || []
      };
      const newMessages = [...chatMessages, userMessage, assistantMessage];
      setChatMessages(newMessages);
      
      // Update config with new messages
      handleConfigChange('messages', newMessages);

      toast({
        title: "Message Sent",
        description: "Response received successfully.",
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSendingMessage(false);
    }
  }, [currentProvider, currentModel, apiKeys, apiKeyValidation, config, chatMessages, toast]);

  // Handle send message
  const handleSendMessage = useCallback(() => {
    if (!currentMessage.trim() || isSendingMessage) return;
    sendMessage(currentMessage.trim());
    setCurrentMessage('');
  }, [currentMessage, isSendingMessage, sendMessage]);

  // Handle enter key in message input
  const handleMessageKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Check if current tools match a preset
  const getCurrentActivePreset = useCallback(() => {
    if (config.tools.length === 0) return null;
    
    const currentToolIds = config.tools.map((t: ToolWithIcon) => t.id).sort();
    
    for (const preset of toolPresets) {
      const presetToolIds = preset.tools.sort();
      if (currentToolIds.length === presetToolIds.length && 
          currentToolIds.every((id: string, index: number) => id === presetToolIds[index])) {
        return preset.id;
      }
    }
    return null;
  }, [config.tools]);

  // Update active preset when tools change
  useEffect(() => {
    const currentPreset = getCurrentActivePreset();
    setActivePreset(currentPreset);
  }, [config.tools, getCurrentActivePreset]);

  // Update active presets when prompts change
  useEffect(() => {
    // Check if current system prompt matches any preset
    const currentSystemPreset = systemPromptPresets.find(p => p.prompt === config.systemPrompt);
    setSelectedSystemPromptPreset(currentSystemPreset?.id || null);
  }, [config.systemPrompt]);

  useEffect(() => {
    // Check if current user prompt matches any preset
    const currentUserPreset = userPromptPresets.find(p => p.prompt === config.userPrompt);
    setSelectedUserPromptPreset(currentUserPreset?.id || null);
  }, [config.userPrompt]);

  // Handle agent start
  const handleExecute = useCallback(async () => {
    if (!currentProvider || !currentModel) return;
    
    // Check if API key is provided and valid
    const currentApiKey = apiKeys[config.provider];
    const currentValidation = apiKeyValidation[config.provider];
    
    if (!currentApiKey) {
      toast({ 
        variant: "destructive", 
        title: "API Key Required", 
        description: `Please enter your ${currentProvider.name} API key before starting the agent.` 
      });
      return;
    }

    if (!currentValidation?.valid) {
      toast({ 
        variant: "destructive", 
        title: "Invalid API Key", 
        description: `Please validate your ${currentProvider.name} API key before starting the agent.` 
      });
      return;
    }
    
    setIsRunning(true);
    
    try {
      // TODO: Implement actual execution logic with API key
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate execution
      
      toast({
        title: "Agent Finished",
        description: "The agent has completed your request.",
      });
    } catch (error) {
      toast({
        title: "Agent Error",
        description: "Something went wrong while running the agent.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  }, [currentProvider, currentModel, toast, apiKeys, apiKeyValidation, config.provider]);

  // Save settings
  const handleSaveConfig = useCallback(async () => {
    if (!currentUser || !id) {
      toast({ variant: "destructive", title: "Error", description: "User must be logged in to save configurations." });
      return;
    }

    // Check if API key is provided and valid
    const currentApiKey = apiKeys[config.provider];
    const currentValidation = apiKeyValidation[config.provider];
    
    if (!currentApiKey) {
      toast({ 
        variant: "destructive", 
        title: "API Key Required", 
        description: `Please enter your ${currentProvider.name} API key.` 
      });
      return;
    }

    if (!currentValidation?.valid) {
      toast({ 
        variant: "destructive", 
        title: "Invalid API Key", 
        description: `Please validate your ${currentProvider.name} API key before saving.` 
      });
      return;
    }

    setIsSaving(true);
    try {
      const idToken = await currentUser.getIdToken();
      
      // Get position from the selected node
      const selectedNode = getSelectedNode();
      const position = selectedNode?.position || { x: 100, y: 100 };
      
      // Update the workflow context with the complete config before saving
      updateNodeConfig(id, config);
      
      // Use the current config state that includes all user changes
      await workflowPersistenceService.saveNodeConfig(id, config, 'UNIVERSAL_AGENT', idToken, position);
      setHasUnsavedChanges(false);
      toast({
        title: "Settings Saved",
        description: "Agent settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Failed to save node:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to save agent settings." });
    } finally {
      setIsSaving(false);
    }
  }, [id, currentUser, config, getSelectedNode, updateNodeConfig, toast, apiKeys, apiKeyValidation, currentProvider]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-gray-500';
      case 'active': return 'bg-blue-500';
      case 'running': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <TooltipProvider>
      <motion.div 
        className={cn(
          "relative bg-gradient-to-br from-slate-900/90 via-purple-900/40 to-blue-900/60 backdrop-blur-xl border border-purple-400/20 rounded-2xl shadow-2xl transition-all duration-500 hover:shadow-purple-500/20 hover:border-purple-400/40 hover:scale-[1.02]",
          selected && "ring-2 ring-purple-400/60 shadow-purple-500/30",
          isExpanded ? "min-w-[300px] max-w-[400px]" : "min-w-[290px] max-w-[220px]"
        )}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-indigo-600/10 rounded-2xl animate-pulse" />
        
        {/* Animated Light Streaks */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 rounded-2xl">
            {/* Top streak */}
            <motion.div 
              className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400/60 to-transparent"
              animate={{
                x: ['-100%', '100%'],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Right streak */}
            <motion.div 
              className="absolute top-0 right-0 w-0.5 h-full bg-gradient-to-b from-transparent via-blue-400/60 to-transparent"
              animate={{
                y: ['-100%', '100%'],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.75
              }}
            />
            
            {/* Bottom streak */}
            <motion.div 
              className="absolute bottom-0 right-0 w-full h-0.5 bg-gradient-to-l from-transparent via-purple-400/60 to-transparent"
              animate={{
                x: ['100%', '-100%'],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5
              }}
            />
            
            {/* Left streak */}
            <motion.div 
              className="absolute bottom-0 left-0 w-0.5 h-full bg-gradient-to-t from-transparent via-blue-400/60 to-transparent"
              animate={{
                y: ['100%', '-100%'],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2.25
              }}
            />
          </div>
        </div>
        


        {/* Header */}
        <div className="relative flex items-center justify-between p-4 border-b border-purple-400/20 select-none">
          <div className="flex items-center gap-3">
            <div className="relative">
              <motion.div 
                className="bg-gradient-to-br from-purple-500/30 to-blue-500/30 p-3 rounded-xl border border-purple-400/30"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Bot className="h-6 w-6 text-purple-200" />
              </motion.div>
              <motion.div 
                className={cn(
                  "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900",
                  getStatusColor(data.status)
                )} 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">{data.label}</h3>
              <p className="text-sm text-purple-200/70 font-medium line-clamp-2">{data.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: isSaving ? 1 : 1.1 }} whileTap={{ scale: isSaving ? 1 : 0.95 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    className={`rounded-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                      hasUnsavedChanges 
                        ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10' 
                        : 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
                    }`}
                  >
                    {isSaving ? (
                      <Activity className="h-4 w-4 animate-spin" />
                    ) : hasUnsavedChanges ? (
                      <Save className="h-4 w-4" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Changes pending...' : 'All changes saved'}
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExecute}
                    disabled={isRunning}
                    className="text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-xl"
                  >
                    {isRunning ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <Pause className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                {isRunning ? 'Running...' : 'Start Agent'}
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-xl"
                  >
                    {isExpanded ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                {isExpanded ? 'Collapse' : 'Expand'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              className="relative p-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-purple-400/20 rounded-xl p-1">
                  <TabsTrigger value="config" className="data-[state=active]:bg-purple-600/30 data-[state=active]:text-purple-200 rounded-lg transition-all">
                      Settings
                  </TabsTrigger>
                  <TabsTrigger value="tools" className="data-[state=active]:bg-purple-600/30 data-[state=active]:text-purple-200 rounded-lg transition-all">
                    Tools ({config.tools.length})
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="data-[state=active]:bg-purple-600/30 data-[state=active]:text-purple-200 rounded-lg transition-all">
                      Chat History
                  </TabsTrigger>
                </TabsList>
                
                {/* Configuration Tab */}
                <TabsContent value="config" className="space-y-6 mt-6">
                  {/* AI Service and Model Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-purple-200 flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        AI Service
                      </label>
                      <Select value={config.provider} onValueChange={(value) => handleConfigChange('provider', value)}>
                        <SelectTrigger className="bg-slate-800/50 border-purple-400/30 text-white hover:border-purple-400/50 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="!bg-slate-800 !border-purple-400/30 !text-white">
                          {aiProviders.map(provider => (
                            <SelectItem key={provider.id} value={provider.id} className="!text-white hover:!bg-purple-600/20 focus:!bg-purple-600/30 focus:!text-white data-[highlighted]:!bg-purple-600/30 data-[highlighted]:!text-white">
                              <div className="flex items-center gap-3">
                                {provider.icon}
                                <span className="font-medium text-sm">{provider.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-purple-200 flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        AI Model
                      </label>
                      <Select value={config.model} onValueChange={(value) => handleConfigChange('model', value)}>
                        <SelectTrigger className="bg-slate-800/50 border-purple-400/30 text-white hover:border-purple-400/50 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="!bg-slate-800 !border-purple-400/30 !text-white">
                          {currentProvider.models.map(model => (
                            <SelectItem key={model.id} value={model.id} className="!text-white hover:!bg-purple-600/20 focus:!bg-purple-600/30 focus:!text-white data-[highlighted]:!bg-purple-600/30 data-[highlighted]:!text-white">
                              <div className="flex items-center justify-between w-full">
                                <span className="font-medium text-sm">{model.name}</span>
                                <Badge variant="secondary" className="ml-2 bg-purple-600/20 text-purple-200 text-xs">
                                  {model.contextLength.toLocaleString()} words
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* API Key Management */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-purple-200 flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      API Key for {currentProvider.name}
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          type="password"
                          value={apiKeys[config.provider] || ''}
                          onChange={(e) => handleApiKeyChange(config.provider, e.target.value)}
                          placeholder={`Enter your ${currentProvider.name} API key`}
                          className={cn(
                            "bg-slate-800/50 border-purple-400/30 text-white placeholder:text-purple-300/40 rounded-xl pr-20",
                            apiKeyValidation[config.provider]?.valid && "border-green-400/50",
                            apiKeyValidation[config.provider]?.valid === false && "border-red-400/50"
                          )}
                        />
                        {apiKeyValidation[config.provider] && (
                          <div className={cn(
                            "absolute right-3 top-1/2 transform -translate-y-1/2 text-xs",
                            apiKeyValidation[config.provider]?.valid ? "text-green-400" : "text-red-400"
                          )}>
                            {apiKeyValidation[config.provider]?.valid ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleValidateApiKey(config.provider)}
                        disabled={isValidatingApiKey[config.provider] || !apiKeys[config.provider]}
                        className="border-purple-400/30 text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-xl whitespace-nowrap"
                      >
                        {isValidatingApiKey[config.provider] ? (
                          <Activity className="h-4 w-4 animate-spin" />
                        ) : (
                          'Validate'
                        )}
                      </Button>
                    </div>
                    {apiKeyValidation[config.provider] && (
                      <p className={cn(
                        "text-xs",
                        apiKeyValidation[config.provider]?.valid ? "text-green-400" : "text-red-400"
                      )}>
                        {apiKeyValidation[config.provider]?.message}
                      </p>
                    )}
                    <p className="text-xs text-purple-300/60">
                      Your API key is stored locally and never sent to our servers. Get your API key from{' '}
                      {config.provider === 'anthropic' && (
                        <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
                          Anthropic Console
                        </a>
                      )}
                      {config.provider === 'openai' && (
                        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
                          OpenAI Platform
                        </a>
                      )}
                      {config.provider === 'groq' && (
                        <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
                          Groq Console
                        </a>
                      )}
                    </p>
                  </div>

                  {/* Firecrawl API Key Management */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-purple-200 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Firecrawl API Key (for Web Scraping)
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          type="password"
                          value={firecrawlApiKey}
                          onChange={(e) => {
                            const newKey = e.target.value;
                            setFirecrawlApiKey(newKey);
                            // Save to localStorage
                            localStorage.setItem('universal-agent-firecrawl-key', newKey);
                            // Clear validation when user starts typing
                            if (firecrawlValidation) {
                              setFirecrawlValidation(null);
                            }
                          }}
                          placeholder="Enter your Firecrawl API key"
                          className={cn(
                            "bg-slate-800/50 border-purple-400/30 text-white placeholder:text-purple-300/40 rounded-xl pr-20",
                            firecrawlValidation?.valid && "border-green-400/50",
                            firecrawlValidation?.valid === false && "border-red-400/50"
                          )}
                        />
                        {firecrawlValidation && (
                          <div className={cn(
                            "absolute right-3 top-1/2 transform -translate-y-1/2 text-xs",
                            firecrawlValidation?.valid ? "text-green-400" : "text-red-400"
                          )}>
                            {firecrawlValidation?.valid ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={validateFirecrawlApiKey}
                        disabled={isValidatingFirecrawl || !firecrawlApiKey}
                        className="border-purple-400/30 text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-xl whitespace-nowrap"
                      >
                        {isValidatingFirecrawl ? (
                          <Activity className="h-4 w-4 animate-spin" />
                        ) : (
                          'Validate'
                        )}
                      </Button>
                    </div>
                    {firecrawlValidation && (
                      <p className={cn(
                        "text-xs",
                        firecrawlValidation?.valid ? "text-green-400" : "text-red-400"
                      )}>
                        {firecrawlValidation?.message}
                      </p>
                    )}
                    <p className="text-xs text-purple-300/60">
                      Your Firecrawl API key is stored locally and never sent to our servers. Get your API key from{' '}
                      <a href="https://console.firecrawl.dev/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
                        Firecrawl Console
                      </a>
                    </p>
                  </div>

                  {/* Chat Interface */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-purple-200 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Test Conversation
                    </label>
                    
                    {/* Chat Messages */}
                    <div 
                      ref={chatContainerRef}
                      className="bg-slate-800/30 border border-purple-400/20 rounded-xl p-4 h-64 overflow-y-auto space-y-3"
                    >
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-purple-300/60 py-8">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Start a conversation to test your AI agent</p>
                        </div>
                      ) : (
                        chatMessages.map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                message.role === 'user'
                                  ? 'bg-purple-600/30 text-white'
                                  : message.role === 'tool'
                                  ? 'bg-blue-600/30 text-white'
                                  : 'bg-slate-700/50 text-purple-100'
                              }`}
                            >
                              <div className="whitespace-pre-wrap">
                                {message.role === 'tool' ? (
                                  <div>
                                    <div className="text-blue-300 font-semibold mb-2">🔧 Tool Execution Result:</div>
                                    <pre className="text-xs bg-slate-900/50 p-2 rounded border border-slate-700 overflow-x-auto">
                                      {JSON.stringify(JSON.parse(message.content), null, 2)}
                                    </pre>
                                  </div>
                                ) : (
                                  message.content
                                )}
                              </div>
                              {message.toolCalls && message.toolCalls.length > 0 && (
                                <div className="mt-2 p-2 bg-slate-900/30 rounded border border-slate-700">
                                  <div className="text-xs text-slate-400 mb-1">🛠️ Tool Calls:</div>
                                  {message.toolCalls.map((toolCall: any, toolIndex: number) => (
                                    <div key={toolIndex} className="text-xs text-slate-300">
                                      <span className="text-blue-400">{toolCall.function?.name}</span>
                                      {toolCall.function?.arguments && (
                                        <span className="text-slate-500 ml-1">
                                          ({JSON.stringify(JSON.parse(toolCall.function.arguments))})
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="text-xs opacity-60 mt-1">
                                {message.role === 'tool' ? 'Tool' : message.role === 'user' ? 'You' : 'Assistant'} • {message.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {isSendingMessage && (
                        <div className="flex justify-start">
                          <div className="bg-slate-700/50 text-purple-100 rounded-lg px-3 py-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 animate-spin" />
                              <span>AI is thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <textarea
                          value={currentMessage}
                          onChange={(e) => setCurrentMessage(e.target.value)}
                          onKeyPress={handleMessageKeyPress}
                          placeholder="Type your message here..."
                          disabled={isSendingMessage}
                          className="w-full bg-slate-800/50 border border-purple-400/30 text-white placeholder:text-purple-300/40 rounded-xl px-3 py-2 text-sm resize-none focus:border-purple-400/50 focus:outline-none disabled:opacity-50"
                          rows={2}
                        />
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!currentMessage.trim() || isSendingMessage}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingMessage ? (
                          <Activity className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Web Scraping Quick Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = prompt('Enter URL to scrape:');
                          if (url) {
                            handleWebScraping(url, { extract_text: true });
                          }
                        }}
                        disabled={!firecrawlValidation?.valid}
                        className="border-purple-400/30 text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-lg flex-1"
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        Scrape Webpage
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = prompt('Enter URL to scrape with links:');
                          if (url) {
                            handleWebScraping(url, { extract_text: true, extract_links: true });
                          }
                        }}
                        disabled={!firecrawlValidation?.valid}
                        className="border-purple-400/30 text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-lg flex-1"
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        Scrape + Links
                      </Button>
                    </div>

                    {/* Test Connection and Clear Chat Buttons */}
                    <div className="flex justify-between items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : 'https://zigsaw-backend.vercel.app');
                          console.log('Testing connection to:', backendUrl);
                          fetch(`${backendUrl}/api/hello`)
                            .then(res => res.json())
                            .then(data => {
                              console.log('Backend connection test:', data);
                              toast({
                                title: "Connection Test",
                                description: "Backend is reachable",
                              });
                            })
                            .catch(err => {
                              console.error('Backend connection failed:', err);
                              toast({
                                title: "Connection Test Failed",
                                description: err.message,
                                variant: "destructive",
                              });
                            });
                        }}
                        className="border-purple-400/30 text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-lg"
                      >
                        <Activity className="h-3 w-3 mr-1" />
                        Test Connection
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={validateFirecrawlApiKey}
                        disabled={!firecrawlApiKey.trim() || isValidatingFirecrawl}
                        className="border-purple-400/30 text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-lg"
                      >
                        <Activity className="h-3 w-3 mr-1" />
                        {isValidatingFirecrawl ? 'Validating...' : 'Test Firecrawl API'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const testMessage = "Can you scrape the website https://example.com and tell me what it's about?";
                          setCurrentMessage(testMessage);
                        }}
                        disabled={!firecrawlValidation?.valid}
                        className="border-purple-400/30 text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-lg"
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        Test Web Scraping
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          console.log('=== FIREcrawl Test Scraping Debug ===');
                          console.log('Firecrawl API Key:', firecrawlApiKey ? `${firecrawlApiKey.substring(0, 10)}...` : 'NOT SET');
                          console.log('Firecrawl Validation:', firecrawlValidation);
                          
                          if (!firecrawlApiKey) {
                            toast({
                              title: "Error",
                              description: "Firecrawl API key is required",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          try {
                            console.log('Starting test scrape of https://httpbin.org/html...');
                            const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : 'https://zigsaw-backend.vercel.app');
                            console.log('Backend URL:', backendUrl);
                            
                            const response = await fetch(`${backendUrl}/api/v1/firecrawl`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                url: 'https://httpbin.org/html',
                                extract_text: true,
                                extract_links: true,
                                extract_images: true,
                                apiKey: firecrawlApiKey
                              })
                            });
                            
                            console.log('Response status:', response.status);
                            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
                            
                            if (!response.ok) {
                              const errorData = await response.json();
                              console.error('Error response:', errorData);
                              throw new Error(errorData.details || `Scraping failed: ${response.status}`);
                            }
                            
                            const data = await response.json();
                            console.log('Success! Scraped data:', data);
                            
                            // Add scraping result to chat
                            const scrapingMessage: AgentMessage = {
                              role: 'assistant',
                              content: `✅ **Test Scraping Successful!**\n\n**URL:** https://httpbin.org/html\n**Title:** ${data.title || 'N/A'}\n**Description:** ${data.description || 'N/A'}\n\n**Content Preview:**\n${data.content ? data.content.substring(0, 500) + (data.content.length > 500 ? '...' : '') : 'No content'}\n\n**Links Found:** ${data.links?.length || 0}\n**Images Found:** ${data.images?.length || 0}\n\n**Full Response Data:**\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``,
                              timestamp: new Date(),
                            };
                            
                            const newMessages = [...chatMessages, scrapingMessage];
                            setChatMessages(newMessages);
                            handleConfigChange('messages', newMessages);
                            
                            toast({
                              title: "Test Scraping Success!",
                              description: `Successfully scraped https://httpbin.org/html`,
                            });
                            
                          } catch (error) {
                            console.error('Test scraping error:', error);
                            toast({
                              title: "Test Scraping Failed",
                              description: error instanceof Error ? error.message : "Failed to scrape the test website",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={!firecrawlValidation?.valid}
                        className="border-green-400/30 text-green-300 hover:text-green-200 hover:bg-green-500/10 rounded-lg"
                      >
                        <TestTube className="h-3 w-3 mr-1" />
                        Debug Test Scrape
                      </Button>
                      
                      {chatMessages.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setChatMessages([]);
                            handleConfigChange('messages', []);
                          }}
                          className="border-purple-400/30 text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-lg"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Clear Chat
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Temperature and Max Tokens */}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-purple-200 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Response Creativity
                        </span>
                        <span className="text-purple-300 font-mono">{config.temperature}</span>
                      </label>
                      <Slider
                        value={[config.temperature]}
                        onValueChange={(value) => handleConfigChange('temperature', value[0])}
                        min={0}
                        max={2}
                        step={0.1}
                        className="w-full cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-purple-300/60">
                        <span>Focused & Precise</span>
                        <span>Creative & Varied</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-purple-200 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Response Length
                        </span>
                        <span className="text-purple-300 font-mono">{config.maxTokens}</span>
                      </label>
                      <Slider
                        value={[config.maxTokens]}
                        onValueChange={(value) => handleConfigChange('maxTokens', value[0])}
                        min={100}
                        max={currentProvider.maxTokens}
                        step={100}
                        className="w-full cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-purple-300/60">
                        <span>Brief</span>
                        <span>Detailed</span>
                      </div>
                    </div>
                  </div>

                  {/* System Prompt */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-purple-200 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                        System Prompt (Agent Instructions)
                    </label>
                      {selectedSystemPromptPreset && (
                        <Badge variant="secondary" className="bg-green-600/20 text-green-300 border-green-500/30">
                          <Check className="h-3 w-3 mr-1" />
                          {systemPromptPresets.find(p => p.id === selectedSystemPromptPreset)?.name} Active
                        </Badge>
                      )}
                    </div>
                    
                    {/* System Prompt Presets */}
                    <div className="grid grid-cols-2 gap-2">
                      {systemPromptPresets.map(preset => {
                        const isActive = selectedSystemPromptPreset === preset.id;
                        return (
                          <motion.div key={preset.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSystemPromptPresetSelection(preset.id)}
                              className={cn(
                                "w-full border-purple-400/30 text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-lg h-auto p-2 text-xs relative",
                                isActive && "bg-purple-600/20 border-purple-400/60 text-purple-200"
                              )}
                            >
                              <div className="text-left w-full">
                                <div className="font-medium truncate">{preset.name}</div>
                              </div>
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>
                    
                    <Textarea
                      value={config.systemPrompt}
                      onChange={(e) => {
                        handleConfigChange('systemPrompt', e.target.value);
                        setSelectedSystemPromptPreset(null); // Clear preset when manually editing
                      }}
                      placeholder="Define the agent's behavior, personality, and instructions..."
                      className="bg-slate-800/50 border-purple-400/30 text-white placeholder:text-purple-300/40 min-h-[120px] rounded-xl resize-none"
                    />
                    <p className="text-xs text-purple-300/60">
                      This defines how the agent behaves and what it can do. It's like giving the agent its personality and capabilities.
                    </p>
                  </div>

                  {/* User Prompt */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-purple-200 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        User Prompt (Initial Message)
                      </label>
                      {selectedUserPromptPreset && (
                        <Badge variant="secondary" className="bg-green-600/20 text-green-300 border-green-500/30">
                          <Check className="h-3 w-3 mr-1" />
                          {userPromptPresets.find(p => p.id === selectedUserPromptPreset)?.name} Active
                        </Badge>
                      )}
                    </div>
                    
                    {/* User Prompt Presets */}
                    <div className="grid grid-cols-2 gap-2">
                      {userPromptPresets.map(preset => {
                        const isActive = selectedUserPromptPreset === preset.id;
                        return (
                          <motion.div key={preset.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUserPromptPresetSelection(preset.id)}
                              className={cn(
                                "w-full border-purple-400/30 text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-lg h-auto p-2 text-xs relative",
                                isActive && "bg-purple-600/20 border-purple-400/60 text-purple-200"
                              )}
                            >
                              <div className="text-left w-full">
                                <div className="font-medium truncate">{preset.name}</div>
                              </div>
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>
                    
                    <Textarea
                      value={config.userPrompt}
                      onChange={(e) => {
                        handleConfigChange('userPrompt', e.target.value);
                        setSelectedUserPromptPreset(null); // Clear preset when manually editing
                      }}
                      placeholder="Enter the initial message or question for the agent..."
                      className="bg-slate-800/50 border-purple-400/30 text-white placeholder:text-purple-300/40 min-h-[100px] rounded-xl resize-none"
                    />
                    <p className="text-xs text-purple-300/60">
                      This is the initial message that will be sent to the agent when it starts. It's like the first thing you'd say to the agent.
                    </p>
                  </div>

                  {/* Advanced Settings */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 bg-slate-800/30 border border-purple-400/20 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-purple-300" />
                          <span className="text-sm font-medium text-purple-200">Real-time Responses</span>
                        </div>
                        <Switch
                          checked={config.streamResponse}
                          onCheckedChange={(checked) => handleConfigChange('streamResponse', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-slate-800/30 border border-purple-400/20 rounded-xl">
                        <div className="flex items-center gap-2">
                          <RotateCcw className="h-4 w-4 text-purple-300" />
                          <span className="text-sm font-medium text-purple-200">Automatic Retry</span>
                        </div>
                        <Switch
                          checked={config.autoRetry}
                          onCheckedChange={(checked) => handleConfigChange('autoRetry', checked)}
                        />
                      </div>
                    </div>
                    
                    {/* Retry Attempts and Time Limit */}
                    {config.autoRetry && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="text-sm font-semibold text-purple-200 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <RotateCcw className="h-4 w-4" />
                              Retry Attempts
                            </span>
                            <span className="text-purple-300 font-mono">{config.retryCount}</span>
                          </label>
                          <Slider
                            value={[config.retryCount]}
                            onValueChange={(value) => handleConfigChange('retryCount', value[0])}
                            min={1}
                            max={10}
                            step={1}
                            className="w-full cursor-pointer"
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <label className="text-sm font-semibold text-purple-200 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Response Time Limit (seconds)
                            </span>
                            <span className="text-purple-300 font-mono">{config.timeout / 1000}</span>
                          </label>
                          <Slider
                            value={[config.timeout / 1000]}
                            onValueChange={(value) => handleConfigChange('timeout', value[0] * 1000)}
                            min={5}
                            max={300}
                            step={5}
                            className="w-full cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

              {/* Tools Tab */}
              <TabsContent value="tools" className="space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-2 rounded-lg">
                      <Wrench className="h-5 w-5 text-purple-300" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-purple-200">Available Tools</h4>
                      <p className="text-sm text-purple-300/60">{config.tools.length} tools selected</p>
                    </div>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowToolMarketplace(true)}
                      className="border-purple-400/30 text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-xl"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Browse Tools
                    </Button>
                  </motion.div>
                </div>

                {/* Tool Presets */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-purple-200 flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Quick Presets
                    </label>
                    {activePreset && (
                      <Badge variant="secondary" className="bg-green-600/20 text-green-300 border-green-500/30">
                        <Check className="h-3 w-3 mr-1" />
                        {toolPresets.find(p => p.id === activePreset)?.name} Active
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {toolPresets.map(preset => {
                      const isActive = activePreset === preset.id;
                      return (
                        <motion.div key={preset.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToolPresetSelection(preset.id)}
                            className={cn(
                              "w-full border-purple-400/30 text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-xl h-auto p-3 relative",
                              isActive && "bg-purple-600/20 border-purple-400/60 text-purple-200"
                            )}
                          >
                            <div className="text-left w-full">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{preset.name}</div>
                                {isActive && (
                                  <Check className="h-4 w-4 text-green-400" />
                                )}
                              </div>
                              <div className="text-xs text-purple-400/60">{preset.tools.length} tools</div>
                            </div>
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Current Tools */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-purple-200 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                      Selected Tools
                  </label>
                  
                  {config.tools.length === 0 ? (
                    <motion.div 
                      className="text-center py-12 bg-slate-800/20 border-2 border-dashed border-purple-400/30 rounded-2xl"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Wrench className="h-8 w-8 text-purple-300" />
                      </div>
                      <h5 className="text-lg font-semibold text-purple-200 mb-2">No tools selected</h5>
                      <p className="text-sm text-purple-300/60 mb-4">Add tools to give your agent more abilities</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowToolMarketplace(true)}
                        className="border-purple-400/30 text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-xl"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Browse Tools
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="grid gap-3">
                      {config.tools.map((tool: ToolWithIcon, index: number) => (
                        <motion.div
                          key={tool.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <Card className={cn(
                            "bg-slate-800/30 border-purple-400/20 hover:border-purple-400/40 transition-all",
                            !tool.enabled && "opacity-60"
                          )}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className={cn(
                                    "bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-2 rounded-lg border border-purple-400/30 flex-shrink-0",
                                    !tool.enabled && "grayscale"
                                  )}>
                                    {tool.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h5 className="text-sm font-semibold text-purple-200 truncate">{tool.name}</h5>
                                      {tool.enabled && (
                                        <Badge variant="secondary" className="bg-green-600/20 text-green-300 text-xs">
                                          Active
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-purple-300/60 mb-2 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{tool.description}</p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="secondary" className="bg-purple-600/20 text-purple-200 text-xs">
                                        {tool.category}
                                      </Badge>
                                      <span className="text-xs text-purple-400/60">
                                        ⭐ {tool.rating}
                                      </span>
                                      <span className="text-xs text-purple-400/60">
                                        {tool.downloads} downloads
                                      </span>
                                      <span className="text-xs text-green-400">
                                        ${tool.cost.toFixed(3)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Switch
                                        checked={tool.enabled}
                                        onCheckedChange={(checked) => {
                                          const newTools = [...config.tools];
                                          newTools[index] = { ...tool, enabled: checked };
                                          handleConfigChange('tools', newTools);
                                        }}
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {tool.enabled ? 'Disable tool' : 'Enable tool'}
                                    </TooltipContent>
                                  </Tooltip>
                                  
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToolToggle(tool.id)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Remove tool</TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages" className="space-y-6 mt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-2 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-purple-300" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-purple-200">Conversation</h4>
                    <p className="text-sm text-purple-300/60">{config.messages.length} chat messages</p>
                  </div>
                </div>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {config.messages.map((message: AgentMessage, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "flex",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <Card className={cn(
                        "max-w-[80%] border transition-all",
                        message.role === 'user' 
                          ? 'bg-purple-600/20 border-purple-400/30 text-purple-100' 
                          : 'bg-slate-800/30 border-purple-400/20 text-purple-200'
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={message.role === 'user' ? 'default' : 'secondary'} className="text-xs">
                              {message.role === 'user' ? 'You' : 'Agent'}
                            </Badge>
                            <span className="text-xs text-purple-300/60">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
                
                <div className="flex gap-3">
                  <Input
                    placeholder="Type a message to chat with the agent..."
                    className="bg-slate-800/50 border-purple-400/30 text-white placeholder:text-purple-300/40 flex-1 rounded-xl"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        if (input.value.trim()) {
                          const newMessage: AgentMessage = {
                            role: 'user',
                            content: input.value,
                            timestamp: new Date(),
                          };
                          handleConfigChange('messages', [...config.messages, newMessage]);
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-purple-400/30 text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-xl"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Compact View */}
        {!isExpanded && (
          <div className="relative p-4 space-y-3">
            {/* Provider Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-2 rounded-lg border border-purple-400/30">
                  {currentProvider.icon}
                </div>
                <div>
                  <span className="text-sm font-medium text-purple-200">{currentProvider.name}</span>
                  <p className="text-xs text-purple-300/60 truncate">{currentModel.name}</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-purple-600/20 text-purple-200 text-xs whitespace-nowrap">
                {currentModel.contextLength.toLocaleString()} words
              </Badge>
            </div>
            
            {/* Tools Summary */}
            {config.tools.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-purple-300" />
                  <span className="text-sm text-purple-200/80">
                    {config.tools.length} tools selected
                  </span>
                </div>
                <div className="flex -space-x-1">
                  {config.tools.slice(0, 3).map((tool: ToolWithIcon) => (
                    <Tooltip key={tool.id}>
                      <TooltipTrigger asChild>
                        <div className="bg-slate-800/50 border border-purple-400/30 rounded-full p-1">
                          <div className="w-4 h-4 text-purple-300">
                            {tool.icon}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{tool.name}</TooltipContent>
                    </Tooltip>
                  ))}
                  {config.tools.length > 3 && (
                    <div className="bg-slate-800/50 border border-purple-400/30 rounded-full p-1 text-xs text-purple-300 w-6 h-6 flex items-center justify-center">
                      +{config.tools.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Configuration Summary */}
            <div className="flex items-center justify-between text-xs text-purple-300/60">
              <span>Creativity: {config.temperature}</span>
              <span>Length: {config.maxTokens}</span>
            </div>
          </div>
        )}

        {/* Handles */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 bg-gradient-to-br from-purple-500 to-blue-500 border-2 border-purple-300 shadow-lg"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 bg-gradient-to-br from-purple-500 to-blue-500 border-2 border-purple-300 shadow-lg"
        />
      </motion.div>

      {/* Tool Marketplace Dialog */}
      <Dialog open={showToolMarketplace} onOpenChange={setShowToolMarketplace}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden bg-slate-900/95 border-purple-400/30">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl font-bold text-purple-200 flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-500/30 to-blue-500/30 p-2 rounded-xl">
                <Star className="h-6 w-6 text-purple-300" />
              </div>
              Tool Marketplace
            </DialogTitle>
            <DialogDescription className="text-purple-300/70 text-base">
              Browse and add powerful tools to enhance your agent's capabilities
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-300/60" />
                  <Input
                    placeholder="Search tools by name or description..."
                    value={toolSearchQuery}
                    onChange={(e) => setToolSearchQuery(e.target.value)}
                    className="bg-slate-800/50 border-purple-400/30 text-white placeholder:text-purple-300/40 pl-10 rounded-xl"
                  />
                </div>
              </div>
              <Select value={selectedToolCategory} onValueChange={setSelectedToolCategory}>
                <SelectTrigger className="w-56 bg-slate-800/50 border-purple-400/30 text-white rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="!bg-slate-800 !border-purple-400/30 !text-white">
                  {toolCategories.map(category => (
                    <SelectItem key={category.id} value={category.id} className="!text-white hover:!bg-purple-600/20 focus:!bg-purple-600/30 focus:!text-white data-[highlighted]:!bg-purple-600/30 data-[highlighted]:!text-white">
                      <div className="flex items-center gap-3">
                        {category.icon}
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[50vh] overflow-y-auto">
              {filteredTools.map((tool, index) => {
                const isSelected = config.tools.some((t: ToolWithIcon) => t.id === tool.id);
                return (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card className={cn(
                      "cursor-pointer transition-all hover:shadow-xl border-2",
                      isSelected 
                        ? "ring-2 ring-purple-500 bg-purple-900/30 border-purple-400/60" 
                        : "bg-slate-800/30 border-purple-400/20 hover:border-purple-400/40"
                    )}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-2 rounded-lg border border-purple-400/30">
                              {tool.icon}
                            </div>
                            <div>
                              <Badge variant="secondary" className="bg-purple-600/20 text-purple-200 text-xs mb-1">
                                {tool.category}
                              </Badge>
                              <p className="text-xs text-purple-400/60">
                                ⭐ {tool.rating} · {tool.downloads} downloads
                              </p>
                            </div>
                          </div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleToolToggle(tool.id)}
                              className={cn(
                                "rounded-xl",
                                isSelected 
                                  ? "bg-purple-600/80 text-white hover:bg-purple-600/90"
                                  : "border-purple-400/30 text-purple-300 hover:bg-purple-500/10"
                              )}
                            >
                              {isSelected ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </motion.div>
                        </div>
                        
                        <h5 className="font-semibold mb-2 text-purple-200">{tool.name}</h5>
                        <p className="text-sm text-purple-300/80 mb-4 line-clamp-3">{tool.description}</p>
                        
                        <div className="flex items-center justify-between text-xs text-purple-400/60">
                          <span>{tool.parameters.length} settings</span>
                          <span className="flex items-center gap-1">
                            <span className="text-green-400">$</span>
                            {tool.cost.toFixed(3)}
                          </span>
                        </div>
                        
                        {/* Tool Tags */}
                        {tool.tags && tool.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {tool.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs text-purple-300/60 border-purple-500/30">
                                {tag}
                              </Badge>
                            ))}
                            {tool.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs text-purple-300/60 border-purple-500/30">
                                +{tool.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Output Data Dialog */}
      <NodeDataOutputDialog
        isOpen={showDataOutput}
        onClose={() => setShowDataOutput(false)}
        nodeId={id || 'unknown'}
        nodeLabel={data.label}
        nodeType="universal_agent"
        outputData={data.outputData}
      />
    </TooltipProvider>
  );
};

export default memo(UniversalAgentNode); 