import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Video, Activity, Send, X, Eye, ChevronDown, ChevronUp, Settings, Sparkles } from 'lucide-react';
import { NodeNameHeader } from '../ui/node-name-header';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { veo3Service, Veo3Request } from '@/services/veo3Service';

interface Veo3NodeProps {
  id: string;
  data: {
    label: string;
    description: string;
    status: 'idle' | 'running' | 'completed' | 'error';
    inputData?: {
      prompt?: string;
      text?: string;
    };
    outputData?: {
      video_url: string;
      metadata: {
        prompt: string;
        enhance_prompt?: boolean;
        negative_prompt?: string;
        seed?: number;
      };
    };
    onDataOutput?: (data: any) => void;
    onStatusChange?: (status: 'idle' | 'running' | 'completed' | 'error') => void;
    onOutputDataChange?: (outputData: any) => void;
  };
  selected?: boolean;
}

const Veo3Node: React.FC<Veo3NodeProps> = ({ id, data, selected }) => {
  const [prompt, setPrompt] = useState('');
  const [enhancePrompt, setEnhancePrompt] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [showPreview, setShowPreview] = useState(false);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [localStatus, setLocalStatus] = useState<'idle' | 'running' | 'completed' | 'error'>(data.status || 'idle');
  const [localOutputData, setLocalOutputData] = useState<any>(data.outputData);

  // Sync local state with props
  useEffect(() => {
    if (data.status && data.status !== localStatus) {
      setLocalStatus(data.status);
    }
  }, [data.status]);

  useEffect(() => {
    if (data.outputData && data.outputData !== localOutputData) {
      setLocalOutputData(data.outputData);
    }
  }, [data.outputData]);

  // Handle incoming data from connected nodes
  useEffect(() => {
    if (data.inputData) {
      if (data.inputData.prompt) {
        setPrompt(data.inputData.prompt);
      } else if (data.inputData.text) {
        setPrompt(data.inputData.text);
      }
    }
  }, [data.inputData]);

  const getStatusColor = () => {
    switch (localStatus) {
      case 'running': return 'border-blue-400/60 bg-blue-500/10';
      case 'completed': return 'border-green-400/60 bg-green-500/10';
      case 'error': return 'border-red-400/60 bg-red-500/10';
      default: return 'border-orange-400/40 bg-orange-900/20';
    }
  };

  const handleGenerateAndSend = useCallback(async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt for video generation');
      return;
    }

    setLocalStatus('running');
    data.onStatusChange?.('running');

    try {
      const request: Veo3Request = {
        prompt: prompt.trim(),
        enhance_prompt: enhancePrompt,
        negative_prompt: negativePrompt.trim() || undefined,
        seed: seed
      };

      const result = await veo3Service.generateVideo(request);

      const outputData = {
        video_url: result.video_url,
        metadata: {
          prompt: request.prompt,
          enhance_prompt: request.enhance_prompt,
          negative_prompt: request.negative_prompt,
          seed: request.seed,
        }
      };

      setLocalOutputData(outputData);
      data.onOutputDataChange?.(outputData);

      // Send data to next node
      if (data.onDataOutput) {
        data.onDataOutput({
          type: 'video_generated',
          video_url: result.video_url,
          prompt: request.prompt,
          metadata: outputData.metadata,
          timestamp: new Date().toISOString()
        });
      }

      setLocalStatus('completed');
      data.onStatusChange?.('completed');

    } catch (error) {
      setLocalStatus('error');
      data.onStatusChange?.('error');
      console.error('Video generation error:', error);
      alert(`Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [prompt, enhancePrompt, negativePrompt, seed, data]);

  const handleSeedChange = (value: string) => {
    if (value === '') {
      setSeed(undefined);
    } else {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        setSeed(numValue);
      }
    }
  };

  return (
    <div 
      className={`bg-gray-900/90 backdrop-blur-xl border-2 rounded-2xl shadow-2xl transition-all duration-300 w-80 ${getStatusColor()} ${
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
          <Video className="w-5 h-5" />
        </NodeNameHeader>
        <p className="text-gray-300 text-xs mt-1">
          {data.description}
        </p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 block">
            Video Prompt
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the video you want to generate with Google's Veo-3 model. Example: 'A serene lake at sunset with gentle waves and flying birds'"
            className="bg-gray-800/50 border-gray-600 text-white min-h-20 resize-none"
            disabled={localStatus === 'running'}
          />
          <div className="text-xs text-gray-400">
            {prompt.length}/2000 characters
          </div>
        </div>

        {/* Configuration Panel */}
        <Collapsible open={isConfigExpanded} onOpenChange={setIsConfigExpanded}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full flex items-center justify-between text-gray-300 hover:text-white hover:bg-white/5"
            >
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Video Settings</span>
              </div>
              {isConfigExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enhance-prompt"
                checked={enhancePrompt}
                onCheckedChange={(checked) => setEnhancePrompt(checked as boolean)}
              />
              <label htmlFor="enhance-prompt" className="text-sm font-medium text-gray-300">
                Enhance prompt with Gemini
              </label>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Negative Prompt (optional)
              </label>
              <Textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Describe what to discourage in the video..."
                className="bg-gray-800/50 border-gray-600 text-white min-h-16 resize-none"
                disabled={localStatus === 'running'}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Seed (optional)
              </label>
              <Input
                value={seed?.toString() || ''}
                onChange={(e) => handleSeedChange(e.target.value)}
                placeholder="Random seed for reproducible results"
                className="bg-gray-800/50 border-gray-600 text-white"
                disabled={localStatus === 'running'}
                type="number"
              />
              <div className="text-xs text-gray-400 mt-1">
                Leave empty for random generation
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={handleGenerateAndSend}
            disabled={!prompt.trim() || localStatus === 'running'}
            className="flex-1 bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {localStatus === 'running' ? 'Generating...' : 'Generate & Send'}
          </Button>

          {localOutputData && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              className="border-gray-600 text-gray-300 hover:text-white hover:bg-white/5"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Status Indicator */}
        {localStatus !== 'idle' && (
          <div className="flex items-center space-x-2 text-sm">
            <Activity className={`w-4 h-4 ${
              localStatus === 'running' ? 'text-blue-400 animate-pulse' :
              localStatus === 'completed' ? 'text-green-400' : 'text-red-400'
            }`} />
            <span className={`${
              localStatus === 'running' ? 'text-blue-300' :
              localStatus === 'completed' ? 'text-green-300' : 'text-red-300'
            }`}>
              {localStatus === 'running' ? 'Generating video...' :
               localStatus === 'completed' ? 'Video generated successfully' : 'Generation failed'}
            </span>
          </div>
        )}

        {/* Output Preview */}
        {localOutputData && (
          <Collapsible open={isOutputExpanded} onOpenChange={setIsOutputExpanded}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full flex items-center justify-between text-gray-300 hover:text-white hover:bg-white/5"
              >
                <span>Generated Video</span>
                {isOutputExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-600 space-y-2">
                <div className="text-xs text-gray-400 grid grid-cols-2 gap-2">
                  <div>Enhanced: {localOutputData.metadata?.enhance_prompt ? 'Yes' : 'No'}</div>
                  <div>Seed: {localOutputData.metadata?.seed || 'Random'}</div>
                </div>
                <div className="aspect-video bg-gray-900/50 rounded overflow-hidden">
                  <video 
                    src={localOutputData.video_url} 
                    controls
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm" style={{display: 'none'}}>
                    Failed to load video
                  </div>
                </div>
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

      {/* Preview Modal */}
      {showPreview && localOutputData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-600 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center space-x-2">
                <Video className="w-5 h-5" />
                <span>Generated Video</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400">Enhanced Prompt</div>
                  <div className="text-white">{localOutputData.metadata?.enhance_prompt ? 'Yes' : 'No'}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400">Seed</div>
                  <div className="text-white">{localOutputData.metadata?.seed || 'Random'}</div>
                </div>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-2">Prompt:</div>
                <div className="text-white text-sm">
                  {localOutputData.metadata?.prompt}
                </div>
              </div>

              {localOutputData.metadata?.negative_prompt && (
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-2">Negative Prompt:</div>
                  <div className="text-white text-sm">
                    {localOutputData.metadata.negative_prompt}
                  </div>
                </div>
              )}
              
              <div className="flex justify-center">
                <video 
                  src={localOutputData.video_url} 
                  controls
                  className="max-w-full max-h-96 rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Veo3Node;