import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  ReactFlowProvider,
  EdgeProps,
  getBezierPath,
  useReactFlow,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Activity, Zap, Database, Workflow, X, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MetricsPanel from '../components/MetricsPanel';
import NodePanel from '../components/NodePanel';
import TabContent from '../components/TabContent';
import DeploymentModal from '../components/DeploymentModal';
import MultiWorkflowProgress from '../components/MultiWorkflowProgress';
import { workflowExecutionService, WorkflowExecutionUpdate } from '../services/workflowExecutionService';
import { detectWorkflows } from '../lib/utils';
import GroqLlamaNode from '../components/nodes/GroqLlamaNode';





import DocumentNode from '../components/nodes/DocumentNode';
import HumanInTheLoopNode from '../components/nodes/HumanInTheLoopNode';
import { DatabaseNode } from '../components/nodes/DatabaseNode'
import { ApiConnectorNode } from '../components/nodes/ApiConnectorNode'




import { ThemeProvider, useTheme } from '../components/theme/ThemeProvider'

import { useNavigate } from 'react-router-dom';
import GmailNode from '../components/nodes/GmailNode';
import { workflowPersistenceService, WorkflowConfig } from '../services/workflowPersistenceService';
import GoogleCalendarNode from '../components/nodes/GoogleCalendarNode';
import WhisperNode from '../components/nodes/WhisperNode';
import ImagenNode from '../components/nodes/ImagenNode';
import Veo3Node from '../components/nodes/Veo3Node';
import Blip2Node from '../components/nodes/Blip2Node';
import TriggerNode from '../components/nodes/TriggerNode';
import FirecrawlNode from '../components/nodes/FirecrawlNode';

import UniversalAgentNode from '../components/nodes/UniversalAgentNode';
import LoopNode from '../components/nodes/LoopNode';
import RouterNode from '../components/nodes/RouterNode';
import { UniversalNodeWrapper } from '../components/ui/universal-node-wrapper';
import NetworkingTab from '../components/NetworkingTab';
import { NetworkAnalyticsProvider } from '../contexts/NetworkAnalyticsContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { auth as firebaseAuth } from '@/lib/firebase';
import { WorkflowHeader } from '../components/workflow/WorkflowHeader'
import { WorkflowCanvas } from '../components/workflow/WorkflowCanvas'
import { WorkflowProvider } from '../contexts/WorkflowContext';

async function getAuthToken(): Promise<string | null> {
  const user = firebaseAuth.currentUser;
  if (user) {
    return await user.getIdToken();
  } else {
    return null;
  }
}

// Create wrapped versions of all nodes with universal delete functionality
const createWrappedNode = (OriginalNode: React.ComponentType<any>, nodeTypeName: string) => {
  return (props: any) => (
    <UniversalNodeWrapper 
      nodeId={props.id} 
      nodeType={nodeTypeName}
      onDelete={props.data?.onDelete}
    >
      <OriginalNode {...props} />
    </UniversalNodeWrapper>
  );
};

const nodeTypes = {
  groqllama: createWrappedNode(GroqLlamaNode, 'Groq Llama'),
  universal_agent: createWrappedNode(UniversalAgentNode, 'Universal Agent'),
  router: createWrappedNode(RouterNode, 'Router'),
  document: createWrappedNode(DocumentNode, 'Document'),
  trigger: createWrappedNode(TriggerNode, 'Trigger'),
  loop: createWrappedNode(LoopNode, 'Loop'),
  gmail: createWrappedNode(GmailNode, 'Gmail'),
  google_calendar: createWrappedNode(GoogleCalendarNode, 'Google Calendar'),
  whisper: createWrappedNode(WhisperNode, 'Whisper'),
  imagen: createWrappedNode(ImagenNode, 'Imagen'),
  veo3: createWrappedNode(Veo3Node, 'Veo3'),
  blip2: createWrappedNode(Blip2Node, 'Blip2'),
  human_in_loop: createWrappedNode(HumanInTheLoopNode, 'Human in the Loop'),
  database: createWrappedNode(DatabaseNode, 'Database'),
  api_connector: createWrappedNode(ApiConnectorNode, 'API Connector'),
  firecrawl: createWrappedNode(FirecrawlNode, 'Firecrawl'),
};

const initialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 100, y: 100 },
    data: { 
      label: 'Trigger Node',
      description: 'Initiate workflows based on events',
      status: 'idle',
      outputData: undefined,
      onShowOutputData: () => {},
    },
  },
  {
    id: 'document-1',
    type: 'document',
    position: { x: 400, y: 100 },
    data: { 
      label: 'Document Node',
      description: 'Upload and process PDF documents',
      status: 'idle',
      outputData: undefined,
    },
  },
  {
    id: 'universal-agent-1',
    type: 'universal_agent',
    position: { x: 700, y: 100 },
    data: { 
      label: 'Universal Agent',
      description: 'Advanced AI agent supporting multiple providers (Claude, GPT, Groq) with extensible tool integration, dynamic configuration, and intelligent workflow automation capabilities',
      status: 'idle',
      outputData: undefined,
      onShowOutputData: () => {},
    },
  },
];

