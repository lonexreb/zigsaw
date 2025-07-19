import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Mic, Activity, Upload, X, Eye, ChevronDown, ChevronUp, Send, Volume2, Settings } from 'lucide-react';
import { NodeNameHeader } from '../ui/node-name-header';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { whisperService } from '@/services/whisperService';

interface WhisperNodeProps {
  id: string;
  data: {
    label: string;
    description: string;
    status: 'idle' | 'running' | 'completed' | 'error';
    outputData?: {
      text: string;
      metadata: {
        filename: string;
        language: string;
        duration?: number;
        confidence?: number;
      };
    };
    onDataOutput?: (data: any) => void;
    onStatusChange?: (status: 'idle' | 'running' | 'completed' | 'error') => void;
    onOutputDataChange?: (outputData: any) => void;
  };
  selected?: boolean;
}

const WhisperNode: React.FC<WhisperNodeProps> = ({ id, data, selected }) => {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('auto');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [localStatus, setLocalStatus] = useState<'idle' | 'running' | 'completed' | 'error'>(data.status || 'idle');
  const [localOutputData, setLocalOutputData] = useState<any>(data.outputData);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Check if file is audio
      if (!selectedFile.type.startsWith('audio/')) {
        alert('Please upload an audio file (mp3, wav, m4a, etc.)');
        return;
      }
      // Check file size (max 25MB)
      if (selectedFile.size > 25 * 1024 * 1024) {
        alert('File size must be less than 25MB');
        return;
      }
      setFile(selectedFile);
    }
  }, []);

  const handleTranscribeAndSend = useCallback(async () => {
    if (!file) return;

    setLocalStatus('running');
    data.onStatusChange?.('running');
    setUploadProgress(10);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      const result = await whisperService.transcribeAudio(file, language);
      clearInterval(progressInterval);
      setUploadProgress(100);

      const outputData = {
        text: result.transcription,
        metadata: {
          filename: result.filename,
          language: language,
          duration: undefined,
          confidence: undefined,
        }
      };

      setLocalOutputData(outputData);
      data.onOutputDataChange?.(outputData);

      // Send data to next node
      if (data.onDataOutput) {
        data.onDataOutput({
          type: 'whisper_transcribed',
          text: result.transcription,
          metadata: outputData.metadata,
          timestamp: new Date().toISOString()
        });
      }

      setLocalStatus('completed');
      data.onStatusChange?.('completed');

    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setLocalStatus('error');
      data.onStatusChange?.('error');
      console.error('Whisper transcription error:', error);
    }
  }, [file, language, data]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('audio/')) {
      setFile(droppedFile);
    }
  }, []);

  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
    setLocalStatus('idle');
    data.onStatusChange?.('idle');
  };

  const supportedLanguages = [
    { value: 'auto', label: 'Auto-detect' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ru', label: 'Russian' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'zh', label: 'Chinese' },
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
          name={data.label}
          icon={<Mic className="w-5 h-5" />}
          status={localStatus}
          nodeId={id}
        />
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
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Language
              </label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {supportedLanguages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* File Upload */}
        <div className="space-y-3">
          {!file ? (
            <div
              className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Volume2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-300 text-sm mb-1">Drop audio file here or click to browse</p>
              <p className="text-gray-400 text-xs">Supports MP3, WAV, M4A (max 25MB)</p>
            </div>
          ) : (
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-purple-400" />
                  <span className="text-white text-sm font-medium truncate">
                    {file.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-gray-400 text-xs">
                {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
              </p>
              
              {localStatus === 'running' && (
                <div className="mt-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-gray-400 mt-1">Transcribing audio...</p>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={handleTranscribeAndSend}
            disabled={!file || localStatus === 'running'}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50"
          >
            <Send className="w-4 h-4 mr-2" />
            {localStatus === 'running' ? 'Transcribing...' : 'Transcribe & Send'}
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
              {localStatus === 'running' ? 'Transcribing audio...' :
               localStatus === 'completed' ? 'Transcription complete' : 'Transcription failed'}
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
                <span>Transcription Output</span>
                {isOutputExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-600 space-y-2">
                <div className="text-xs text-gray-400 grid grid-cols-2 gap-2">
                  <div>Language: {localOutputData.metadata?.language || 'auto'}</div>
                  <div>File: {localOutputData.metadata?.filename}</div>
                </div>
                <div className="text-sm text-white bg-gray-900/50 rounded p-2 max-h-24 overflow-y-auto">
                  {localOutputData.text || 'No transcription available'}
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
                <Mic className="w-5 h-5" />
                <span>Transcription Result</span>
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
                  <div className="text-gray-400">Filename</div>
                  <div className="text-white">{localOutputData.metadata?.filename}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400">Language</div>
                  <div className="text-white">{localOutputData.metadata?.language}</div>
                </div>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="text-gray-400 text-sm mb-2">Transcription:</div>
                <div className="text-white whitespace-pre-wrap">
                  {localOutputData.text}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhisperNode;