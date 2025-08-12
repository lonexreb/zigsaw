import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Sparkles, Activity, Settings, RotateCcw, Save, Send, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { NodeNameHeader } from '../ui/node-name-header';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

interface PromptEnhancementNodeProps {
  id: string;
  data: {
    label: string;
    description: string;
    status: 'idle' | 'running' | 'completed' | 'error';
    inputData?: {
      image1_base64?: string;
      image2_base64?: string;
      prompt?: string;
      metadata?: {
        image1_name?: string;
        image2_name?: string;
        image1_size?: number;
        image2_size?: number;
      };
    };
    outputData?: {
      enhanced_json: object;
      metadata: {
        model: string;
        prompt: string;
        timestamp: string;
      };
    };
    onDataOutput?: (data: any) => void;
    onStatusChange?: (status: 'idle' | 'running' | 'completed' | 'error') => void;
    onOutputDataChange?: (outputData: any) => void;
  };
  selected?: boolean;
}

const groqModels = [
  { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
  { value: 'llama-3.1-405b-reasoning', label: 'Llama 3.1 405B Reasoning' },
  { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
];

// Video Generation JSON Schema Template (from PDF specification)
const DEFAULT_JSON_TEMPLATE = {
  platform_target: "instagram_reel_9x16",
  shot: {
    type: "medium shot with product focus",
    framing: "subject and products clearly visible in 9:16 aspect ratio",
    composition_notes: "both products prominently featured"
  },
  subject: {
    identity: "a person",
    appearance: "clean, modern styling that complements products",
    wardrobe: "clean, modern styling that complements products",
    props: "user uploaded products integrated naturally"
  },
  setting: {
    location: "minimal, modern environment",
    time_of_day: "optimal lighting for product showcase",
    weather: "clear conditions",
    set_dressing: "minimal, clean background"
  },
  color_and_light: {
    palette: "bright, commercial lighting optimized for product visibility",
    key_light: "even, professional lighting",
    fill_rim: "soft fill to eliminate harsh shadows",
    contrast_grain: "clean commercial aesthetic"
  },
  action: {
    blocking: "natural product demonstration and interaction",
    performance: "confident, engaging product presentation",
    beats: [
      { t: "0-2s", event: "establish scene with both products visible" },
      { t: "2-5s", event: "primary product interaction and showcase" },
      { t: "5-8s", event: "secondary product feature with final composition" }
    ],
    loopable: true
  },
  camera: {
    movement: "smooth movement highlighting products",
    lens_look: "sharp focus on products with appealing depth",
    stabilization: "professional steady movement",
    focus: "products remain clearly visible throughout"
  },
  style: {
    genre: "commercial product showcase",
    mood: "polished commercial",
    texture: "polished, professional marketing aesthetic",
    avoid_hyperreal: true
  },
  audio: {
    ambience: ["subtle commercial background"],
    foley: ["natural product interaction sounds"],
    music: "upbeat commercial background music",
    dialogue: "",
    mix_notes: "clear commercial audio mix"
  },
  cinematic_controls: {
    pacing: "dynamic but clear product visibility",
    transitions: "smooth cuts maintaining product focus",
    thumbnail_hint: "select frame with optimal product visibility"
  },
  negatives: [
    "cluttered backgrounds that distract from products",
    "poor product visibility or lighting",
    "fast movements that blur product details",
    "AI artifacts or distortions"
  ],
  notes: {
    duration_hint: "6-8 seconds optimized for Instagram",
    one_shot_only: true,
    priority: "product clarity and commercial appeal"
  }
};

const VIDEO_ENHANCEMENT_SYSTEM_PROMPT = `You are an expert video generation specialist for creating Instagram Reel marketing videos. Your task is to transform user prompts into detailed, structured JSON specifications for Veo3 video generation.

CRITICAL REQUIREMENTS:
1. Output ONLY valid JSON - no other text before or after
2. Always use Instagram Reel 9:16 aspect ratio
3. Focus on product showcase and commercial appeal
4. Keep videos 6-8 seconds for optimal Instagram engagement
5. Ensure both uploaded products are prominently featured

ANALYSIS PROCESS:
1. Extract key subject/style information from the user prompt
2. Determine appropriate mood and aesthetic (professional, casual, luxury, etc.)
3. Set appropriate lighting and setting based on product type
4. Create engaging action beats that showcase both products
5. Add appropriate negatives to avoid common issues

The user has uploaded 2 product images. Incorporate both products naturally into the video specification.

Output the complete JSON specification following the exact structure provided.`;

const PromptEnhancementNode: React.FC<PromptEnhancementNodeProps> = ({ id, data, selected }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [model, setModel] = useState('llama-3.1-8b-instant');
  const [temperature, setTemperature] = useState(0.3);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [systemPrompt, setSystemPrompt] = useState(VIDEO_ENHANCEMENT_SYSTEM_PROMPT);
  const [jsonTemplate, setJsonTemplate] = useState(JSON.stringify(DEFAULT_JSON_TEMPLATE, null, 2));
  const [apiKey, setApiKey] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);
  const [localStatus, setLocalStatus] = useState<'idle' | 'running' | 'completed' | 'error'>(data.status || 'idle');
  const [localOutputData, setLocalOutputData] = useState<any>(data.outputData);
  const [enhancedJson, setEnhancedJson] = useState('');

  // Sync local state with props
  useEffect(() => {
    if (data.status && data.status !== localStatus) {
      setLocalStatus(data.status);
    }
  }, [data.status]);

  useEffect(() => {
    if (data.outputData && data.outputData !== localOutputData) {
      setLocalOutputData(data.outputData);
      if (data.outputData.enhanced_json) {
        setEnhancedJson(JSON.stringify(data.outputData.enhanced_json, null, 2));
      }
    }
  }, [data.outputData]);

  // Load saved API key
  useEffect(() => {
    const savedApiKey = localStorage.getItem('groq_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const getStatusColor = () => {
    switch (localStatus) {
      case 'running': return 'border-blue-400/60 bg-blue-500/10';
      case 'completed': return 'border-green-400/60 bg-green-500/10';
      case 'error': return 'border-red-400/60 bg-red-500/10';
      default: return 'border-orange-400/40 bg-orange-900/20';
    }
  };

  const handleApiKeyChange = useCallback((value: string) => {
    setApiKey(value);
    if (value) {
      localStorage.setItem('groq_api_key', value);
    } else {
      localStorage.removeItem('groq_api_key');
    }
  }, []);

  const buildEnhancementPrompt = () => {
    const inputData = data.inputData;
    let prompt = `JSON Template to customize:\n${jsonTemplate}\n\n`;
    
    if (inputData) {
      prompt += `Context:\n`;
      if (inputData.metadata?.image1_name && inputData.metadata?.image2_name) {
        prompt += `- User uploaded 2 images: "${inputData.metadata.image1_name}" and "${inputData.metadata.image2_name}"\n`;
      }
      if (inputData.prompt) {
        prompt += `- User description: "${inputData.prompt}"\n`;
      }
    }
    
    prompt += `\nGenerate a customized JSON specification for video generation that incorporates the user's requirements while maintaining the exact JSON structure. Output ONLY the JSON.`;
    
    return prompt;
  };

  const handleExecute = useCallback(async () => {
    if (isExecuting || !apiKey) return;
    
    let progressInterval: NodeJS.Timeout | null = null;
    
    try {
      setIsExecuting(true);
      setLocalStatus('running');
      data.onStatusChange?.('running');
      setExecutionProgress(0);
      
      // Start progress animation
      progressInterval = setInterval(() => {
        setExecutionProgress(prev => Math.min(prev + 5, 90));
      }, 500);

      const userPrompt = buildEnhancementPrompt();
      
      const requestBody = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature,
        max_tokens: maxTokens
      };

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
      }

      const responseData = await response.json();
      const content = responseData.choices[0]?.message?.content || '';
      
      // Parse and validate JSON
      let parsedJson;
      try {
        parsedJson = JSON.parse(content);
      } catch (e) {
        throw new Error('Generated content is not valid JSON');
      }

      // Basic validation
      if (!parsedJson.platform_target || !parsedJson.shot || !parsedJson.subject) {
        throw new Error('Generated JSON missing required fields');
      }

      const outputData = {
        enhanced_json: parsedJson,
        metadata: {
          model: responseData.model,
          prompt: data.inputData?.prompt || '',
          timestamp: new Date().toISOString()
        }
      };

      setLocalOutputData(outputData);
      setEnhancedJson(JSON.stringify(parsedJson, null, 2));
      data.onOutputDataChange?.(outputData);
      
      setLocalStatus('completed');
      data.onStatusChange?.('completed');

      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setExecutionProgress(100);
      
      setTimeout(() => {
        setExecutionProgress(0);
        setIsOutputExpanded(true);
      }, 1000);

    } catch (error) {
      console.error('❌ Prompt enhancement failed:', error);
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setLocalStatus('error');
      data.onStatusChange?.('error');
      setExecutionProgress(0);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Enhancement failed: ${errorMessage}`);
    } finally {
      setIsExecuting(false);
    }
  }, [apiKey, model, temperature, maxTokens, systemPrompt, jsonTemplate, data, isExecuting]);

  const handleSendToNext = useCallback(() => {
    if (localOutputData && data.onDataOutput) {
      data.onDataOutput({
        type: 'prompt_enhanced',
        enhanced_json: localOutputData.enhanced_json,
        metadata: localOutputData.metadata,
        timestamp: new Date().toISOString()
      });
    }
  }, [localOutputData, data.onDataOutput]);

  const resetTemplate = () => {
    setJsonTemplate(JSON.stringify(DEFAULT_JSON_TEMPLATE, null, 2));
  };

  return (
    <div 
      className={`bg-gray-900/90 backdrop-blur-xl border-2 rounded-2xl shadow-2xl transition-all duration-300 w-96 ${getStatusColor()} ${
        selected ? 'ring-2 ring-orange-400/50 ring-offset-2 ring-offset-gray-900' : ''
      }`}
    >
      {/* Input Handle */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-orange-500 border-2 border-white/20 hover:bg-orange-400 transition-colors"
      />

      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <NodeNameHeader 
          originalLabel={data.label}
          nodeId={id}
        >
          <Sparkles className="w-5 h-5" />
        </NodeNameHeader>
        <p className="text-gray-300 text-xs mt-1">
          {data.description}
        </p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Input Data Summary */}
        {data.inputData && (
          <div className="p-3 bg-gray-800/50 rounded border border-gray-600">
            <div className="text-xs font-medium text-gray-300 mb-2">Input Data Received:</div>
            <div className="space-y-1 text-xs text-gray-400">
              {data.inputData.metadata?.image1_name && (
                <div>📷 Image 1: {data.inputData.metadata.image1_name}</div>
              )}
              {data.inputData.metadata?.image2_name && (
                <div>📷 Image 2: {data.inputData.metadata.image2_name}</div>
              )}
              {data.inputData.prompt && (
                <div>💬 Prompt: {data.inputData.prompt}</div>
              )}
            </div>
          </div>
        )}

        {/* Configuration Panel */}
        <Collapsible open={showConfig} onOpenChange={setShowConfig}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full flex items-center justify-between text-gray-300 hover:text-white hover:bg-white/5"
            >
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Configuration</span>
              </div>
              {showConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-300 mb-2 block">Model</label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {groqModels.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Temperature: {temperature}
                </label>
                <Slider
                  value={[temperature]}
                  onValueChange={([value]) => setTemperature(value)}
                  max={1}
                  min={0}
                  step={0.1}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Max Tokens</label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full p-2 rounded bg-gray-800/50 border border-gray-600 text-white text-sm"
                  min={500}
                  max={4000}
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-300 mb-2 block">API Key</label>
                <input
                  type="password"
                  placeholder="Enter Groq API key..."
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  className="w-full p-2 rounded bg-gray-800/50 border border-gray-600 text-white text-sm"
                />
              </div>

              <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">JSON Template</label>
                  <Button onClick={resetTemplate} size="sm" variant="ghost" className="text-xs">
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                </div>
                <Textarea
                  value={jsonTemplate}
                  onChange={(e) => setJsonTemplate(e.target.value)}
                  placeholder="JSON template structure..."
                  className="bg-gray-800/50 border-gray-600 text-white text-xs font-mono h-32 resize-none"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Progress */}
        {executionProgress > 0 && (
          <div className="space-y-1">
            <Progress value={executionProgress} className="h-1" />
            <p className="text-xs text-gray-400 text-right">{executionProgress}%</p>
          </div>
        )}

        {/* Execute Button */}
        <Button
          onClick={handleExecute}
          disabled={!apiKey || !data.inputData || localStatus === 'running'}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white"
        >
          {localStatus === 'running' ? (
            <>
              <Activity className="w-4 h-4 mr-2 animate-spin" />
              Enhancing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Enhance Prompt
            </>
          )}
        </Button>

        {/* Enhanced JSON Output */}
        {localOutputData && (
          <Collapsible open={isOutputExpanded} onOpenChange={setIsOutputExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between text-gray-300">
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Enhanced JSON
                </span>
                {isOutputExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-2">
              <div className="space-y-3">
                <Textarea
                  value={enhancedJson}
                  onChange={(e) => {
                    setEnhancedJson(e.target.value);
                    try {
                      const parsed = JSON.parse(e.target.value);
                      const updatedOutput = {
                        ...localOutputData,
                        enhanced_json: parsed
                      };
                      setLocalOutputData(updatedOutput);
                      data.onOutputDataChange?.(updatedOutput);
                    } catch (e) {
                      // Invalid JSON, don't update
                    }
                  }}
                  className="bg-gray-800/50 border-gray-600 text-white text-xs font-mono h-48 resize-none"
                  placeholder="Enhanced JSON will appear here..."
                />
                
                <Button
                  onClick={handleSendToNext}
                  disabled={!data.onDataOutput}
                  className="w-full bg-green-600 hover:bg-green-500 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send to Veo3
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {/* Output Handle */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-orange-500 border-2 border-white/20 hover:bg-orange-400 transition-colors"
      />
    </div>
  );
};

export default PromptEnhancementNode;