// Universal Animated Edge Component
function UniversalAnimatedEdge(props: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
  })

  // Generate unique gradient ID for this edge
  const gradientId = `edge-gradient-${props.id}`
  
  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <filter id={`glow-${props.id}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Glow layer */}
      <path
        d={edgePath}
        stroke={`url(#${gradientId})`}
        strokeWidth={8}
        strokeDasharray="12 8"
        style={{ 
          filter: `url(#glow-${props.id})`,
          opacity: 0.6
        }}
        className="animate-[dashmove_2s_linear_infinite]"
        fill="none"
      />
      
      {/* Main edge */}
      <path
        d={edgePath}
        stroke={`url(#${gradientId})`}
        strokeWidth={3}
        strokeDasharray="8 6"
        style={{ 
          filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))'
        }}
        className="animate-[dashmove_1.5s_linear_infinite]"
        fill="none"
      />
      
      {/* Pulse dots */}
      <circle
        r="4"
        fill={`url(#${gradientId})`}
        style={{ 
          filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.8))'
        }}
        className="animate-[edgePulse_2s_ease-in-out_infinite]"
      >
        <animateMotion
          dur="3s"
          repeatCount="indefinite"
          path={edgePath}
        />
      </circle>
    </g>
  )
}

// Special animated edge for ClaudeCodeNode <-> GitHubNode
function ClaudeGitHubAnimatedEdge(props: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
  })
  
  return (
    <g>
      <defs>
        <linearGradient id="claude-github-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#444444" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#888888" />
        </linearGradient>
        <filter id="claude-glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Glow layer */}
      <path
        d={edgePath}
        stroke="url(#claude-github-gradient)"
        strokeWidth={8}
        strokeDasharray="12 8"
        style={{ 
          filter: 'url(#claude-glow)',
          opacity: 0.4
        }}
        className="animate-[dashmove_1.8s_linear_infinite]"
        fill="none"
      />
      
      {/* Main path */}
      <path
        d={edgePath}
        stroke="url(#claude-github-gradient)"
        strokeWidth={4}
        strokeDasharray="8 6"
        style={{ filter: 'drop-shadow(0 0 8px #666666)' }}
        className="animate-[dashmove_1.2s_linear_infinite]"
        fill="none"
      />
      
      {/* Data flow indicator */}
      <circle
        r="3"
        fill="#8b5cf6"
        style={{ 
          filter: 'drop-shadow(0 0 6px #8b5cf6)'
        }}
        className="animate-pulse"
      >
        <animateMotion
          dur="2.5s"
          repeatCount="indefinite"
          path={edgePath}
        />
      </circle>
    </g>
  )
}

const edgeTypes = {
  default: UniversalAnimatedEdge,
  claudeGitHub: ClaudeGitHubAnimatedEdge,
  animated: UniversalAnimatedEdge,
}

const Index = () => {
  return (
        <NetworkAnalyticsProvider>
          <ThemeProvider>
            <ReactFlowProvider>
              <WorkflowProvider>
                <WorkflowContent />
              </WorkflowProvider>
            </ReactFlowProvider>
          </ThemeProvider>
        </NetworkAnalyticsProvider>
  );
};

import { useAuth } from '../contexts/AuthContext';

