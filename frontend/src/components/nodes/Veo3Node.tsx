import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Video, Activity, Send, X, Eye, ChevronDown, ChevronUp, Settings, Sparkles, Code, Edit3, Download } from 'lucide-react';
import { NodeNameHeader } from '../ui/node-name-header';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { fastApiService, GenerateVideoRequest } from '@/services/fastapiService';

interface Veo3NodeProps {
  id: string;
  data: {
    label: string;
    description: string;
    status: 'idle' | 'running' | 'completed' | 'error';
    inputData?: {
      prompt?: string;           // Manual input fallback
      text?: string;            // Legacy support
      enhanced_json?: any;      // Enhanced JSON from PromptEnhancementNode
      metadata?: any;           // Metadata from enhancement
      type?: string;            // Input type indicator
    };
    outputData?: {
      video_url?: string;
      video_blob?: string;      // Base64 video data
      metadata?: {
        prompt: string;
        model: string;
        duration?: string;
        timestamp?: string;
      };
    };
    onDataOutput?: (data: any) => void;
    onStatusChange?: (status: 'idle' | 'running' | 'completed' | 'error') => void;
    onOutputDataChange?: (outputData: any) => void;
  };
  selected?: boolean;
}

const Veo3Node: React.FC<Veo3NodeProps> = ({ id, data, selected }) => {
  // Input handling states
  const [prompt, setPrompt] = useState('');
  const [enhancedJson, setEnhancedJson] = useState<any>(null);
  const [convertedPrompt, setConvertedPrompt] = useState('');
  const [inputSource, setInputSource] = useState<'manual' | 'enhanced_json'>('manual');
  
  // Legacy states (kept for backward compatibility)
  const [enhancePrompt, setEnhancePrompt] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [seed, setSeed] = useState<number | undefined>(undefined);
  
  // UI states
  const [showPreview, setShowPreview] = useState(false);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [isJsonExpanded, setIsJsonExpanded] = useState(false);
  
  // Progress states
  const [localStatus, setLocalStatus] = useState<'idle' | 'running' | 'completed' | 'error'>(data.status || 'idle');
  const [progressStage, setProgressStage] = useState<string>('');
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
      if (data.inputData.enhanced_json) {
        setEnhancedJson(data.inputData.enhanced_json);
        setInputSource('enhanced_json');
        // Convert JSON to readable prompt for preview
        setConvertedPrompt(convertJsonToPrompt(data.inputData.enhanced_json));
        setIsJsonExpanded(true); // Auto-expand JSON view
      } else if (data.inputData.prompt) {
        setPrompt(data.inputData.prompt);
        setInputSource('manual');
      } else if (data.inputData.text) {
        setPrompt(data.inputData.text);
        setInputSource('manual');
      }
    }
  }, [data.inputData]);

  // Convert enhanced JSON to natural language prompt (client-side preview)
  const convertJsonToPrompt = (json: any): string => {
    if (!json) return '';
    
    try {
      const {
        shot = {},
        subject = {},
        setting = {},
        action = {},
        style = {},
        camera = {},
        cinematic_controls = {}
      } = json;

      let prompt = '';
      
      // Camera shot and framing
      if (shot.type) prompt += `${shot.type}`;
      if (shot.framing) prompt += `, ${shot.framing}`;
      
      // Subject
      if (subject.identity) prompt += ` of ${subject.identity}`;
      if (subject.appearance) prompt += ` with ${subject.appearance}`;
      
      // Setting
      if (setting.location) prompt += ` in ${setting.location}`;
      if (setting.lighting) prompt += `, ${setting.lighting} lighting`;
      
      // Action
      if (action.main_action) prompt += `, ${action.main_action}`;
      
      // Style and mood
      if (style.aesthetic) prompt += `, ${style.aesthetic} style`;
      if (style.mood) prompt += `, ${style.mood} mood`;
      
      // Camera work
      if (camera.movement) prompt += `, ${camera.movement}`;
      
      // Technical specs
      if (cinematic_controls.aspect_ratio) prompt += `, ${cinematic_controls.aspect_ratio} aspect ratio`;
      if (cinematic_controls.duration) prompt += `, ${cinematic_controls.duration} duration`;
      
      return prompt.replace(/^,\s*/, '').trim(); // Clean up leading comma
    } catch (error) {
      console.error('Error converting JSON to prompt:', error);
      return 'Error converting enhanced JSON to prompt';
    }
  };

  // Zigsaw Puzzle Progress Animation Component
  const ZigsawProgress: React.FC<{ stage: string; isAnimating: boolean }> = ({ stage, isAnimating }) => {
    const pieces = [
      { id: 1, delay: 0, x: -20, y: -15, rotate: -15 },
      { id: 2, delay: 0.2, x: 20, y: -15, rotate: 15 },
      { id: 3, delay: 0.4, x: -20, y: 15, rotate: 10 },
      { id: 4, delay: 0.6, x: 20, y: 15, rotate: -10 }
    ];

    return (
      <div className="flex flex-col items-center space-y-4 py-6">
        {/* Puzzle Animation Container */}
        <div className="relative w-16 h-16">
          {pieces.map((piece) => (
            <div
              key={piece.id}
              className={`absolute w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 border border-orange-400/30 transition-all duration-1000 ease-in-out ${
                isAnimating 
                  ? 'opacity-100'
                  : 'opacity-60'
              }`}
              style={{
                transform: isAnimating 
                  ? `translate(${piece.x}px, ${piece.y}px) rotate(${piece.rotate}deg) scale(0.9)`
                  : 'translate(4px, 4px) rotate(0deg) scale(1)',
                transitionDelay: `${piece.delay}s`,
                clipPath: piece.id === 1 ? 'polygon(0% 0%, 70% 0%, 85% 50%, 70% 100%, 0% 100%, 15% 50%)' :
                         piece.id === 2 ? 'polygon(30% 0%, 100% 0%, 85% 50%, 100% 100%, 30% 100%, 15% 50%)' :
                         piece.id === 3 ? 'polygon(0% 0%, 70% 0%, 85% 50%, 70% 100%, 0% 100%, 15% 50%)' :
                         'polygon(30% 0%, 100% 0%, 85% 50%, 100% 100%, 30% 100%, 15% 50%)',
                top: piece.id <= 2 ? '0px' : '50%',
                left: piece.id % 2 === 1 ? '0px' : '50%',
              }}
            >
              {/* Inner glow effect */}
              <div className="absolute inset-0 bg-orange-400/20 rounded-sm" />
              
              {/* Video icon in center piece */}
              {piece.id === 1 && !isAnimating && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {/* Center assembly point */}
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
            !isAnimating ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="w-6 h-6 bg-orange-500/20 rounded-full border border-orange-400/30 flex items-center justify-center">
              <Video className="w-3 h-3 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Progress Text */}
        <div className="text-center">
          <div className="text-sm font-medium text-orange-300 mb-1">{stage}</div>
          <div className="flex space-x-1 justify-center">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isAnimating 
                    ? 'bg-orange-400 animate-pulse' 
                    : 'bg-orange-600/40'
                }`}
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const getStatusColor = () => {
    switch (localStatus) {
      case 'running': return 'border-blue-400/60 bg-blue-500/10';
      case 'completed': return 'border-green-400/60 bg-green-500/10';
      case 'error': return 'border-red-400/60 bg-red-500/10';
      default: return 'border-orange-400/40 bg-orange-900/20';
    }
  };

  const handleGenerateAndSend = useCallback(async () => {
    // Validation based on input source
    const hasInput = inputSource === 'enhanced_json' 
      ? enhancedJson 
      : prompt.trim();
      
    if (!hasInput) {
      alert(inputSource === 'enhanced_json' 
        ? 'No enhanced JSON data received from previous node' 
        : 'Please enter a prompt for video generation'
      );
      return;
    }

    setLocalStatus('running');
    data.onStatusChange?.('running');

    // Progress stages with zigsaw animation
    const stages = [
      'Preparing video prompt...',
      'Sending to FastAPI backend...',
      'Generating video with AI...',
      'Processing video output...'
    ];
    
    let currentStage = 0;
    setProgressStage(stages[currentStage]);

    // Simulate stage progression (in real app, backend would provide this)
    const progressInterval = setInterval(() => {
      currentStage = (currentStage + 1) % stages.length;
      setProgressStage(stages[currentStage]);
    }, 2000);

    try {
      const request: GenerateVideoRequest = {
        prompt: inputSource === 'enhanced_json' ? convertedPrompt : prompt.trim(),
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', // Default reference image
        style: 'cinematic',
        duration: 10,
        quality: 'high'
      };

      console.log('🎬 Generating video with request:', {
        inputSource,
        hasEnhancedJson: !!request.enhanced_json,
        hasPrompt: !!request.prompt
      });

      const result = await fastApiService.generateVideo(request);
      clearInterval(progressInterval);

      if (!result.success) {
        throw new Error(result.error || 'Video generation failed');
      }

      const outputData = {
        video_url: result.data?.video_url || result.data?.url,
        video_blob: result.data?.video_blob,
        metadata: {
          prompt: inputSource === 'enhanced_json' ? convertedPrompt : request.prompt,
          style: request.style,
          duration: request.duration,
          quality: request.quality,
          input_source: inputSource,
          enhanced_json_used: inputSource === 'enhanced_json',
          timestamp: new Date().toISOString()
        }
      };

      setLocalOutputData(outputData);
      data.onOutputDataChange?.(outputData);

      // Send data to next node
      if (data.onDataOutput) {
        data.onDataOutput({
          type: 'video_generated',
          video_url: outputData.video_url,
          video_blob: outputData.video_blob,
          prompt: outputData.metadata.prompt,
          metadata: outputData.metadata,
          timestamp: new Date().toISOString()
        });
      }

      setProgressStage('Video generated successfully!');
      setLocalStatus('completed');
      data.onStatusChange?.('completed');

    } catch (error) {
      clearInterval(progressInterval);
      setLocalStatus('error');
      data.onStatusChange?.('error');
      setProgressStage('Generation failed');
      console.error('Video generation error:', error);
      alert(`Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [prompt, enhancedJson, convertedPrompt, inputSource, data, enhancePrompt, negativePrompt, seed]);

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

  // Download video function
  const handleDownloadVideo = async () => {
    if (!localOutputData?.video_url) {
      alert('No video available for download');
      return;
    }

    try {
      // Fetch the video as a blob
      const response = await fetch(localOutputData.video_url);
      if (!response.ok) {
        throw new Error('Failed to fetch video');
      }
      
      const videoBlob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `veo3-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Video downloaded successfully');
    } catch (error) {
      console.error('❌ Download failed:', error);
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div 
      className={`bg-gray-900/90 backdrop-blur-xl border-2 rounded-2xl shadow-2xl transition-all duration-300 ${
        localOutputData ? 'w-96' : 'w-80'  // Auto-expand when video is generated
      } ${getStatusColor()} ${
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
          Generate videos using FastAPI backend with AI-powered video creation
        </p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Input Source Indicator */}
        <div className="flex items-center space-x-2 text-xs text-gray-400 bg-gray-800/30 rounded-lg p-2">
          <div className={`w-2 h-2 rounded-full ${inputSource === 'enhanced_json' ? 'bg-green-400' : 'bg-orange-400'}`} />
          <span>
            {inputSource === 'enhanced_json' ? 'Using Enhanced JSON from PromptEnhancementNode' : 'Manual Input Mode'}
          </span>
        </div>

        {/* Enhanced JSON Section */}
        {inputSource === 'enhanced_json' && enhancedJson && (
          <Collapsible open={isJsonExpanded} onOpenChange={setIsJsonExpanded}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full flex items-center justify-between text-gray-300 hover:text-white hover:bg-white/5"
              >
                <div className="flex items-center space-x-2">
                  <Code className="w-4 h-4" />
                  <span>Enhanced JSON Specification</span>
                </div>
                {isJsonExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
                <pre className="text-xs text-green-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {JSON.stringify(enhancedJson, null, 2)}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Converted Prompt Section */}
        {inputSource === 'enhanced_json' && convertedPrompt ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Edit3 className="w-4 h-4 text-gray-300" />
              <label className="text-sm font-medium text-gray-300">
                Converted Prompt (Editable)
              </label>
            </div>
            <Textarea
              value={convertedPrompt}
              onChange={(e) => setConvertedPrompt(e.target.value)}
              placeholder="Auto-generated prompt from JSON..."
              className="bg-gray-800/50 border-gray-600 text-white min-h-20 resize-none"
              disabled={localStatus === 'running'}
            />
            <div className="text-xs text-gray-400">
              This prompt was generated from your JSON. You can edit it before generation.
            </div>
          </div>
        ) : (
          /* Manual Prompt Input (shown when no JSON input) */
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
        )}

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
            <div className="text-sm text-gray-400 bg-gray-800/30 p-2 rounded">
              Using FastAPI backend for enhanced video generation capabilities
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Progress Section - Show during generation */}
        {localStatus === 'running' && (
          <div className="bg-gray-800/30 rounded-lg border border-gray-600">
            <ZigsawProgress 
              stage={progressStage} 
              isAnimating={localStatus === 'running'} 
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={handleGenerateAndSend}
            disabled={
              (inputSource === 'enhanced_json' && !enhancedJson) || 
              (inputSource === 'manual' && !prompt.trim()) || 
              localStatus === 'running'
            }
            className="flex-1 bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {localStatus === 'running' ? 'Generating...' : 'Generate Video'}
          </Button>

          {localOutputData && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
                className="border-gray-600 text-gray-300 hover:text-white hover:bg-white/5"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadVideo}
                className="border-green-600 text-green-300 hover:text-white hover:bg-green-500/20"
              >
                <Download className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Status Indicator */}
        {localStatus !== 'idle' && localStatus !== 'running' && (
          <div className="flex items-center space-x-2 text-sm">
            <Activity className={`w-4 h-4 ${
              localStatus === 'completed' ? 'text-green-400' : 'text-red-400'
            }`} />
            <span className={`${
              localStatus === 'completed' ? 'text-green-300' : 'text-red-300'
            }`}>
              {localStatus === 'completed' ? 'Video generated successfully' : 'Generation failed'}
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
                  <div>Style: {localOutputData.metadata?.style || 'cinematic'}</div>
                  <div>Duration: {localOutputData.metadata?.duration || 10}s</div>
                  <div>Quality: {localOutputData.metadata?.quality || 'high'}</div>
                  <div>Source: {localOutputData.metadata?.input_source || 'manual'}</div>
                </div>
                <div className="aspect-video bg-gray-900/50 rounded overflow-hidden">
                  <video 
                    src={localOutputData.video_url} 
                    controls
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('🎥 Video load error, trying HTTP serving fallback...');
                      // Try HTTP serving fallback if file:// URL fails
                      if (localOutputData.video_file_path && !e.currentTarget.src.includes('/api/videos/serve')) {
                        e.currentTarget.src = `/api/videos/serve?path=${encodeURIComponent(localOutputData.video_file_path)}`;
                      } else {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }
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
                  <div className="text-gray-400">Style</div>
                  <div className="text-white">{localOutputData.metadata?.style || 'cinematic'}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400">Duration</div>
                  <div className="text-white">{localOutputData.metadata?.duration || 10}s</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400">Quality</div>
                  <div className="text-white">{localOutputData.metadata?.quality || 'high'}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400">Input Source</div>
                  <div className="text-white">{localOutputData.metadata?.input_source || 'manual'}</div>
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
                  onError={(e) => {
                    console.log('🎥 Preview video load error, trying HTTP serving fallback...');
                    // Try HTTP serving fallback if file:// URL fails
                    if (localOutputData.video_file_path && !e.currentTarget.src.includes('/api/videos/serve')) {
                      e.currentTarget.src = `/api/videos/serve?path=${encodeURIComponent(localOutputData.video_file_path)}`;
                    }
                  }}
                />
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={handleDownloadVideo}
                  className="bg-green-600 hover:bg-green-500 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Video
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Veo3Node;