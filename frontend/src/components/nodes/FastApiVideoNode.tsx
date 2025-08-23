import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Video, Activity, Send, X, Eye, ChevronDown, ChevronUp, Settings, Play, Download } from 'lucide-react';
import { NodeNameHeader } from '../ui/node-name-header';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { fastApiService, GenerateVideoRequest } from '@/services/fastapiService';

interface FastApiVideoNodeProps {
  id: string;
  data: {
    label: string;
    description: string;
    status: 'idle' | 'running' | 'completed' | 'error';
    outputData?: {
      success: boolean;
      prompt: string;
      data?: any;
      error?: string;
      source: string;
    };
    onDataOutput?: (data: any) => void;
    onStatusChange?: (status: 'idle' | 'running' | 'completed' | 'error') => void;
    onOutputDataChange?: (outputData: any) => void;
  };
  selected?: boolean;
}

const FastApiVideoNode: React.FC<FastApiVideoNodeProps> = ({ id, data, selected }) => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [style, setStyle] = useState('cinematic');
  const [duration, setDuration] = useState(10);
  const [quality, setQuality] = useState('high');
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

  const getStatusColor = () => {
    switch (localStatus) {
      case 'running': return 'border-blue-400/60 bg-blue-500/10';
      case 'completed': return 'border-green-400/60 bg-green-500/10';
      case 'error': return 'border-red-400/60 bg-red-500/10';
      default: return 'border-purple-400/40 bg-purple-900/20';
    }
  };

  const handleExecute = useCallback(async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt for video generation');
      return;
    }

    setLocalStatus('running');
    data.onStatusChange?.('running');

    try {
      const requestData: GenerateVideoRequest = {
        prompt: prompt.trim(),
        image_url: imageUrl.trim() || undefined,
        style,
        duration,
        quality
      };

      const result = await fastApiService.generateVideo(requestData);
      
      if (result.success) {
        // Extract video URL from different possible response formats
        let videoUrl = result.data?.video_url || result.data?.url || result.data?.video_path;
        
        // Log the response structure for debugging
        console.log('🎬 FastAPI response structure:', result);
        console.log('🎬 Extracted video URL:', videoUrl);
        
        // If no direct URL, try to construct one from the FastAPI backend
        if (!videoUrl && result.data?.video_id) {
          videoUrl = `https://degree-works-backend-hydrabeans.replit.app/videos/${result.data.video_id}`;
          console.log('🎬 Constructed video URL from ID:', videoUrl);
        }
        
        // Update the data with the extracted video URL
        const enhancedData = {
          ...result.data,
          video_url: videoUrl
        };
        
        const outputData = {
          success: true,
          prompt: prompt.trim(),
          data: enhancedData,
          source: 'fastapi'
        };
        
        setLocalOutputData(outputData);
        data.onOutputDataChange?.(outputData);

        // Send data to next node
        if (data.onDataOutput) {
          data.onDataOutput({
            type: 'fastapi_video_generated',
            prompt: prompt.trim(),
            data: result.data,
            timestamp: new Date().toISOString()
          });
        }

        setLocalStatus('completed');
        data.onStatusChange?.('completed');
      } else {
        throw new Error(result.error || 'Video generation failed');
      }

    } catch (error) {
      setLocalStatus('error');
      data.onStatusChange?.('error');
      console.error('FastAPI video generation error:', error);
      
      // Set error output data
      const errorData = {
        success: false,
        prompt: prompt.trim(),
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'fastapi'
      };
      setLocalOutputData(errorData);
      data.onOutputDataChange?.(errorData);
    }
  }, [prompt, imageUrl, style, duration, quality, data]);

  const styleOptions = [
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'realistic', label: 'Realistic' },
    { value: 'artistic', label: 'Artistic' },
    { value: 'cartoon', label: 'Cartoon' },
    { value: 'anime', label: 'Anime' }
  ];

  const qualityOptions = [
    { value: 'low', label: 'Low (Fast)' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High (Slow)' }
  ];

  return (
    <div 
      className={`bg-gray-900/90 backdrop-blur-xl border-2 rounded-2xl shadow-2xl transition-all duration-300 w-80 ${getStatusColor()} ${
        selected ? 'ring-2 ring-purple-400/50 ring-offset-2 ring-offset-gray-900' : ''
      }`}
    >
      {/* Input Handle */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-purple-500 border-2 border-white/20 hover:bg-purple-400 transition-colors"
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
                <span>Configuration</span>
              </div>
              {isConfigExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            {/* Style Selection */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Video Style
              </label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {styleOptions.map((styleOption) => (
                    <SelectItem key={styleOption.value} value={styleOption.value}>
                      {styleOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Duration (seconds)
              </label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 10)}
                min={5}
                max={60}
                className="bg-gray-800/50 border-gray-600 text-white"
              />
            </div>

            {/* Quality */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Quality
              </label>
              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {qualityOptions.map((qualityOption) => (
                    <SelectItem key={qualityOption.value} value={qualityOption.value}>
                      {qualityOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            Video Prompt
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the video you want to generate. Example: 'A cat playing in a garden with butterflies'"
            className="bg-gray-800/50 border-gray-600 text-white"
            rows={3}
          />
        </div>

        {/* Image URL Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            Image URL (Optional)
          </label>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg (optional - for reference)"
            className="bg-gray-800/50 border-gray-600 text-white"
          />
          <p className="text-xs text-gray-400">
            Provide an image URL for reference. The AI will use this as inspiration for the video generation.
          </p>
        </div>

        {/* Execute Button */}
        <Button
          onClick={handleExecute}
          disabled={!prompt.trim() || localStatus === 'running'}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50"
        >
          <Send className="w-4 h-4 mr-2" />
          {localStatus === 'running' ? 'Generating...' : 'Generate Video'}
        </Button>

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
                <span>Output Result</span>
                {isOutputExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="bg-gray-800/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Source:</span>
                  <span className="text-xs text-purple-400">{localOutputData.source}</span>
                </div>
                {localOutputData.success ? (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-300">
                      <strong>Prompt:</strong> {localOutputData.prompt}
                    </div>
                    
                    {/* Video Player */}
                    {localOutputData.data?.video_url && (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-300">
                          <strong>Generated Video:</strong>
                        </div>
                        <div className="aspect-video bg-gray-900/50 rounded overflow-hidden">
                          <video 
                            src={localOutputData.data.video_url} 
                            controls
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log('🎥 Video load error for URL:', localOutputData.data.video_url);
                              console.log('🎥 Error details:', e);
                            }}
                            onLoadStart={() => console.log('🎥 Video loading started for:', localOutputData.data.video_url)}
                            onCanPlay={() => console.log('🎥 Video can play for:', localOutputData.data.video_url)}
                          />
                        </div>
                        <div className="text-xs text-gray-400">
                          Video URL: {localOutputData.data.video_url}
                        </div>
                        
                        {/* Download Button */}
                        <Button
                          onClick={() => {
                            if (localOutputData.data?.video_url) {
                              const a = document.createElement('a');
                              a.href = localOutputData.data.video_url;
                              a.download = `fastapi-video-${Date.now()}.mp4`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }
                          }}
                          className="w-full bg-green-600 hover:bg-green-500 text-white text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download Video
                        </Button>
                      </div>
                    )}
                    
                    {/* Raw Data */}
                    <div className="text-xs text-gray-300">
                      <strong>Raw Response Data:</strong>
                      <pre className="mt-1 bg-gray-900/50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(localOutputData.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-red-400">
                    <strong>Error:</strong> {localOutputData.error}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {/* Output Handle */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-purple-500 border-2 border-white/20 hover:bg-purple-400 transition-colors"
      />
    </div>
  );
};

export default FastApiVideoNode;
