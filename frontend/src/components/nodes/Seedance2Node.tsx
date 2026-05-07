import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Video,
  Activity,
  X,
  Eye,
  ChevronDown,
  ChevronUp,
  Settings,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { NodeNameHeader } from '../ui/node-name-header';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import {
  seedance2Service,
  Seedance2Request,
} from '@/services/seedance2Service';

interface Seedance2NodeProps {
  id: string;
  data: {
    label: string;
    description: string;
    status: 'idle' | 'running' | 'completed' | 'error';
    inputData?: {
      // Inherited from a Storyboard / Imagen / image-producing node.
      image_url?: string;
      prompt?: string;
      text?: string;
    };
    outputData?: {
      video_url: string;
      metadata: {
        prompt: string;
        image_url: string;
        duration: number;
        resolution: string;
        aspect_ratio: string;
        task_id: string;
      };
    };
    onDataOutput?: (data: any) => void;
    onStatusChange?: (status: 'idle' | 'running' | 'completed' | 'error') => void;
    onOutputDataChange?: (outputData: any) => void;
  };
  selected?: boolean;
}

const Seedance2Node: React.FC<Seedance2NodeProps> = ({ id, data, selected }) => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState('1080p');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [showPreview, setShowPreview] = useState(false);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [localStatus, setLocalStatus] = useState<
    'idle' | 'running' | 'completed' | 'error'
  >(data.status || 'idle');
  const [localOutputData, setLocalOutputData] = useState<any>(data.outputData);

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

  // Inherit upstream image (storyboard) + any prompt that came with it.
  useEffect(() => {
    if (data.inputData) {
      if (data.inputData.image_url) {
        setImageUrl(data.inputData.image_url);
      }
      if (data.inputData.prompt) {
        setPrompt(data.inputData.prompt);
      } else if (data.inputData.text) {
        setPrompt(data.inputData.text);
      }
    }
  }, [data.inputData]);

  const getStatusColor = () => {
    switch (localStatus) {
      case 'running':
        return 'border-blue-400/60 bg-blue-500/10';
      case 'completed':
        return 'border-green-400/60 bg-green-500/10';
      case 'error':
        return 'border-red-400/60 bg-red-500/10';
      default:
        return 'border-cyan-400/40 bg-cyan-900/20';
    }
  };

  const handleGenerateAndSend = useCallback(async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt describing the cinematic scene');
      return;
    }
    if (!imageUrl.trim()) {
      alert(
        'Connect a Storyboard node upstream, or paste a public image URL into the node settings.'
      );
      return;
    }

    setLocalStatus('running');
    data.onStatusChange?.('running');

    try {
      const request: Seedance2Request = {
        prompt: prompt.trim(),
        image_url: imageUrl.trim(),
        duration,
        resolution,
        aspect_ratio: aspectRatio,
      };

      const result = await seedance2Service.generateVideo(request);

      const outputData = {
        video_url: result.video_url,
        metadata: {
          prompt: result.prompt,
          image_url: result.image_url,
          duration: result.duration,
          resolution: result.resolution,
          aspect_ratio: result.aspect_ratio,
          task_id: result.task_id,
        },
      };

      setLocalOutputData(outputData);
      data.onOutputDataChange?.(outputData);

      if (data.onDataOutput) {
        data.onDataOutput({
          type: 'video_generated',
          video_url: result.video_url,
          prompt: result.prompt,
          metadata: outputData.metadata,
          timestamp: new Date().toISOString(),
        });
      }

      setLocalStatus('completed');
      data.onStatusChange?.('completed');
    } catch (error) {
      setLocalStatus('error');
      data.onStatusChange?.('error');
      console.error('Seedance 2 generation error:', error);
      alert(
        `Seedance 2 generation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }, [prompt, imageUrl, duration, resolution, aspectRatio, data]);

  const resolutions = [
    { value: '720p', label: '720p (faster)' },
    { value: '1080p', label: '1080p (recommended)' },
  ];

  const aspectRatios = [
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '9:16', label: 'Vertical (9:16)' },
    { value: '1:1', label: 'Square (1:1)' },
  ];

  return (
    <div
      className={`bg-gray-900/90 backdrop-blur-xl border-2 rounded-2xl shadow-2xl transition-all duration-300 w-80 ${getStatusColor()} ${
        selected ? 'ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-gray-900' : ''
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-cyan-500 border-2 border-white/20 hover:bg-cyan-400 transition-colors"
      />

      <div className="p-4 border-b border-white/10">
        <NodeNameHeader originalLabel={data.label} nodeId={id}>
          <Video className="w-5 h-5" />
        </NodeNameHeader>
        <p className="text-gray-300 text-xs mt-1">{data.description}</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 block">Scene Prompt</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the polished video scene Seedance should produce from the storyboard..."
            className="bg-gray-800/50 border-gray-600 text-white min-h-20 resize-none"
            disabled={localStatus === 'running'}
          />
          <div className="text-xs text-gray-400">{prompt.length}/2000 characters</div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Reference Image URL
          </label>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Auto-filled from connected Storyboard node"
            className="bg-gray-800/50 border-gray-600 text-white"
            disabled={localStatus === 'running'}
          />
          <div className="text-xs text-gray-400">
            {imageUrl
              ? imageUrl.startsWith('data:')
                ? 'Inline base64 image attached'
                : `Source: ${imageUrl.slice(0, 40)}${imageUrl.length > 40 ? '…' : ''}`
              : 'Connect a Storyboard node, or paste a public URL'}
          </div>
        </div>

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
              {isConfigExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Duration (seconds)
              </label>
              <Select
                value={String(duration)}
                onValueChange={(v) => setDuration(parseInt(v))}
              >
                <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {[5, 10].map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d}s
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Resolution
              </label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {resolutions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Aspect Ratio
              </label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {aspectRatios.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex space-x-2">
          <Button
            onClick={handleGenerateAndSend}
            disabled={!prompt.trim() || !imageUrl.trim() || localStatus === 'running'}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {localStatus === 'running' ? 'Rendering...' : 'Generate & Send'}
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

        {localStatus !== 'idle' && (
          <div className="flex items-center space-x-2 text-sm">
            <Activity
              className={`w-4 h-4 ${
                localStatus === 'running'
                  ? 'text-blue-400 animate-pulse'
                  : localStatus === 'completed'
                    ? 'text-green-400'
                    : 'text-red-400'
              }`}
            />
            <span
              className={`${
                localStatus === 'running'
                  ? 'text-blue-300'
                  : localStatus === 'completed'
                    ? 'text-green-300'
                    : 'text-red-300'
              }`}
            >
              {localStatus === 'running'
                ? 'Generating cinematic scene (~30-90s)...'
                : localStatus === 'completed'
                  ? 'Scene rendered'
                  : 'Generation failed'}
            </span>
          </div>
        )}

        {localOutputData && (
          <Collapsible open={isOutputExpanded} onOpenChange={setIsOutputExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full flex items-center justify-between text-gray-300 hover:text-white hover:bg-white/5"
              >
                <span>Generated Scene</span>
                {isOutputExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-600 space-y-2">
                <div className="text-xs text-gray-400 grid grid-cols-2 gap-2">
                  <div>Duration: {localOutputData.metadata?.duration}s</div>
                  <div>Resolution: {localOutputData.metadata?.resolution}</div>
                </div>
                <div className="aspect-video bg-gray-900/50 rounded overflow-hidden">
                  <video
                    src={localOutputData.video_url}
                    controls
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const next = e.currentTarget.nextElementSibling as HTMLElement;
                      if (next) next.style.display = 'flex';
                    }}
                  />
                  <div
                    className="w-full h-full flex items-center justify-center text-gray-400 text-sm"
                    style={{ display: 'none' }}
                  >
                    Failed to load video
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-cyan-500 border-2 border-white/20 hover:bg-cyan-400 transition-colors"
      />

      {showPreview && localOutputData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-600 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center space-x-2">
                <Video className="w-5 h-5" />
                <span>Generated Scene</span>
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
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400">Duration</div>
                  <div className="text-white">{localOutputData.metadata?.duration}s</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400">Resolution</div>
                  <div className="text-white">{localOutputData.metadata?.resolution}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400">Aspect</div>
                  <div className="text-white">{localOutputData.metadata?.aspect_ratio}</div>
                </div>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-2">Prompt:</div>
                <div className="text-white text-sm">{localOutputData.metadata?.prompt}</div>
              </div>

              <div className="flex justify-center">
                <video
                  src={localOutputData.video_url}
                  controls
                  className="max-w-full max-h-[60vh] rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Seedance2Node;
