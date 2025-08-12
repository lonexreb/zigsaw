import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Image, Upload, Activity, Eye, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { NodeNameHeader } from '../ui/node-name-header';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

interface ImageUploadNodeProps {
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
      image1_base64: string;
      image2_base64: string;
      prompt?: string;
      metadata: {
        image1_name: string;
        image2_name: string;
        image1_size: number;
        image2_size: number;
      };
    };
    onDataOutput?: (data: any) => void;
    onStatusChange?: (status: 'idle' | 'running' | 'completed' | 'error') => void;
    onOutputDataChange?: (outputData: any) => void;
  };
  selected?: boolean;
}

const ImageUploadNode: React.FC<ImageUploadNodeProps> = ({ id, data, selected }) => {
  const [image1Base64, setImage1Base64] = useState<string>('');
  const [image2Base64, setImage2Base64] = useState<string>('');
  const [image1Name, setImage1Name] = useState<string>('');
  const [image2Name, setImage2Name] = useState<string>('');
  const [image1Size, setImage1Size] = useState<number>(0);
  const [image2Size, setImage2Size] = useState<number>(0);
  const [prompt, setPrompt] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);
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
      default: return 'border-purple-400/40 bg-purple-900/20';
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      return 'Only JPG and PNG files are allowed';
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return 'File size must be less than 5MB';
    }
    
    return null;
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (file: File, imageNumber: 1 | 2) => {
    setError('');
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setLocalStatus('error');
      data.onStatusChange?.('error');
      return;
    }

    try {
      setLocalStatus('running');
      data.onStatusChange?.('running');
      
      const base64 = await convertToBase64(file);
      
      if (imageNumber === 1) {
        setImage1Base64(base64);
        setImage1Name(file.name);
        setImage1Size(file.size);
      } else {
        setImage2Base64(base64);
        setImage2Name(file.name);
        setImage2Size(file.size);
      }
      
      setLocalStatus('idle');
      data.onStatusChange?.('idle');
    } catch (err) {
      setError('Failed to process image');
      setLocalStatus('error');
      data.onStatusChange?.('error');
    }
  };

  const handleDrop = (e: React.DragEvent, imageNumber: 1 | 2) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0], imageNumber);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, imageNumber: 1 | 2) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0], imageNumber);
    }
  };

  const handleSendData = useCallback(() => {
    if (!image1Base64 || !image2Base64) {
      setError('Please upload both images before proceeding');
      return;
    }

    const outputData = {
      image1_base64: image1Base64,
      image2_base64: image2Base64,
      prompt: prompt.trim(),
      metadata: {
        image1_name: image1Name,
        image2_name: image2Name,
        image1_size: image1Size,
        image2_size: image2Size,
      },
    };

    setLocalOutputData(outputData);
    setLocalStatus('completed');
    
    data.onOutputDataChange?.(outputData);
    data.onDataOutput?.(outputData);
    data.onStatusChange?.('completed');
  }, [image1Base64, image2Base64, prompt, image1Name, image2Name, image1Size, image2Size, data]);

  const renderUploadZone = (imageNumber: 1 | 2, base64: string, fileName: string) => (
    <div
      className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-purple-400 transition-colors"
      onDrop={(e) => handleDrop(e, imageNumber)}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => document.getElementById(`file-input-${imageNumber}`)?.click()}
    >
      <input
        id={`file-input-${imageNumber}`}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={(e) => handleFileInput(e, imageNumber)}
        className="hidden"
      />
      
      {base64 ? (
        <div className="space-y-2">
          <img 
            src={base64} 
            alt={`Preview ${imageNumber}`}
            className="w-20 h-20 object-cover rounded mx-auto"
          />
          <div className="text-sm text-green-400 flex items-center justify-center gap-1">
            <Check className="w-4 h-4" />
            {fileName}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Upload className="w-8 h-8 mx-auto text-gray-400" />
          <div className="text-sm text-gray-400">
            Upload Image {imageNumber}
            <br />
            <span className="text-xs">JPG, PNG • Max 5MB</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div 
      className={`bg-gray-900/90 backdrop-blur-xl border-2 rounded-2xl shadow-2xl transition-all duration-300 w-80 ${getStatusColor()} ${
        selected ? 'ring-2 ring-purple-400/50 ring-offset-2 ring-offset-gray-900' : ''
      }`}
    >

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

      {/* Input Handle */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-purple-500 border-2 border-white/20 hover:bg-purple-400 transition-colors"
      />

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Upload Zones */}
        <div className="grid grid-cols-2 gap-3">
          {renderUploadZone(1, image1Base64, image1Name)}
          {renderUploadZone(2, image2Base64, image2Name)}
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            Prompt (optional)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to create with these images..."
            className="w-full p-2 rounded-md bg-gray-800 border border-gray-600 text-gray-100 text-sm resize-none"
            rows={2}
            maxLength={200}
          />
          <div className="text-xs text-gray-500 text-right">
            {prompt.length}/200
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-2 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Send Data Button */}
        <Button
          onClick={handleSendData}
          disabled={!image1Base64 || !image2Base64 || localStatus === 'running'}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {localStatus === 'running' ? (
            <>
              <Activity className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Image className="w-4 h-4 mr-2" />
              Send Images
            </>
          )}
        </Button>

        {/* Output Data Preview */}
        {localOutputData && (
          <Collapsible open={isOutputExpanded} onOpenChange={setIsOutputExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between text-gray-300">
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Output Data
                </span>
                {isOutputExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-2">
              <div className="p-3 bg-gray-800/50 rounded border border-gray-600 space-y-2">
                <div className="text-sm">
                  <span className="text-gray-400">Image 1:</span> {localOutputData.metadata?.image1_name}
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Image 2:</span> {localOutputData.metadata?.image2_name}
                </div>
                {localOutputData.prompt && (
                  <div className="text-sm">
                    <span className="text-gray-400">Prompt:</span> {localOutputData.prompt}
                  </div>
                )}
                <div className="text-xs text-green-400">
                  ✓ Both images converted to base64 format
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
    </div>
  );
};

export default ImageUploadNode;