const WorkflowContent = () => {
  const { screenToFlowPosition, getNode } = useReactFlow();
  const { isDark, toggleTheme, backgroundEffectsEnabled } = useTheme();
  const { signOut, currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Debug auth state
  useEffect(() => {
    console.log('Auth state changed - Current user:', currentUser ? currentUser.uid : 'No user');
  }, [currentUser]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  // Metrics are now handled by MetricsPanel component directly
  const [isNodePanelOpen, setIsNodePanelOpen] = useState(true);
  const [nodeIdCounter, setNodeIdCounter] = useState(2);
  const [isWorkflowLoaded, setIsWorkflowLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('workflow');

  const [isDeploymentModalOpen, setIsDeploymentModalOpen] = useState(false);
  const [isDeploymentMinimized, setIsDeploymentMinimized] = useState(false);
  const [isWorkflowExecuting, setIsWorkflowExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<{ success: boolean; error?: string; nodeResults?: Record<string, unknown>; totalTime?: number; finalOutput?: unknown } | null>(null);
  const [nodeOutputs, setNodeOutputs] = useState<Record<string, unknown>>({});
  
  // Multiple workflow execution state
  const [multiWorkflowResults, setMultiWorkflowResults] = useState<Record<string, {
    workflow: { id: string; name: string; nodes: unknown[]; edges: unknown[] };
    result: { success: boolean; error?: string; nodeResults?: Record<string, unknown>; totalTime?: number; finalOutput?: unknown };
    timestamp: string;
  }>>({});
  const [executingWorkflows, setExecutingWorkflows] = useState<Set<string>>(new Set());

  // Theme-based background gradient
  const backgroundGradient = isDark 
    ? 'from-black via-gray-900 to-gray-800'
    : 'from-gray-400 via-gray-300 to-gray-200';

  // Theme-based particle color
  const particleColor = isDark ? 'bg-white' : 'bg-gray-800';

  // Detect multiple workflows
  const detectedWorkflows = useMemo(() => {
    return detectWorkflows(nodes, edges);
  }, [nodes, edges]);

  // Workflow execution monitoring
  useEffect(() => {
    const handleWorkflowUpdate = (update: WorkflowExecutionUpdate) => {
      if (update.status === 'running') {
        setNodes((prevNodes) =>
          prevNodes.map((node) =>
            node.id === update.nodeId ? { ...node, data: { ...node.data, status: 'running' as const } } : node
          )
        );
      } else if (update.status === 'completed') {
        setNodes((prevNodes) =>
          prevNodes.map((node) =>
            node.id === update.nodeId 
              ? { 
                  ...node, 
                  data: { 
                    ...node.data, 
                    status: 'completed' as const,
                    outputData: update.output // ✅ Pass output data immediately when node completes
                  } 
                }
              : node
          )
        );
        
        if (update.output) {
          setNodeOutputs(prev => ({
            ...prev,
            [update.nodeId]: update.output
          }));
        }
      } else if (update.status === 'error') {
        setNodes((prevNodes) =>
          prevNodes.map((node) =>
            node.id === update.nodeId 
              ? { ...node, data: { ...node.data, status: 'error' as const } }
              : node
          )
        );
      }
    };

    const unsubscribe = workflowExecutionService.onProgress(handleWorkflowUpdate);
    
    return () => {
      unsubscribe();
    };
  }, [setNodes]);

  // Load workflow configuration on component mount
  useEffect(() => {
    const loadWorkflow = async () => {
      if (!currentUser || isWorkflowLoaded) return;

      try {
        const idToken = await currentUser.getIdToken(true);
        const savedConfig = await workflowPersistenceService.loadWorkflow(idToken);
        
        if (savedConfig && workflowPersistenceService.isValidWorkflowConfig(savedConfig)) {
          console.log('Loading saved workflow configuration', savedConfig);
          setNodes(savedConfig.nodes || []);
          setEdges(savedConfig.edges || []);
          setNodeIdCounter(savedConfig.nodeIdCounter || 2);
        } else {
          console.log('No saved workflow found, using initial nodes');
          setNodes(initialNodes);
          setEdges([]);
        }
      } catch (error) {
        console.error('Failed to load workflow:', error);
      } finally {
        setIsWorkflowLoaded(true);
      }
    };

    loadWorkflow();
  }, [currentUser, isWorkflowLoaded, setNodes, setEdges]);

  // Auto-save workflow configuration when nodes or edges change
  useEffect(() => {
    const autoSave = async () => {
      console.log('Auto-save triggered. Current user:', !!currentUser, 'Workflow loaded:', isWorkflowLoaded, 'Nodes count:', nodes.length);
      
      if (!currentUser) {
        console.log('No current user, skipping auto-save');
        return;
      }
      
      if (!isWorkflowLoaded) {
        console.log('Workflow not loaded yet, skipping auto-save');
        return;
      }

      // Skip auto-save if nodes array is empty (initial state)
      if (nodes.length === 0 && edges.length === 0) {
        console.log('Empty workflow, skipping auto-save');
        return;
      }

      const config: WorkflowConfig = {
        nodes,
        edges,
        nodeIdCounter,
        lastSaved: new Date().toISOString()
      };

      console.log('Attempting to auto-save workflow config:', config);

      try {
        const idToken = await currentUser.getIdToken(true);
        workflowPersistenceService.autoSaveWorkflow(config, idToken);
      } catch (error) {
        console.error('Failed to auto-save workflow:', error);
      }
    };

    autoSave();
  }, [nodes, edges, nodeIdCounter, currentUser, isWorkflowLoaded]);

  // Cleanup auto-save on unmount
  useEffect(() => {
    return () => {
      workflowPersistenceService.clearAutoSave();
    };
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleShowNodeOutput = (nodeId: string) => {
    const output = nodeOutputs[nodeId];
    if (output) {
      alert(`Node ${nodeId} Output:\n${JSON.stringify(output, null, 2)}`);
    } else {
      alert(`No output data available for node ${nodeId}`);
    }
  };

  // Manual save function for debugging
  const handleManualSave = async () => {
    if (!currentUser) {
      console.log('No user logged in');
      return;
    }

    const config: WorkflowConfig = {
      nodes,
      edges,
      nodeIdCounter,
      lastSaved: new Date().toISOString()
    };

    try {
      const idToken = await currentUser.getIdToken(true);
      await workflowPersistenceService.saveWorkflow(config, idToken);
      alert('Workflow saved manually!');
    } catch (error) {
      console.error('Manual save failed:', error);
      alert('Failed to save workflow');
    }
  };

  // Define tabs configuration
  const tabs = useMemo(() => [
    {
      id: 'github-credentials',
      label: 'GitHub',
      icon: <Github className="w-3 h-3" />,
      persistent: true
    },
    {
      id: 'workflow',
      label: 'Workflow',
      icon: <Workflow className="w-3 h-3" />,
      persistent: true
    },
    {
      id: 'networking',
      label: 'Networking',
      icon: <Activity className="w-3 h-3" />,
      persistent: true
    }
  ], []);

  // Generate static particles to prevent jumping when nodes move
  const particles = useMemo(() => 
    [...Array(15)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
    })), []
  );

  const [connectionPrompt, setConnectionPrompt] = useState<{
    isOpen: boolean;
    source?: string;
    target?: string;
    params?: Connection;
  }>({ isOpen: false });

  const onConnect = useCallback((params: Connection) => {

    // Add the edge for all connections
    setEdges((eds) => addEdge(params, eds));
  }, [getNode, setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      // Use screenToFlowPosition for accurate positioning
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}-${nodeIdCounter}`,
        type,
        position,
        data: {
          label: getNodeLabel(type),
          description: getNodeDescription(type),
          status: 'idle' as const,
          outputData: undefined,
          onShowOutputData: () => {},
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setNodeIdCounter((prev) => prev + 1);
    },
    [nodeIdCounter, setNodes, screenToFlowPosition, getNode]
  );

  const onDataOutput = useCallback((nodeId: string, outputData: any) => {
    console.log(`[onDataOutput] Node ${nodeId} produced output:`, outputData);
    
    setEdges(eds => {
      const connectedEdge = eds.find(edge => edge.source === nodeId);
      if (connectedEdge) {
        console.log(`[onDataOutput] Found connected edge to target: ${connectedEdge.target}`);
        setNodes(nds => 
          nds.map(node => {
            if (node.id === connectedEdge.target) {
              console.log(`[onDataOutput] Updating target node ${node.id} with new inputData.`);
              return {
                ...node,
                data: {
                  ...node.data,
                  inputData: outputData,
                },
              };
            }
            return node;
          })
        );
      } else {
        console.log(`[onDataOutput] No outgoing edge found for node ${nodeId}.`);
      }
      return eds;
    });
  }, [setNodes, setEdges, getNode]);

  const getNodeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      ai: 'AI Node',
      api: 'API Node', 
      groq: 'Groq Node',

      claudeCode: 'Claude Code Node',
      data: 'Data Node',
      function: 'Function Node',
      output: 'Output Node',
      trigger: 'Trigger Node',
      github: 'GitHub',
      gmail: 'Gmail API',
      google_calendar: 'Google Calendar',
      whisper: 'Whisper Transcription',
      imagen: 'Imagen-4 Generator',
      veo3: 'Veo-3 Video Generator',
      blip2: 'BLIP-2 Image Analyzer',
      firecrawl: 'Firecrawl Web Scraper',
    };
    return labels[type] || type;
  };

  const getNodeDescription = (type: string): string => {
    const descriptions: Record<string, string> = {
      ai: 'AI processing and completion node with multiple provider support',
      api: 'HTTP API request and response handling',
      groq: 'High-speed AI inference with Groq hardware acceleration',

      claudeCode: 'AI-powered code generation, review, and analysis',
      data: 'Data storage, transformation, and manipulation',
      function: 'Custom JavaScript function execution',
      output: 'Workflow output and result display',
      trigger: 'Event-based workflow triggers',
      github: 'GitHub integration with advanced credential management',
      gmail: 'Gmail integration and email management',
      google_calendar: 'Google Calendar integration and event management',
      whisper: 'AI-powered audio transcription using OpenAI Whisper via Replicate',
      imagen: 'High-quality image generation using Google\'s Imagen-4 model',
      veo3: 'Advanced text-to-video generation with Google\'s Veo-3 model via Replicate',
      blip2: 'Advanced image understanding and visual question answering using BLIP-2 via Replicate',
      firecrawl: 'Professional web scraping and crawling with AI-powered content extraction and structured data output',
    };
    return descriptions[type] || 'Node description not available';
  };

  // Real-time metrics are now handled by MetricsPanel itself
  // Remove fake metrics simulation

  const handleOpenDeployment = () => {
    setIsDeploymentModalOpen(true);
    setIsDeploymentMinimized(false);
  };

  const handleToggleMinimize = () => {
    setIsDeploymentMinimized(!isDeploymentMinimized);
  };

  const handleRunWorkflow = async () => {
    if (nodes.length === 0) {
      alert('Please add nodes to your workflow before running');
      return;
    }

    if (isWorkflowExecuting) {
      // Stop execution
      try {
        workflowExecutionService.stopExecution();
      } catch (error) {
        console.log('Stop execution method not available, continuing with manual stop');
      }
      setIsWorkflowExecuting(false);
      setExecutingWorkflows(new Set());
      return;
    }

    // Clear previous results
    setExecutionResults(null);
    setNodeOutputs({});
    setMultiWorkflowResults({});

    if (detectedWorkflows.length === 0) {
      console.log('No workflows detected');
      return;
    }

    setIsWorkflowExecuting(true);

    try {
      if (detectedWorkflows.length === 1) {
        // Single workflow execution
        const workflow = detectedWorkflows[0];
        console.log(`🚀 Running single workflow: ${workflow.name}`);
        
        // Set initial node states to 'running'
        setNodes((prevNodes) => 
          prevNodes.map(node => 
            workflow.nodes.some(wn => wn.id === node.id)
              ? { ...node, data: { ...node.data, status: 'running' } }
              : node
          )
        );

        // Execute workflow with unique ID
        const result = await workflowExecutionService.executeWorkflow(workflow.nodes, workflow.edges, workflow.id);
        
        console.log('✅ Single workflow execution completed:', result);
        setExecutionResults(result);
        
        // Store individual node outputs for easy access
        if (result && result.nodeResults) {
          setNodeOutputs(result.nodeResults);
          
          // Update nodes with their output data and final status
          setNodes(function updateNodesWithResults(prevNodes) {
            if (!Array.isArray(prevNodes) || !Array.isArray(workflow.nodes) || !result?.nodeResults) return prevNodes

            return prevNodes.map(function updateNode(node) {
              const matchingWorkflowNode = workflow.nodes.find(wn => wn.id === node.id)
              if (!matchingWorkflowNode) return node

              return {
                ...node,
                data: {
                  ...node.data,
                  status: result.success ? 'completed' : 'error',
                  outputData: result.nodeResults[node.id],
                  onShowOutputData: function showNodeOutput() { handleShowNodeOutput(node.id) }
                }
              }
            })
          });
        }

      } else {
        // Multiple workflow execution - run all workflows in parallel
        console.log(`🚀 Running ${detectedWorkflows.length} workflows in parallel`);
        setExecutingWorkflows(new Set(detectedWorkflows.map(w => w.id)));
        
        // Set initial node states to 'running' for all nodes
        setNodes((prevNodes) => 
          prevNodes.map(node => ({ 
            ...node, 
            data: { ...node.data, status: 'running' } 
          }))
        );

        // Create execution promises for each workflow
        const workflowPromises = detectedWorkflows.map(async (workflow, index) => {
          try {
            console.log(`Starting workflow ${index + 1}: ${workflow.name}`);
            
            // Add a small delay between workflow starts to avoid conflicts
            await new Promise(resolve => setTimeout(resolve, index * 100));
            
            const result = await workflowExecutionService.executeWorkflow(workflow.nodes, workflow.edges, workflow.id);
            
            console.log(`✅ Workflow ${workflow.name} completed:`, result);
            
            // Store result for this specific workflow
            setMultiWorkflowResults(prev => ({
              ...prev,
              [workflow.id]: {
                workflow,
                result,
                timestamp: new Date().toISOString()
              }
            }));

            // Mark this workflow as completed
            setExecutingWorkflows(prev => {
              const newSet = new Set(prev);
              newSet.delete(workflow.id);
              console.log(`Workflow ${workflow.id} completed, remaining:`, newSet.size);
              return newSet;
            });

            // Update node outputs and statuses for this workflow
            if (result && result.nodeResults) {
              setNodeOutputs(prev => ({
                ...prev,
                ...result.nodeResults
              }));
              
              // Update nodes with their output data and final status
              setNodes((prevNodes) => 
                prevNodes.map(node => {
                  if (workflow.nodes.some(wn => wn.id === node.id)) {
                    return {
                      ...node,
                      data: {
                        ...node.data,
                        status: result.success ? 'completed' : 'error',
                        outputData: result.nodeResults[node.id],
                        onShowOutputData: () => handleShowNodeOutput(node.id)
                      }
                    };
                  }
                  return node;
                })
              );
            }

            return { workflowId: workflow.id, result, success: true };
          } catch (error) {
            console.error(`❌ Workflow ${workflow.name} failed:`, error);
            
            const errorResult = { 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error',
              nodeResults: {}
            };
            
            // Mark this workflow as completed (with error)
            setExecutingWorkflows(prev => {
              const newSet = new Set(prev);
              newSet.delete(workflow.id);
              console.log(`Workflow ${workflow.id} failed, remaining:`, newSet.size);
              return newSet;
            });

            setMultiWorkflowResults(prev => ({
              ...prev,
              [workflow.id]: {
                workflow,
                result: errorResult,
                timestamp: new Date().toISOString()
              }
            }));

            // Update nodes with error status for this workflow
            setNodes((prevNodes) => 
              prevNodes.map(node => {
                if (workflow.nodes.some(wn => wn.id === node.id)) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      status: 'error'
                    }
                  };
                }
                return node;
              })
            );
            
            return { workflowId: workflow.id, error, success: false };
          }
        });

        // Wait for all workflows to complete
        const results = await Promise.allSettled(workflowPromises);
        
        const successCount = results.filter(r => 
          r.status === 'fulfilled' && r.value.success
        ).length;
        
        console.log(`🎉 All workflows completed: ${successCount}/${detectedWorkflows.length} successful`);
      }

    } catch (error) {
      console.error('Workflow execution error:', error);
      setExecutionResults({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        nodeResults: {}
      });
      
      // Set all nodes to error state
      setNodes((prevNodes) => 
        prevNodes.map(node => ({ 
          ...node, 
          data: { ...node.data, status: 'error' } 
        }))
      );
    } finally {
      setIsWorkflowExecuting(false);
      setExecutingWorkflows(new Set());
      console.log('🏁 Workflow execution finished');
    }
  };

  const handleTestPost = async () => {
    // Define default configs for agent node types
    const defaultConfigs: Record<string, any> = {
      universal_agent: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet',
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: 'You are a helpful AI assistant with access to various tools. Use them appropriately to help the user.',
        messages: [
          { role: 'user', content: 'Hello! How can I help you today?', timestamp: new Date() }
        ],
        tools: [],
        toolPresets: [],
        streamResponse: true,
        autoRetry: true,
        retryCount: 3,
        timeout: 30000,
      },
      groqllama: {
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 1000,
        system_prompt: 'You are a helpful AI assistant.',
        user_prompt: '',
      },
      // Add more agent node types and their defaults as needed
    }

    const agentNodeTypes = Object.keys(defaultConfigs)
    // Only include nodes with a defined string type
    const agentConfigs = nodes
      .filter(node => typeof node.type === 'string' && agentNodeTypes.includes(node.type))
      .map(node => {
        const type = node.type as string
        const defaults = defaultConfigs[type] || {}
        const config = { ...defaults, ...(node.data?.config || {}) }
        return {
          id: node.id,
          type,
          config,
        }
      })

    // Use environment variable or fallback to Vercel backend
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://zigsaw-backend.vercel.app'
    const apiEndpoint = `${backendUrl}/api/workflow/execute`

    try {
      console.log(`🚀 Testing POST to: ${apiEndpoint}`)
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: { nodes, edges },
          agentConfigs,
        }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('✅ Test POST successful:', data)
      alert('Test POST response:\n' + JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('❌ Test POST failed:', error)
      alert('Test POST failed: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  // Universal animated edges with special cases
  const computedEdges = useMemo(() => {
    return edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source)
      const targetNode = nodes.find(n => n.id === edge.target)
      
      // Special case for ClaudeCodeNode <-> GitHubNode
      const isClaudeGitHub =
        (sourceNode?.type === 'claude_code' && targetNode?.type === 'github') ||
        (sourceNode?.type === 'github' && targetNode?.type === 'claude_code')
      
      if (isClaudeGitHub) {
        return { ...edge, type: 'claudeGitHub', animated: true }
      }
      
      // Make ALL other edges animated by default
      return { 
        ...edge, 
        type: edge.type || 'default', 
        animated: true,
        style: {
          ...edge.style,
          strokeWidth: 3,
          filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.3))'
        }
      }
    })
  }, [edges, nodes])

  // Handle node deletion
  const handleDeleteNode = useCallback((nodeId: string) => {
    // Remove from nodes array
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    
    // Remove any connected edges
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    
    console.log(`🗑️ Node ${nodeId} deleted from frontend`);
  }, [setNodes, setEdges]);

  // Pass the onDataOutput handler to each node
  const nodesWithCallbacks = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onDataOutput: (data: any) => onDataOutput(node.id, data),
        onStatusChange: (status: 'idle' | 'running' | 'completed' | 'error') => {
          setNodes(nds => 
            nds.map(n => 
              n.id === node.id ? { ...n, data: { ...n.data, status } } : n
            )
          );
        },
        onOutputDataChange: (outputData: any) => {
          setNodes(nds => 
            nds.map(n => 
              n.id === node.id ? { ...n, data: { ...n.data, outputData } } : n
            )
          );
        },
        onDelete: handleDeleteNode,
      }
    }));
  }, [nodes, onDataOutput, setNodes, handleDeleteNode]);

  return (
    <div className={`h-screen bg-gradient-to-br ${backgroundGradient} flex relative overflow-hidden`}>
      {/* Animated Background Elements - Only render if background effects are enabled */}
      {backgroundEffectsEnabled && (
        <>
          <motion.div 
            className="absolute inset-0 opacity-20"
            animate={isDark ? {
              background: [
                'radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)'
              ]
            } : {
              background: [
                'radial-gradient(circle at 20% 80%, rgba(0, 0, 0, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 20%, rgba(0, 0, 0, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 40% 40%, rgba(0, 0, 0, 0.1) 0%, transparent 50%)'
              ]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />

          {/* Floating Particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className={`absolute w-1 h-1 ${particleColor} rounded-full opacity-60 pointer-events-none`}
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
              }}
            />
          ))}
        </>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        <WorkflowHeader
          isDark={isDark}
          toggleTheme={toggleTheme}
          detectedWorkflows={detectedWorkflows}
          activeTab={activeTab}
          handleTabChange={handleTabChange}
          tabs={tabs}
          navigate={navigate}
          handleManualSave={handleManualSave}
          isWorkflowExecuting={isWorkflowExecuting}
          nodes={nodes}
          handleRunWorkflow={handleRunWorkflow}
          handleOpenDeployment={handleOpenDeployment}
          signOut={signOut}
          onTestPost={handleTestPost}
        />

        {/* Tab Content Panel */}
        <AnimatePresence>
          {activeTab !== 'workflow' && activeTab !== 'networking' && activeTab !== 'brick-builder' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`absolute top-16 sm:top-20 left-3 right-3 sm:left-6 sm:right-6 z-20 backdrop-blur-xl ${isDark ? 'bg-gray-900/40 border-gray-700/20' : 'bg-gray-200/60 border-gray-600/30'} border rounded-2xl shadow-2xl max-h-[60vh] overflow-hidden`}
            >
              <div className="p-6">
                <TabContent 
                  activeTab={activeTab} 
                  nodes={nodesWithCallbacks}
                  edges={computedEdges}
                  isNodePanelOpen={isNodePanelOpen}
                  onNodePanelToggle={() => setIsNodePanelOpen(!isNodePanelOpen)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Multi-Workflow Progress Panel - Shows during execution when multiple workflows are detected */}
        <AnimatePresence>
          {(isWorkflowExecuting || Object.keys(multiWorkflowResults).length > 0) && detectedWorkflows.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute top-24 left-6 right-6 z-25 max-h-[50vh] overflow-hidden"
            >
              <MultiWorkflowProgress 
                workflows={detectedWorkflows}
                executingWorkflows={executingWorkflows}
                multiWorkflowResults={multiWorkflowResults}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Multiple Workflow Execution Results Panel */}
        <AnimatePresence>
          {(executionResults || Object.keys(multiWorkflowResults).length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`absolute bottom-6 right-6 z-30 backdrop-blur-xl border rounded-2xl shadow-2xl ${
                isDark ? 'bg-gray-900/90 border-gray-700/30' : 'bg-gray-100/90 border-gray-600/40'
              } ${
                Object.keys(multiWorkflowResults).length > 1 
                  ? 'max-w-6xl w-full max-h-96 overflow-hidden' 
                  : 'max-w-md w-80'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-xl ${isDark ? 'bg-green-400/20 text-green-400' : 'bg-green-500/20 text-green-600'}`}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                        {Object.keys(multiWorkflowResults).length > 1 
                          ? `${Object.keys(multiWorkflowResults).length} Workflows Running` 
                          : executionResults?.success ? 'Workflow Complete' : 'Execution Failed'
                        }
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                        {Object.keys(multiWorkflowResults).length > 1 
                          ? `${Object.keys(multiWorkflowResults).length - executingWorkflows.size} completed, ${executingWorkflows.size} running`
                          : executionResults?.success 
                            ? `Executed in ${executionResults.totalTime}ms` 
                            : 'Check logs for details'
                        }
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => {
                      setExecutionResults(null);
                      setMultiWorkflowResults({});
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-1 rounded-lg transition-colors ${isDark ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300' : 'bg-gray-200/50 hover:bg-gray-300/50 text-gray-600'}`}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                {Object.keys(multiWorkflowResults).length > 1 ? (
                  /* Multiple Workflows Side by Side */
                  <div className="overflow-y-auto max-h-72">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(multiWorkflowResults).map(([workflowId, data]) => {
                        const isExecuting = executingWorkflows.has(workflowId);
                        const result = data.result;
                        const workflow = data.workflow;
                        
                        return (
                          <motion.div
                            key={workflowId}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-4 rounded-xl border backdrop-blur-sm ${
                              isExecuting 
                                ? 'border-cyan-400/30 bg-cyan-900/20' 
                                : result.success 
                                  ? 'border-emerald-400/30 bg-emerald-900/20'
                                  : 'border-red-400/30 bg-red-900/20'
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-3">
                              <div className={`p-1.5 rounded-lg ${
                                isExecuting 
                                  ? 'bg-cyan-400/20 text-cyan-400' 
                                  : result.success 
                                    ? 'bg-emerald-400/20 text-emerald-400'
                                    : 'bg-red-400/20 text-red-400'
                              }`}>
                                {isExecuting ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  >
                                    <Zap className="w-4 h-4" />
                                  </motion.div>
                                ) : result.success ? (
                                  <Zap className="w-4 h-4" />
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-white text-sm truncate">
                                  {workflow.name}
                                </h4>
                                <p className={`text-xs ${
                                  isExecuting 
                                    ? 'text-cyan-300' 
                                    : result.success 
                                      ? 'text-emerald-300' 
                                      : 'text-red-300'
                                }`}>
                                  {isExecuting 
                                    ? 'Running...' 
                                    : result.success 
                                      ? `${workflow.nodes.length} nodes completed`
                                      : 'Failed'
                                  }
                                </p>
                              </div>
                            </div>

                            {!isExecuting && (
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="p-2 bg-slate-800/30 rounded">
                                    <span className="text-slate-400">Nodes:</span>
                                    <p className={`font-mono ${result.success ? 'text-emerald-300' : 'text-red-300'}`}>
                                      {result.success ? Object.keys(result.nodeResults || {}).length : 'N/A'}
                                    </p>
                                  </div>
                                  <div className="p-2 bg-slate-800/30 rounded">
                                    <span className="text-slate-400">Time:</span>
                                    <p className={`font-mono ${result.success ? 'text-emerald-300' : 'text-red-300'}`}>
                                      {result.success ? `${((result.totalTime || 0) / 1000).toFixed(1)}s` : 'N/A'}
                                    </p>
                                  </div>
                                </div>

                                {result.success ? (
                                  <div className="p-2 bg-slate-800/30 rounded">
                                    <span className="text-slate-400 text-xs">Output:</span>
                                    <div className="mt-1 max-h-16 overflow-y-auto">
                                      <pre className="text-xs text-emerald-300 font-mono">
                                        {JSON.stringify(result.finalOutput || result.nodeResults, null, 2).substring(0, 100)}
                                        {JSON.stringify(result.finalOutput || result.nodeResults, null, 2).length > 100 && '...'}
                                      </pre>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-2 bg-red-500/10 border border-red-500/20 rounded">
                                    <p className="text-red-400 text-xs">{result.error}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ) : executionResults ? (
                  /* Single Workflow Results */
                  executionResults.success ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 bg-slate-800/30 rounded-lg">
                          <span className="text-slate-400">Nodes:</span>
                          <p className="text-emerald-300 font-mono">
                            {Object.keys(executionResults.nodeResults || {}).length}
                          </p>
                        </div>
                        <div className="p-2 bg-slate-800/30 rounded-lg">
                          <span className="text-slate-400">Time:</span>
                          <p className="text-emerald-300 font-mono">
                            {((executionResults.totalTime || 0) / 1000).toFixed(2)}s
                          </p>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-800/30 rounded-lg">
                        <span className="text-slate-400 text-sm">Final Results:</span>
                        <div className="mt-2 max-h-20 overflow-y-auto">
                          <pre className="text-xs text-emerald-300 font-mono">
                            {JSON.stringify(executionResults.nodeResults, null, 2).substring(0, 200)}
                            {JSON.stringify(executionResults.nodeResults, null, 2).length > 200 && '...'}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400 text-sm">{executionResults.error}</p>
                    </div>
                  )
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Main Content Area - Conditional Rendering */}
      <div className="h-full pt-16 sm:pt-20">
        <AnimatePresence mode="wait">
          {activeTab === 'workflow' ? (
            <motion.div
              key="workflow"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="h-full w-full"
            >
              <WorkflowCanvas
                nodesWithCallbacks={nodesWithCallbacks}
                computedEdges={computedEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                isDark={isDark}
                nodes={nodes}
                edges={edges}
              />
            </motion.div>
          ) : activeTab === 'networking' ? (
            <motion.div
              key="networking"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="h-full w-full"
            >
              <NetworkingTab />
            </motion.div>
          ) : activeTab === 'brick-builder' ? (
            <motion.div
              key="brick-builder"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="h-full w-full"
            >

              <ReactFlow
                nodes={nodesWithCallbacks}
                edges={computedEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes as unknown as NodeTypes}
                edgeTypes={edgeTypes}
                className="bg-transparent"
                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              >
                <Controls className={`backdrop-blur-xl border shadow-xl ${isDark ? 'bg-gray-900/40 border-gray-700/20' : 'bg-gray-100/60 border-gray-600/40'}`} />
                <MiniMap 
                  className={`backdrop-blur-xl border shadow-xl ${isDark ? 'bg-gray-900/40 border-gray-700/20' : 'bg-gray-100/60 border-gray-600/40'}`}
                  nodeColor={isDark ? "#ffffff" : "#1f2937"}
                  maskColor={isDark ? "rgba(15, 23, 42, 0.8)" : "rgba(75, 85, 99, 0.8)"}
                  style={{ opacity: isDark ? 0.3 : 0.7 }}
                />
                <Background 
                  color={isDark ? "#ffffff" : "#1f2937"} 
                  gap={20} 
                  size={1}
                  style={{ opacity: isDark ? 0.3 : 0.7 }}
                />
              </ReactFlow>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>


    </div>

    {/* Enhanced Metrics Panel */}
    <MetricsPanel isDark={isDark} />

    {/* Floating Node Panel Toggle Button */}
    <AnimatePresence>
      {!isNodePanelOpen && activeTab !== 'knowledge-graph' && activeTab !== 'networking' && (
        <motion.button
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ duration: 0.3, type: "spring", damping: 25 }}
          onClick={() => setIsNodePanelOpen(true)}
          whileHover={{ 
            scale: 1.1, 
            boxShadow: isDark ? "0 0 25px rgba(255, 255, 255, 0.4)" : "0 0 25px rgba(0, 0, 0, 0.4)",
            x: 10
          }}
          whileTap={{ scale: 0.9 }}
          className={`fixed left-4 top-1/2 transform -translate-y-1/2 z-50 p-4 rounded-2xl font-medium transition-all duration-300 flex items-center space-x-2 backdrop-blur-xl border shadow-2xl ${
            isDark 
              ? 'bg-gradient-to-r from-gray-800/90 to-gray-700/90 hover:from-gray-700/90 hover:to-gray-600/90 text-white hover:text-white border-gray-600/30' 
              : 'bg-gradient-to-r from-gray-400/90 to-gray-500/90 hover:from-gray-500/90 hover:to-gray-600/90 text-white hover:text-white border-gray-600/40'
          }`}
        >
          <Database className="w-6 h-6" />
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            transition={{ delay: 0.1 }}
            className="overflow-hidden"
          >
            <span className="whitespace-nowrap">Node Library</span>
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>

    {/* Node Panel */}
    {activeTab !== 'knowledge-graph' && activeTab !== 'networking' && (
      <NodePanel 
        isOpen={isNodePanelOpen} 
        onToggle={() => setIsNodePanelOpen(!isNodePanelOpen)} 
        isDark={isDark}
      />
    )}

    {/* Deployment Modal */}
            <DeploymentModal
        isOpen={isDeploymentModalOpen}
        onClose={() => setIsDeploymentModalOpen(false)}
        nodes={nodes}
        edges={edges}
        isMinimized={isDeploymentMinimized}
        onToggleMinimize={handleToggleMinimize}
    />

    {connectionPrompt.isOpen && (
      <AlertDialog open onOpenChange={(open) => setConnectionPrompt({ ...connectionPrompt, isOpen: open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable Calendar Tools?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to connect the Google Calendar node to the Claude 4 node to provide it with tool-calling capabilities?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConnectionPrompt({ isOpen: false })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!connectionPrompt.params || !connectionPrompt.target) return;

              try {
                const token = await getAuthToken();
                if (!token) {
                  console.error("Authentication token not available.");
                  return;
                }

                // Step 1: Fetch the manifest for the tool provider.
                // We'll derive the manifest name from the source node's type.
                const sourceNode = getNode(connectionPrompt.params.source!);
                const manifestName = sourceNode?.type === 'google_calendar' ? 'calendar' : sourceNode?.type;
                
                console.log('🔍 [Connection] Fetching manifest:', manifestName);
                const response = await fetch(`http://localhost:8000/manifests/${manifestName}.mcp.json`);
                if (!response.ok) {
                  console.error('❌ [Connection] Failed to fetch manifest:', {
                    status: response.status,
                    statusText: response.statusText,
                    manifestName,
                    url: `http://localhost:8000/manifests/${manifestName}.mcp.json`
                  });
                  throw new Error(`Could not fetch manifest for ${manifestName}`);
                }
                
                console.log('✅ [Connection] Successfully fetched manifest');
                let manifest;
                try {
                  const rawText = await response.text();
                  console.log('📝 [Connection] Raw manifest text:', rawText);
                  manifest = JSON.parse(rawText);
                  console.log('📄 [Connection] Parsed manifest content:', manifest);
                } catch (parseError) {
                  console.error('❌ [Connection] Failed to parse manifest JSON:', parseError);
                  throw new Error(`Failed to parse manifest JSON: ${(parseError as Error).message}`);
                }
                
                const tools = manifest.tools;
                if (!tools) throw new Error(`No 'tools' found in manifest for ${manifestName}`);

                // Step 2: Call the backend to permanently update the Claude node's config.
                const updateResponse = await fetch(`http://localhost:8000/api/nodes/${connectionPrompt.target}/configure-tools`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ tools: tools }),
                });
                
                if (!updateResponse.ok) {
                  const errorData = await updateResponse.json().catch(() => ({}));
                  throw new Error(`Backend failed to update node config: ${errorData.detail || 'Unknown error'}`);
                }
                
                const updatedConfig = await updateResponse.json();
                console.log('✅ [Connection] Node config updated:', updatedConfig);

                // Step 3: Update frontend state with the new config from the backend.
                setNodes((nds) =>
                  nds.map((node) => {
                    if (node.id === connectionPrompt.target) {
                      return {
                        ...node,
                        data: { 
                          ...node.data, 
                          tools: tools,
                          tool_config_id: `${manifestName}-mcp`,
                          config: { tools: tools }
                        },
                      };
                    }
                    return node;
                  })
                );
                
                // Step 4: Add the visual edge to the canvas.
                setEdges((eds) => addEdge({ ...connectionPrompt.params!, animated: true, style: { stroke: '#3b82f6' } }, eds));

                console.log('✅ [Connection] Successfully connected tools');

              } catch (error) {
                console.error("Failed to connect tools:", error);
                // Here you could add a toast notification to inform the user of the error.
              } finally {
                // Step 5: Close the dialog.
                setConnectionPrompt({ isOpen: false });
              }
            }}>
              Connect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )}

  </div>
);
};

export default Index;