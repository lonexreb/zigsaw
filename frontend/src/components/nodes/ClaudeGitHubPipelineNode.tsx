import React, { useState, useCallback } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Progress } from "../ui/progress";
import { 
  Send, 
  ChevronDown, 
  ChevronUp,
  User,
  Bot,
  Github,
  Brain,
  Cog,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Key,
  MessageSquare,
  Activity
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import logoImage from "../../assets/logo.png";

interface ClaudeGitHubPipelineNodeProps extends NodeProps {
  data: {
    query?: string;
  };
}

interface PipelineStep {
  id: string;
  name: string;
  description: string;
  detailedStatus: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
  executionTime?: number;
  error?: string;
  progress?: number;
  substeps?: string[];
  currentSubstep?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface PipelineResult {
  success: boolean;
  query: string;
  results: {
    step1: { result: any; executionTime: number };
    step2: { result: any; executionTime: number };
    step3: { result: any; executionTime: number };
  };
  totalExecutionTime: number;
  summary: {
    intent: string;
    confidence: number;
    operation: string;
    analysisSuccess: boolean;
    codeQualityScore?: number;
    recommendations: number;
    suggestedActions: string;
  };
}

export function ClaudeGitHubPipelineNode({ id, data, selected }: ClaudeGitHubPipelineNodeProps) {
  const { toast } = useToast();
  
  // Form state
  const [query, setQuery] = useState(data.query || "");
  const [anthropicApiKey, setAnthropicApiKey] = useState("");
  const [githubPat, setGithubPat] = useState("");
  const [showApiKeys, setShowApiKeys] = useState(false);
  
  // Pipeline state
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([
    {
      id: 'step1',
      name: 'Analyzing your query',
      description: 'Getting intent...',
      detailedStatus: 'Waiting to start...',
      status: 'pending',
      progress: 0,
      substeps: [
        'Initializing Claude connection',
        'Sending query to Claude API',
        'Processing natural language',
        'Extracting intent and confidence',
        'Identifying parameters',
        'Validating parsed results'
      ],
      icon: Brain
    },
    {
      id: 'step2',
      name: 'GitHub MCP',
      description: 'Executing GitHub operations',
      detailedStatus: 'Waiting for Step 1...',
      status: 'pending',
      progress: 0,
      substeps: [
        'Connecting to GitHub API',
        'Authenticating with PAT',
        'Analyzing repository structure',
        'Fetching repository metadata',
        'Executing targeted operations',
        'Collecting data and files'
      ],
      icon: Github
    },
    {
      id: 'step3',
      name: 'AI Analysis',
      description: 'Analyzing results and generating insights',
      detailedStatus: 'Waiting for previous steps...',
      status: 'pending',
      progress: 0,
      substeps: [
        'Processing collected data',
        'Initializing AI analysis',
        'Running code quality models',
        'Analyzing patterns and structure',
        'Generating insights',
        'Creating recommendations',
        'Formatting final results'
      ],
      icon: Cog
    }
  ]);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  
  // UI state
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}>>([]);

  const resetPipeline = useCallback(() => {
    setPipelineSteps(prev => prev.map((step, index) => ({ 
      ...step, 
      status: 'pending', 
      detailedStatus: index === 0 ? 'Waiting to start...' : `Waiting for Step ${index}...`,
      result: undefined, 
      executionTime: undefined, 
      error: undefined,
      progress: 0,
      currentSubstep: undefined
    })));
    setPipelineProgress(0);
    setCurrentStep(0);
    setPipelineResult(null);
  }, []);

  const updateStepStatus = useCallback((stepIndex: number, status: PipelineStep['status'], result?: any, executionTime?: number, error?: string, detailedStatus?: string, progress?: number, currentSubstep?: string) => {
    setPipelineSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { 
        ...step, 
        status, 
        result, 
        executionTime, 
        error,
        detailedStatus: detailedStatus || step.detailedStatus,
        progress: progress !== undefined ? progress : step.progress,
        currentSubstep
      } : step
    ));
  }, []);

  const updateStepProgress = useCallback(async (stepIndex: number, substepIndex: number, message: string) => {
    const step = pipelineSteps[stepIndex];
    if (!step?.substeps) return;

    const progress = ((substepIndex + 1) / step.substeps.length) * 100;
    
    updateStepStatus(
      stepIndex,
      'running',
      undefined,
      undefined,
      undefined,
      message,
      progress,
      step.substeps[substepIndex]
    );
    
    // Update overall pipeline progress
    const baseProgress = stepIndex * 33.33;
    const stepProgress = (progress / 100) * 33.33;
    setPipelineProgress(Math.min(baseProgress + stepProgress, 100));
    
    // Small delay for smooth animation
    await new Promise(resolve => setTimeout(resolve, 200));
  }, [pipelineSteps, updateStepStatus]);

  const executeStep1 = useCallback(async (query: string, anthropicApiKey: string) => {
    await updateStepProgress(0, 0, 'Initializing Claude connection...');
    await updateStepProgress(0, 1, 'Sending query to Claude API...');
    
    const response = await fetch('http://localhost:8000/api/pipeline/step1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, anthropicApiKey })
    });

    await updateStepProgress(0, 2, 'Processing natural language...');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Step 1 failed: ${response.status}`);
    }

    const result = await response.json();
    await updateStepProgress(0, 3, 'Extracting intent and confidence...');
    await updateStepProgress(0, 4, 'Identifying parameters...');
    await updateStepProgress(0, 5, 'Validating parsed results...');
    
    return result;
  }, [updateStepProgress]);

  const executeStep2 = useCallback(async (queryIntent: any, githubPat: string) => {
    await updateStepProgress(1, 0, 'Connecting to GitHub API...');
    await updateStepProgress(1, 1, 'Authenticating with PAT...');
    await updateStepProgress(1, 2, 'Analyzing repository structure...');
    
    const response = await fetch('http://localhost:8000/api/pipeline/step2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queryIntent, githubPat })
    });

    await updateStepProgress(1, 3, 'Fetching repository metadata...');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Step 2 failed: ${response.status}`);
    }

    const result = await response.json();
    await updateStepProgress(1, 4, 'Executing targeted operations...');
    await updateStepProgress(1, 5, 'Collecting data and files...');
    
    return result;
  }, [updateStepProgress]);

  const executeStep3 = useCallback(async (queryIntent: any, mcpResult: any, anthropicApiKey: string, githubPat: string) => {
    await updateStepProgress(2, 0, 'Processing collected data...');
    await updateStepProgress(2, 1, 'Initializing AI analysis...');
    await updateStepProgress(2, 2, 'Running code quality models...');
    
    const response = await fetch('http://localhost:8000/api/pipeline/step3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queryIntent, mcpResult, anthropicApiKey, githubPat })
    });

    await updateStepProgress(2, 3, 'Analyzing patterns and structure...');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Step 3 failed: ${response.status}`);
    }

    const result = await response.json();
    await updateStepProgress(2, 4, 'Generating insights...');
    await updateStepProgress(2, 5, 'Creating recommendations...');
    await updateStepProgress(2, 6, 'Formatting final results...');
    
    return result;
  }, [updateStepProgress]);

  const formatAnalysisForChat = useCallback((result: PipelineResult): string => {
    const { summary, results } = result;
    const analysis = results.step3.result.analysis;
    
    let content = `🎯 **Analysis Complete!**\n\n`;
    content += `**Intent:** ${summary.intent}\n`;
    content += `**Confidence:** ${(summary.confidence * 100).toFixed(1)}%\n`;
    content += `**Operation:** ${summary.operation}\n\n`;
    
    if (analysis?.summary) {
      content += `📝 **Summary:**\n${analysis.summary}\n\n`;
    }
    
    if (analysis?.codeQuality) {
      content += `⭐ **Code Quality Score:** ${analysis.codeQuality.score}/10\n\n`;
      
      if (analysis.codeQuality.strengths?.length > 0) {
        content += `💪 **Strengths:**\n`;
        analysis.codeQuality.strengths.forEach((strength: string) => {
          content += `• ${strength}\n`;
        });
        content += `\n`;
      }
      
      if (analysis.codeQuality.weaknesses?.length > 0) {
        content += `⚠️ **Areas for Improvement:**\n`;
        analysis.codeQuality.weaknesses.forEach((weakness: string) => {
          content += `• ${weakness}\n`;
        });
        content += `\n`;
      }
    }
    
    if (analysis?.recommendations?.length > 0) {
      content += `💡 **Recommendations:**\n`;
      analysis.recommendations.forEach((rec: string, index: number) => {
        content += `${index + 1}. ${rec}\n`;
      });
      content += `\n`;
    }
    
    if (results.step3.result.actions) {
      content += `🎬 **Suggested Action:** ${results.step3.result.actions.type}\n`;
    }
    
    content += `\n⏱️ **Total Time:** ${result.totalExecutionTime}ms`;
    
    return content;
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!query.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a GitHub query to analyze",
        variant: "destructive"
      });
      return;
    }

    if (!anthropicApiKey.trim()) {
      toast({
        title: "Anthropic API Key Required",
        description: "Please enter your Anthropic API key",
        variant: "destructive"
      });
      setShowApiKeys(true);
      return;
    }

    if (!githubPat.trim()) {
      toast({
        title: "GitHub PAT Required",
        description: "Please enter your GitHub Personal Access Token",
        variant: "destructive"
      });
      setShowApiKeys(true);
      return;
    }

    setIsPipelineRunning(true);
    resetPipeline();
    
    try {
      // Add user message to chat history
      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user' as const,
        content: query,
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, userMessage]);
      
      console.log('🚀 Starting real-time pipeline execution...');
      
      // Execute Step 1: NLP Parsing
      setCurrentStep(0);
      updateStepStatus(0, 'running', undefined, undefined, undefined, 'Starting Step 1...', 0);
      
      const step1StartTime = Date.now();
      const step1Result = await executeStep1(query, anthropicApiKey);
      const step1Duration = Date.now() - step1StartTime;
      
      if (!step1Result.success) {
        throw new Error(`Step 1 failed: ${step1Result.error}`);
      }

      // Complete Step 1 with check mark animation
      updateStepStatus(0, 'completed', step1Result.result, step1Duration, undefined, '✅ Natural language parsing completed', 100);
      setPipelineProgress(33);
      await new Promise(resolve => setTimeout(resolve, 500)); // Pause to show completion
      
      // Execute Step 2: GitHub MCP
      setCurrentStep(1);
      updateStepStatus(1, 'running', undefined, undefined, undefined, 'Starting Step 2...', 0);
      
      const step2StartTime = Date.now();
      const step2Result = await executeStep2(step1Result.result, githubPat);
      const step2Duration = Date.now() - step2StartTime;
      
      if (!step2Result.success) {
        throw new Error(`Step 2 failed: ${step2Result.error}`);
      }

      // Complete Step 2 with check mark animation
      updateStepStatus(1, 'completed', step2Result.result, step2Duration, undefined, '✅ GitHub operations completed', 100);
      setPipelineProgress(66);
      await new Promise(resolve => setTimeout(resolve, 500)); // Pause to show completion
      
      // Execute Step 3: AI Analysis
      setCurrentStep(2);
      updateStepStatus(2, 'running', undefined, undefined, undefined, 'Starting Step 3...', 0);
      
      const step3StartTime = Date.now();
      const step3Result = await executeStep3(step1Result.result, step2Result.result, anthropicApiKey, githubPat);
      const step3Duration = Date.now() - step3StartTime;
      
      if (!step3Result.success) {
        throw new Error(`Step 3 failed: ${step3Result.error}`);
      }

      // Complete Step 3 with check mark animation
      updateStepStatus(2, 'completed', step3Result.result, step3Duration, undefined, '✅ AI analysis completed', 100);
      setPipelineProgress(100);
      
      // Build the final result
      const finalResult: PipelineResult = {
        success: true,
        query,
        results: {
          step1: { result: step1Result.result, executionTime: step1Duration },
          step2: { result: step2Result.result, executionTime: step2Duration },
          step3: { result: step3Result.result, executionTime: step3Duration }
        },
        totalExecutionTime: step1Duration + step2Duration + step3Duration,
        summary: {
          intent: step1Result.result.intent || 'UNKNOWN',
          confidence: step1Result.result.confidence || 0,
          operation: step2Result.result.operation || 'unknown',
          analysisSuccess: true,
          codeQualityScore: step3Result.result.analysis?.codeQuality?.score,
          recommendations: step3Result.result.analysis?.recommendations?.length || 0,
          suggestedActions: step3Result.result.actions?.type || 'none'
        }
      };
        
        setPipelineResult(finalResult);
        
        // Add AI response to chat history
        const analysisContent = formatAnalysisForChat(finalResult);
        const aiResponse = {
          id: `assistant-${Date.now()}`,
          role: 'assistant' as const,
          content: analysisContent,
          timestamp: new Date()
        };
        
        setChatHistory(prev => [...prev, aiResponse]);
        
        toast({
          title: "🎉 Pipeline Completed Successfully",
          description: `Analysis complete! Quality score: ${finalResult.summary.codeQualityScore || 'N/A'}/10`,
          variant: "default"
        });

      // Clear the query input
      setQuery("");

    } catch (error) {
      console.error('Pipeline failed:', error);
      
      // Mark current step as error
      updateStepStatus(currentStep, 'error', undefined, undefined, error instanceof Error ? error.message : 'Unknown error');
      
      const errorResponse = {
        id: `assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: `❌ Pipeline failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, errorResponse]);
      
      toast({
        title: "Pipeline Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsPipelineRunning(false);
    }
  }, [query, anthropicApiKey, githubPat, toast, currentStep, resetPipeline, updateStepStatus, formatAnalysisForChat]);

  return (
    <Card className={`
      w-[500px] transition-all duration-200 backdrop-blur-sm
      ${selected ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-200/50' : 'shadow-md'}
      ${isPipelineRunning ? 'ring-2 ring-orange-400 shadow-orange-300/50' : ''}
      bg-gradient-to-br from-orange-50/95 to-white/95 
      border-orange-200/80 hover:shadow-lg hover:shadow-orange-100/50
    `}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-orange-500 border-2 border-white shadow-sm"
      />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-white border border-orange-300/40 shadow-sm">
              <img 
                src={logoImage} 
                alt="Claude Logo" 
                className="h-6 w-6 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<div class="h-6 w-6 bg-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold">C</div>';
                }}
              />
            </div>
            <div>
              <h3 className="font-bold text-lg bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                Claude Agent
              </h3>
              <div className="flex items-center space-x-2">
                <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs ${
                  anthropicApiKey && githubPat 
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <div className={`h-2 w-2 rounded-full ${
                    anthropicApiKey && githubPat ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span>{anthropicApiKey && githubPat ? 'Keys Set' : 'Keys Missing'}</span>
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 h-8 w-8 text-orange-600 hover:bg-orange-100"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-3">
        <div className="space-y-4">
          {/* API Keys Section */}
          <Collapsible open={showApiKeys} onOpenChange={setShowApiKeys}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-8 text-sm bg-orange-50 border-orange-200 hover:bg-orange-100">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-orange-600" />
                  API Credentials
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${showApiKeys ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Anthropic API Key</Label>
                <Input
                  type="password"
                  placeholder="sk-ant-..."
                  value={anthropicApiKey}
                  onChange={(e) => setAnthropicApiKey(e.target.value)}
                  className="bg-white/90 border-orange-200 focus:border-orange-400 focus:ring-orange-400/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">GitHub Personal Access Token</Label>
                <Input
                  type="password"
                  placeholder="ghp_..."
                  value={githubPat}
                  onChange={(e) => setGithubPat(e.target.value)}
                  className="bg-white/90 border-orange-200 focus:border-orange-400 focus:ring-orange-400/20"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Query Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2 text-gray-700">
              <User className="h-4 w-4 text-orange-600" />
              GitHub Query
            </Label>
            <Textarea
              placeholder="Make a PR to fix the bug in the most recent issue of head of main branch of repo _______.. "
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[80px] resize-none bg-white/90 border-orange-200 focus:border-orange-400 focus:ring-orange-400/20"
              disabled={isPipelineRunning}
            />
          </div>

          {/* Pipeline Progress */}
          {(isPipelineRunning || pipelineResult) && (
            <div className="space-y-4 p-4 bg-gradient-to-br from-orange-50/80 to-orange-100/30 rounded-xl border border-orange-200 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-orange-900 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Pipeline Progress
                </h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${
                    isPipelineRunning 
                      ? 'bg-orange-100 text-orange-700 border-orange-300' 
                      : 'bg-green-100 text-green-700 border-green-300'
                  }`}>
                    {isPipelineRunning ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Running
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </>
                    )}
                  </Badge>
                  <span className="text-sm font-medium text-orange-700">
                    {Math.round(pipelineProgress)}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  <Progress value={pipelineProgress} className="h-4 transition-all duration-500 ease-out" />
                  {pipelineProgress > 5 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold text-white drop-shadow-sm">
                        {Math.round(pipelineProgress)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">
                    Overall Progress
                  </span>
                  <span className="font-bold text-orange-700">
                    {Math.round(pipelineProgress)}% Complete
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                {pipelineSteps.map((step, index) => (
                  <div key={step.id} className={`p-3 rounded-lg border transition-all duration-300 ${
                    step.status === 'running' 
                      ? 'bg-white border-orange-300 shadow-md ring-1 ring-orange-200' 
                      : step.status === 'completed'
                      ? 'bg-green-50/50 border-green-200'
                      : step.status === 'error'
                      ? 'bg-red-50/50 border-red-200'
                      : 'bg-gray-50/50 border-gray-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0 mt-0.5">
                        <div className={`p-2 rounded-lg ${
                          step.status === 'completed' ? 'bg-green-100' :
                          step.status === 'running' ? 'bg-orange-100' :
                          step.status === 'error' ? 'bg-red-100' :
                          'bg-gray-100'
                        }`}>
                          <step.icon className={`h-5 w-5 ${
                            step.status === 'completed' ? 'text-green-600' :
                            step.status === 'running' ? 'text-orange-600' :
                            step.status === 'error' ? 'text-red-600' :
                            'text-gray-400'
                          }`} />
                        </div>
                        
                        {step.status === 'running' && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 bg-orange-500 rounded-full flex items-center justify-center animate-pulse shadow-lg ring-2 ring-orange-300">
                            <Loader2 className="h-2.5 w-2.5 animate-spin text-white" />
                          </div>
                        )}
                        {step.status === 'completed' && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center animate-bounce shadow-lg ring-2 ring-green-300 transition-all duration-300">
                            <CheckCircle className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                        {step.status === 'error' && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-lg ring-2 ring-red-300">
                            <XCircle className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-semibold text-sm text-gray-900">
                            Step {index + 1}: {step.name}
                          </div>
                          {step.executionTime && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                              {step.executionTime}ms
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-600 mb-2">
                          {step.description}
                        </div>
                        
                        <div className={`text-sm font-medium mb-2 ${
                          step.status === 'completed' ? 'text-green-700' :
                          step.status === 'running' ? 'text-orange-700' :
                          step.status === 'error' ? 'text-red-700' :
                          'text-gray-500'
                        }`}>
                          {step.detailedStatus}
                        </div>
                        
                        {step.status === 'running' && step.progress !== undefined && (
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <Progress value={step.progress} className="h-2 transition-all duration-300 ease-out" />
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">
                                  {step.currentSubstep && `${step.currentSubstep}`}
                                </span>
                                <span className="font-medium text-orange-600">
                                  {Math.round(step.progress || 0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {step.error && (
                          <div className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded border border-red-200">
                            ❌ {step.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Send Button */}
          <div className="flex justify-end gap-2">
            {pipelineResult && (
              <Button
                variant="outline"
                onClick={() => setIsExpanded(true)}
                className="bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
                size="lg"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            )}
            <Button
              onClick={handleSendMessage}
              disabled={isPipelineRunning || !query.trim() || !anthropicApiKey.trim() || !githubPat.trim()}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm"
              size="lg"
            >
              {isPipelineRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Running Pipeline...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Expanded Details Section */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <div className="px-6 pb-6">
            <Separator className="mb-4" />
            
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-orange-50 border border-orange-200">
                <TabsTrigger value="chat" className="data-[state=active]:bg-white data-[state=active]:text-orange-700">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="results" className="data-[state=active]:bg-white data-[state=active]:text-orange-700">
                  <Activity className="h-4 w-4 mr-2" />
                  Results
                </TabsTrigger>
              </TabsList>

              {/* Chat Tab */}
              <TabsContent value="chat" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Chat History</h4>
                    <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                      {chatHistory.length} messages
                    </Badge>
                  </div>
                  
                  <ScrollArea className="h-96 w-full border border-orange-200 rounded-lg bg-white">
                    <div className="p-4 space-y-4">
                      {chatHistory.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No messages yet. Send a query to start!</p>
                        </div>
                      ) : (
                        chatHistory.map((message) => (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${
                              message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                message.role === 'user'
                                  ? 'bg-orange-500 text-white ml-auto'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {message.role === 'user' ? (
                                  <User className="h-4 w-4" />
                                ) : (
                                  <Bot className="h-4 w-4" />
                                )}
                                <span className="text-xs font-medium">
                                  {message.role === 'user' ? 'You' : 'Claude'}
                                </span>
                                <span className="text-xs opacity-70">
                                  {message.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="whitespace-pre-wrap text-sm">
                                {message.content}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Results Tab */}
              <TabsContent value="results" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Pipeline Results</h4>
                    {pipelineResult && (
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        ✅ Completed
                      </Badge>
                    )}
                  </div>
                  
                  {pipelineResult ? (
                    <div className="space-y-6">
                      {/* Summary */}
                      <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                        <h5 className="font-semibold text-orange-900 mb-3">Analysis Summary</h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Intent:</span>
                            <span className="ml-2 text-gray-900">{pipelineResult.summary.intent}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Confidence:</span>
                            <span className="ml-2 text-gray-900">{(pipelineResult.summary.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Operation:</span>
                            <span className="ml-2 text-gray-900">{pipelineResult.summary.operation}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Quality Score:</span>
                            <span className="ml-2 text-gray-900">
                              {pipelineResult.summary.codeQualityScore || 'N/A'}/10
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Step Results */}
                      <div className="space-y-4">
                        {Object.entries(pipelineResult.results).map(([stepKey, stepData], index) => (
                          <Collapsible key={stepKey}>
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded bg-orange-100">
                                  {index === 0 && <Brain className="h-4 w-4 text-orange-600" />}
                                  {index === 1 && <Github className="h-4 w-4 text-orange-600" />}
                                  {index === 2 && <Cog className="h-4 w-4 text-orange-600" />}
                                </div>
                                <div>
                                  <div className="font-medium text-left">
                                    Step {index + 1}: {
                                      index === 0 ? 'Understanding your query' :
                                      index === 1 ? 'GitHub MCP' : 'AI Analysis'
                                    }
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {stepData.executionTime}ms
                                  </div>
                                </div>
                              </div>
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="p-4 bg-gray-50 border-l border-r border-b border-gray-200 rounded-b-lg">
                              <pre className="text-xs overflow-auto max-h-48 bg-white p-3 rounded border">
                                {JSON.stringify(stepData.result, null, 2)}
                              </pre>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No results yet. Run the pipeline to see analysis results!</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-orange-500 border-2 border-white shadow-sm"
      />
    </Card>
  );
} 