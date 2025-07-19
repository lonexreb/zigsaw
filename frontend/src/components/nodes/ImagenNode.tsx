import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Image, Activity, X, Eye, ChevronDown, ChevronUp, Settings, Sparkles } from 'lucide-react';
import { NodeNameHeader } from '../ui/node-name-header';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { imagenService, ImagenRequest } from '@/services/imagenService';

interface ImagenNodeProps {
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
      image_url: string;
      metadata: {
        prompt: string;
        aspect_ratio: string;
        safety_filter_level: string;
        output_format: string;
      };
    };
    onDataOutput?: (data: any) => void;
    onStatusChange?: (status: 'idle' | 'running' | 'completed' | 'error') => void;
    onOutputDataChange?: (outputData: any) => void;
  };
  selected?: boolean;
}

const ImagenNode: React.FC<ImagenNodeProps> = ({ id, data, selected }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [safetyFilterLevel, setSafetyFilterLevel] = useState('block_medium_and_above');
  const [outputFormat, setOutputFormat] = useState('png');
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
      default: return 'border-pink-400/40 bg-pink-900/20';
    }
  };

  const handleGenerateAndSend = useCallback(async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt for image generation');
      return;
    }

    setLocalStatus('running');
    data.onStatusChange?.('running');

    try {
      const request: ImagenRequest = {
        prompt: prompt.trim(),
        aspect_ratio: aspectRatio,
        safety_filter_level: safetyFilterLevel,
        output_format: outputFormat
      };

      const result = await imagenService.generateImage(request);

      const outputData = {
        image_url: result.image_url,
        metadata: {
          prompt: result.prompt,
          aspect_ratio: result.aspect_ratio,
          safety_filter_level: result.safety_filter_level,
          output_format: result.output_format,
        }
      };

      setLocalOutputData(outputData);
      data.onOutputDataChange?.(outputData);

      // Send data to next node
      if (data.onDataOutput) {
        data.onDataOutput({
          type: 'image_generated',
          image_url: result.image_url,
          prompt: result.prompt,
          metadata: outputData.metadata,
          timestamp: new Date().toISOString()
        });
      }

      setLocalStatus('completed');
      data.onStatusChange?.('completed');

    } catch (error) {
      setLocalStatus('error');
      data.onStatusChange?.('error');
      console.error('Image generation error:', error);
      alert(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [prompt, aspectRatio, safetyFilterLevel, outputFormat, data]);

  const aspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '4:3', label: 'Landscape (4:3)' },
    { value: '3:4', label: 'Portrait (3:4)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '9:16', label: 'Vertical (9:16)' },
    { value: '3:2', label: 'Classic (3:2)' },
    { value: '2:3', label: 'Classic Portrait (2:3)' },
    { value: '21:9', label: 'Ultra Wide (21:9)' },
    { value: '9:21', label: 'Ultra Tall (9:21)' },
  ];

  const safetyLevels = [
    { value: 'block_low_and_above', label: 'Strict (Block Low+)' },
    { value: 'block_medium_and_above', label: 'Moderate (Block Medium+)' },
    { value: 'block_only_high', label: 'Permissive (Block High Only)' },
  ];

  const outputFormats = [
    { value: 'png', label: 'PNG' },
    { value: 'jpg', label: 'JPG' },
    { value: 'webp', label: 'WebP' },
  ];

  return (
    <div 
      className={`bg-gray-900/90 backdrop-blur-xl border-2 rounded-2xl shadow-2xl transition-all duration-300 w-80 ${getStatusColor()} ${
        selected ? 'ring-2 ring-pink-400/50 ring-offset-2 ring-offset-gray-900' : ''
      }`}
    >
      {/* Input Handle */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-pink-500 border-2 border-white/20 hover:bg-pink-400 transition-colors"
      />

      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <NodeNameHeader 
          originalLabel={data.label}
          nodeId={id}
        >
          <Image className="w-5 h-5" />
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
            Image Prompt
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="bg-gray-800/50 border-gray-600 text-white min-h-20 resize-none"
            disabled={localStatus === 'running'}
          />
          <div className="text-xs text-gray-400">
            {prompt.length}/1000 characters
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
                <span>Image Settings</span>
              </div>
              {isConfigExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Aspect Ratio
              </label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {aspectRatios.map((ratio) => (
                    <SelectItem key={ratio.value} value={ratio.value}>
                      {ratio.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Safety Filter
              </label>
              <Select value={safetyFilterLevel} onValueChange={setSafetyFilterLevel}>
                <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {safetyLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Output Format
              </label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {outputFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={handleGenerateAndSend}
            disabled={!prompt.trim() || localStatus === 'running'}
            className="flex-1 bg-pink-600 hover:bg-pink-500 text-white disabled:opacity-50"
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
              {localStatus === 'running' ? 'Generating image...' :
               localStatus === 'completed' ? 'Image generated successfully' : 'Generation failed'}
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
                <span>Generated Image</span>
                {isOutputExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-600 space-y-2">
                <div className="text-xs text-gray-400 grid grid-cols-2 gap-2">
                  <div>Format: {localOutputData.metadata?.output_format?.toUpperCase()}</div>
                  <div>Ratio: {localOutputData.metadata?.aspect_ratio}</div>
                </div>
                <div className="aspect-square bg-gray-900/50 rounded overflow-hidden">
                  <img 
                    src={localOutputData.image_url} 
                    alt="Generated" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextElement) {
                        nextElement.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm" style={{display: 'none'}}>
                    Failed to load image
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
        className="w-3 h-3 bg-pink-500 border-2 border-white/20 hover:bg-pink-400 transition-colors"
      />

      {/* Preview Modal */}
      {showPreview && localOutputData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-600 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center space-x-2">
                <Image className="w-5 h-5" />
                <span>Generated Image</span>
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
                  <div className="text-gray-400">Aspect Ratio</div>
                  <div className="text-white">{localOutputData.metadata?.aspect_ratio}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400">Format</div>
                  <div className="text-white">{localOutputData.metadata?.output_format?.toUpperCase()}</div>
                </div>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-2">Prompt:</div>
                <div className="text-white text-sm">
                  {localOutputData.metadata?.prompt}
                </div>
              </div>
              
              <div className="flex justify-center">
                <img 
                  src={localOutputData.image_url} 
                  alt="Generated image" 
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

export default ImagenNode;