import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Eye, Activity, Send, X, ChevronDown, ChevronUp, Settings, Image } from 'lucide-react';
import { NodeNameHeader } from '../ui/node-name-header';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { blip2Service, Blip2Request } from '@/services/blip2Service';

interface Blip2NodeProps {
  id: string;
  data: {
    label: string;
    description: string;
    status: 'idle' | 'running' | 'completed' | 'error';
    inputData?: {
      image_url?: string;
      url?: string;
    };
    outputData?: {
      result: string;
      metadata: {
        analysis_type: string;
        result_length: number;
        word_count: number;
        caption_mode: boolean;
        model_params: any;
      };
    };
    onDataOutput?: (data: any) => void;
    onStatusChange?: (status: 'idle' | 'running' | 'completed' | 'error') => void;
    onOutputDataChange?: (outputData: any) => void;
  };
  selected?: boolean;
}

const Blip2Node: React.FC<Blip2NodeProps> = ({ id, data, selected }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [question, setQuestion] = useState('What is in this image?');
  const [context, setContext] = useState('');
  const [captionMode, setCaptionMode] = useState(false);
  const [useNucleusSampling, setUseNucleusSampling] = useState(true);
  const [temperature, setTemperature] = useState([1.0]);
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
      if (data.inputData.image_url) {
        setImageUrl(data.inputData.image_url);
      } else if (data.inputData.url) {
        setImageUrl(data.inputData.url);
      }
    }
  }, [data.inputData]);

  const getStatusColor = () => {
    switch (localStatus) {
      case 'running': return 'border-blue-400/60 bg-blue-500/10';
      case 'completed': return 'border-green-400/60 bg-green-500/10';
      case 'error': return 'border-red-400/60 bg-red-500/10';
      default: return 'border-purple-400/40 bg-purple-900/20';
    }
  };

  const handleAnalyzeAndSend = useCallback(async () => {
    if (!imageUrl.trim()) {
      alert('Please enter an image URL');
      return;
    }

    setLocalStatus('running');
    data.onStatusChange?.('running');

    try {
      const request: Blip2Request = {
        image_url: imageUrl.trim(),
        question: captionMode ? undefined : question.trim(),
        context: context.trim() || undefined,
        caption: captionMode,
        use_nucleus_sampling: useNucleusSampling,
        temperature: temperature[0]
      };

      const result = await blip2Service.analyzeImage(request);

      const outputData = {
        result: result.result,
        analysis_type: captionMode ? 'caption' : 'question_answer',
        image_url: result.image_url,
        question: result.question,
        metadata: {
          result_length: result.result.length,
          word_count: result.result.split(' ').length,
          caption_mode: result.caption,
          model_params: {
            use_nucleus_sampling: result.use_nucleus_sampling,
            temperature: result.temperature
          }
        }
      };

      setLocalOutputData(outputData);
      data.onOutputDataChange?.(outputData);

      // Send data to next node
      if (data.onDataOutput) {
        data.onDataOutput({
          type: 'blip2_analysis',
          result: result.result,
          analysis_type: captionMode ? 'caption' : 'question_answer',
          image_url: result.image_url,
          question: result.question,
          metadata: outputData.metadata,
          timestamp: new Date().toISOString()
        });
      }

      setLocalStatus('completed');
      data.onStatusChange?.('completed');

    } catch (error) {
      setLocalStatus('error');
      data.onStatusChange?.('error');
      console.error('BLIP-2 analysis error:', error);
    }
  }, [imageUrl, question, context, captionMode, useNucleusSampling, temperature, data]);

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
          <Eye className="w-5 h-5" />
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
            {/* Caption Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Switch 
                id="caption-mode"
                checked={captionMode}
                onCheckedChange={setCaptionMode}
              />
              <label htmlFor="caption-mode" className="text-sm text-gray-300">
                Caption Mode
              </label>
            </div>

            {/* Question Input (hidden in caption mode) */}
            {!captionMode && (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Question
                </label>
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask BLIP-2 about the image. Example: 'What objects are in this image?' or 'Describe what's happening in this scene'"
                  className="bg-gray-800/50 border-gray-600 text-white"
                />
              </div>
            )}

            {/* Context Input */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Context (optional)
              </label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Previous questions and answers..."
                className="bg-gray-800/50 border-gray-600 text-white resize-none"
                rows={2}
              />
            </div>

            {/* Use Nucleus Sampling Toggle */}
            <div className="flex items-center space-x-2">
              <Switch 
                id="nucleus-sampling"
                checked={useNucleusSampling}
                onCheckedChange={setUseNucleusSampling}
              />
              <label htmlFor="nucleus-sampling" className="text-sm text-gray-300">
                Use Nucleus Sampling
              </label>
            </div>

            {/* Temperature */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Temperature: {temperature[0]}
              </label>
              <Slider
                value={temperature}
                onValueChange={setTemperature}
                max={2}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Image URL Input */}
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            Image URL
          </label>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Enter image URL for BLIP-2 analysis (JPG, PNG, GIF supported)"
            className="bg-gray-800/50 border-gray-600 text-white"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={handleAnalyzeAndSend}
            disabled={!imageUrl.trim() || localStatus === 'running'}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50"
          >
            <Send className="w-4 h-4 mr-2" />
            {localStatus === 'running' ? 'Analyzing...' : 'Analyze & Send'}
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
              {localStatus === 'running' ? 'Analyzing image...' :
               localStatus === 'completed' ? 'Analysis complete' : 'Analysis failed'}
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
                <span>Analysis Output</span>
                {isOutputExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-600 space-y-2">
                <div className="text-xs text-gray-400 grid grid-cols-2 gap-2">
                  <div>Type: {localOutputData.analysis_type}</div>
                  <div>Length: {localOutputData.metadata?.result_length}</div>
                </div>
                <div className="text-sm text-white bg-gray-900/50 rounded p-2 max-h-24 overflow-y-auto">
                  {localOutputData.result || 'No analysis available'}
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
        className="w-3 h-3 bg-purple-500 border-2 border-white/20 hover:bg-purple-400 transition-colors"
      />

      {/* Preview Modal */}
      {showPreview && localOutputData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-600 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>BLIP-2 Analysis Result</span>
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
                  <div className="text-gray-400">Analysis Type</div>
                  <div className="text-white">{localOutputData.analysis_type}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400">Word Count</div>
                  <div className="text-white">{localOutputData.metadata?.word_count}</div>
                </div>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="text-gray-400 text-sm mb-2">Result:</div>
                <div className="text-white whitespace-pre-wrap">
                  {localOutputData.result}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blip2Node;