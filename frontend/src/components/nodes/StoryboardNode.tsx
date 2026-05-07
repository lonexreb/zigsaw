import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Layers,
  Activity,
  X,
  Eye,
  ChevronDown,
  ChevronUp,
  Settings,
  Sparkles,
} from 'lucide-react';
import { NodeNameHeader } from '../ui/node-name-header';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import {
  storyboardService,
  StoryboardRequest,
  StoryboardStyle,
} from '@/services/storyboardService';

interface StoryboardNodeProps {
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
        original_prompt: string;
        use_template: boolean;
        frame_count: number;
        style: StoryboardStyle;
        aspect_ratio: string;
      };
    };
    onDataOutput?: (data: any) => void;
    onStatusChange?: (status: 'idle' | 'running' | 'completed' | 'error') => void;
    onOutputDataChange?: (outputData: any) => void;
  };
  selected?: boolean;
}

const StoryboardNode: React.FC<StoryboardNodeProps> = ({ id, data, selected }) => {
  const [prompt, setPrompt] = useState('');
  const [useTemplate, setUseTemplate] = useState(true);
  const [frameCount, setFrameCount] = useState(12);
  const [style, setStyle] = useState<StoryboardStyle>('cinematic');
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

  // Inherit prompt from upstream node (e.g. a Trigger or a chat node).
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
      case 'running':
        return 'border-blue-400/60 bg-blue-500/10';
      case 'completed':
        return 'border-green-400/60 bg-green-500/10';
      case 'error':
        return 'border-red-400/60 bg-red-500/10';
      default:
        return 'border-rose-400/40 bg-rose-900/20';
    }
  };

  const handleGenerateAndSend = useCallback(async () => {
    if (!prompt.trim()) {
      alert('Please enter a story idea or storyboard prompt');
      return;
    }

    setLocalStatus('running');
    data.onStatusChange?.('running');

    try {
      const request: StoryboardRequest = {
        prompt: prompt.trim(),
        use_template: useTemplate,
        frame_count: frameCount,
        style,
        aspect_ratio: aspectRatio,
      };

      const result = await storyboardService.generateStoryboard(request);

      const outputData = {
        image_url: result.image_url,
        metadata: {
          prompt: result.prompt,
          original_prompt: result.original_prompt,
          use_template: result.use_template,
          frame_count: result.frame_count,
          style: result.style,
          aspect_ratio: result.aspect_ratio,
        },
      };

      setLocalOutputData(outputData);
      data.onOutputDataChange?.(outputData);

      // Forward to the next node — Seedance 2 reads `image_url` and `prompt`.
      if (data.onDataOutput) {
        data.onDataOutput({
          type: 'storyboard_generated',
          image_url: result.image_url,
          prompt: result.original_prompt,
          metadata: outputData.metadata,
          timestamp: new Date().toISOString(),
        });
      }

      setLocalStatus('completed');
      data.onStatusChange?.('completed');
    } catch (error) {
      setLocalStatus('error');
      data.onStatusChange?.('error');
      console.error('Storyboard generation error:', error);
      alert(
        `Storyboard generation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }, [prompt, useTemplate, frameCount, style, aspectRatio, data]);

  const styleOptions: Array<{ value: StoryboardStyle; label: string }> = [
    { value: 'cinematic', label: 'Cinematic (mixed media)' },
    { value: 'animated', label: 'Animated (Pixar pre-prod)' },
    { value: 'sketch', label: 'Pure Pencil Sketch' },
  ];

  const aspectRatios = [
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '1:1', label: 'Square (1:1)' },
    { value: '9:16', label: 'Vertical (9:16)' },
  ];

  return (
    <div
      className={`bg-gray-900/90 backdrop-blur-xl border-2 rounded-2xl shadow-2xl transition-all duration-300 w-80 ${getStatusColor()} ${
        selected ? 'ring-2 ring-rose-400/50 ring-offset-2 ring-offset-gray-900' : ''
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-rose-500 border-2 border-white/20 hover:bg-rose-400 transition-colors"
      />

      <div className="p-4 border-b border-white/10">
        <NodeNameHeader originalLabel={data.label} nodeId={id}>
          <Layers className="w-5 h-5" />
        </NodeNameHeader>
        <p className="text-gray-300 text-xs mt-1">{data.description}</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 block">
            {useTemplate ? 'Story Idea' : 'Raw Storyboard Prompt'}
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              useTemplate
                ? 'Describe your story (e.g. "two chefs preparing a meal in a high-pressure kitchen, mentor and apprentice")...'
                : 'Paste your full storyboard prompt verbatim...'
            }
            className="bg-gray-800/50 border-gray-600 text-white min-h-24 resize-none"
            disabled={localStatus === 'running'}
          />
          <div className="text-xs text-gray-400">
            {prompt.length}/2000 characters
            {useTemplate && ' · auto-wrapped with 12-frame template'}
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
                <span>Storyboard Settings</span>
              </div>
              {isConfigExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`use-template-${id}`}
                checked={useTemplate}
                onCheckedChange={(checked) => setUseTemplate(checked as boolean)}
              />
              <label
                htmlFor={`use-template-${id}`}
                className="text-sm font-medium text-gray-300"
              >
                Auto-wrap with Arcads template
              </label>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Frame Count
              </label>
              <Select
                value={String(frameCount)}
                onValueChange={(v) => setFrameCount(parseInt(v))}
              >
                <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {[6, 9, 12, 16].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} frames
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Visual Style
              </label>
              <Select value={style} onValueChange={(v) => setStyle(v as StoryboardStyle)}>
                <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {styleOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
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
                  {aspectRatios.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
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
            disabled={!prompt.trim() || localStatus === 'running'}
            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {localStatus === 'running' ? 'Storyboarding...' : 'Generate & Send'}
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
                ? 'Generating storyboard...'
                : localStatus === 'completed'
                  ? 'Storyboard ready'
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
                <span>Generated Storyboard</span>
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
                  <div>Frames: {localOutputData.metadata?.frame_count}</div>
                  <div>Style: {localOutputData.metadata?.style}</div>
                </div>
                <div className="aspect-video bg-gray-900/50 rounded overflow-hidden">
                  <img
                    src={localOutputData.image_url}
                    alt="Generated storyboard"
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
                    Failed to load storyboard
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
        className="w-3 h-3 bg-rose-500 border-2 border-white/20 hover:bg-rose-400 transition-colors"
      />

      {showPreview && localOutputData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-600 rounded-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center space-x-2">
                <Layers className="w-5 h-5" />
                <span>Generated Storyboard</span>
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
                  <div className="text-gray-400">Frames</div>
                  <div className="text-white">{localOutputData.metadata?.frame_count}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400">Style</div>
                  <div className="text-white">{localOutputData.metadata?.style}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400">Aspect</div>
                  <div className="text-white">{localOutputData.metadata?.aspect_ratio}</div>
                </div>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-2">Story idea:</div>
                <div className="text-white text-sm">
                  {localOutputData.metadata?.original_prompt}
                </div>
              </div>

              <div className="flex justify-center">
                <img
                  src={localOutputData.image_url}
                  alt="Generated storyboard"
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

export default StoryboardNode;
