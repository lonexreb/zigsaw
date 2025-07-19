import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { FileText, Activity, Upload, X, Eye, ChevronDown, ChevronUp, Send, FileCheck } from 'lucide-react';
import { NodeNameHeader } from '../ui/node-name-header';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { documentService } from '@/services/documentService';

interface DocumentNodeProps {
  id: string;
  data: {
    label: string;
    description: string;
    status: 'idle' | 'running' | 'completed' | 'error';
    outputData?: {
      text: string;
      metadata: {
        pageCount: number;
        wordCount: number;
        charCount: number;
        entities?: {
          emails: string[];
          urls: string[];
        };
      };
    };
    onDataOutput?: (data: any) => void;
    onStatusChange?: (status: 'idle' | 'running' | 'completed' | 'error') => void;
    onOutputDataChange?: (outputData: any) => void;
    isWorkflowExecution?: boolean;
  };
  selected?: boolean;
}

const DocumentNode: React.FC<DocumentNodeProps> = ({ id, data, selected }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);
  const [localStatus, setLocalStatus] = useState<'idle' | 'running' | 'completed' | 'error'>(data.status || 'idle');
  const [localOutputData, setLocalOutputData] = useState<any>(data.outputData);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync local state with props, but only for external changes
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

  // Add effect to handle workflow execution
  useEffect(() => {
    if (data.isWorkflowExecution && file && localStatus === 'idle') {
      console.log('🔄 Workflow execution detected, auto-processing document...');
      handleProcessAndSend();
    }
  }, [data.isWorkflowExecution, file, localStatus]);

  const getStatusColor = () => {
    switch (localStatus) {
      case 'running': return 'border-orange-400/60 bg-orange-500/10';
      case 'completed': return 'border-green-400/60 bg-green-500/10';
      case 'error': return 'border-red-400/60 bg-red-500/10';
      default: return 'border-orange-400/40 bg-orange-900/20';
    }
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Check if file is PDF
      if (selectedFile.type !== 'application/pdf') {
        alert('Please upload a PDF file');
        return;
      }
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  }, []);

  const handleProcessAndSend = useCallback(async () => {
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
    }, 200);

    try {
      console.log('📄 Processing document to send:', file.name);
      const result = await documentService.processDocument(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      console.log('✅ Document processed successfully:', result);
      
      const outputData = {
        text: result.text,
        metadata: {
          ...result.metadata,
          source: file.name,
          timestamp: new Date().toISOString()
        }
      };
      
      setLocalOutputData(outputData);
      data.onOutputDataChange?.(outputData);

      // Update node config for workflow execution
      if (data.isWorkflowExecution) {
        console.log('📤 Updating node config for workflow execution');
        const documentData = {
          text: result.text,
          metadata: outputData.metadata
        };
        await fetch('/api/ai-nodes/config/document', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document_data: documentData })
        });
      }
      
      if (data.onDataOutput) {
        console.log('📤 Sending document data to next node:', outputData);
        data.onDataOutput({
          type: 'document_processed',
          text: outputData.text,
          content: outputData.text,
          metadata: outputData.metadata
        });
        console.log('✅ Sent document data to next node');
      }

      setLocalStatus('completed');
      data.onStatusChange?.('completed');
      
      setTimeout(() => {
        setIsOutputExpanded(true);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error processing file:', error);
      clearInterval(progressInterval);
      setLocalStatus('error');
      data.onStatusChange?.('error');
      setUploadProgress(0);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error processing file: ${errorMessage}`);
    }
  }, [file, data.onStatusChange, data.onOutputDataChange, data.onDataOutput, data.isWorkflowExecution]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile);
    } else {
      alert('Please drop a PDF file');
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const clearFile = useCallback(() => {
    setFile(null);
    setLocalOutputData(null);
    setLocalStatus('idle');
    data.onStatusChange?.('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [data.onStatusChange]);



  const truncateText = (text: string, maxLength: number = 200) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div 
      className={`relative w-[320px] min-h-[250px] overflow-auto scrollbar-hide backdrop-blur-xl border-2 rounded-xl p-4 shadow-lg transition-all duration-300 ${getStatusColor()} ${selected ? 'ring-2 ring-orange-400/50' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Node Resizer */}
      <NodeResizer 
        color="#f97316" 
        isVisible={selected}
        minWidth={320}
        minHeight={250}
      />
      
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-orange-600/10 rounded-xl" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-orange-400/30 to-amber-400/30 backdrop-blur-sm border border-orange-400/40">
            <FileText className="w-5 h-5 text-orange-300" />
          </div>
          <div className="flex-1 min-w-0">
            <NodeNameHeader
              nodeId={id}
              originalLabel={data.label}
              className="mb-0"
            >
              {localStatus === 'running' && (
                <Activity className="w-4 h-4 text-orange-400" />
              )}
            </NodeNameHeader>
            <p className="text-xs text-orange-200/70 truncate">{data.description}</p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="space-y-3">
          <div 
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors
              ${file ? 'border-orange-400/60 bg-orange-400/10' : 'border-orange-400/30 hover:border-orange-400/60'}
            `}
          >
            {file ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-200 truncate flex-1">{file.name}</span>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setShowPreview(!showPreview)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={clearFile}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="ghost"
                  className="w-full h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <Upload className="w-6 h-6 text-orange-400" />
                  <span className="text-sm text-orange-200">
                    Click or drag PDF to upload
                  </span>
                </Button>
              </>
            )}
          </div>

          {/* Process and Send Button */}
          {file && (
            <Button
              onClick={handleProcessAndSend}
              className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-200 border border-green-400/30"
              disabled={localStatus === 'running'}
            >
              <Send className="w-4 h-4 mr-2" />
              {localStatus === 'running' ? 'Processing...' : 'Process & Send to Next Node'}
            </Button>
          )}

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-1">
              <Progress value={uploadProgress} className="h-1" />
              <p className="text-xs text-orange-200/70 text-right">{uploadProgress}%</p>
            </div>
          )}

          {/* Output Preview */}
          {localOutputData && (
            <div className="mt-4 space-y-3 overflow-y-auto scrollbar-hide">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-orange-400/10 rounded">
                  <div className="text-orange-200/70">Pages</div>
                  <div className="text-orange-200 font-medium">{localOutputData.metadata.pageCount}</div>
                </div>
                <div className="text-center p-2 bg-orange-400/10 rounded">
                  <div className="text-orange-200/70">Words</div>
                  <div className="text-orange-200 font-medium">{localOutputData.metadata.wordCount.toLocaleString()}</div>
                </div>
                <div className="text-center p-2 bg-orange-400/10 rounded">
                  <div className="text-orange-200/70">Chars</div>
                  <div className="text-orange-200 font-medium">{localOutputData.metadata.charCount.toLocaleString()}</div>
                </div>
              </div>

              {/* Detailed Output Preview */}
              <Collapsible open={isOutputExpanded} onOpenChange={setIsOutputExpanded}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-between p-2 bg-orange-400/10 hover:bg-orange-400/20 text-orange-200"
                  >
                    <div className="flex items-center space-x-2">
                      <FileCheck className="w-4 h-4" />
                      <span>Output Preview</span>
                    </div>
                    {isOutputExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-2 overflow-y-auto scrollbar-hide">
                  {/* Extracted Text Preview */}
                  <div className="bg-slate-900/50 border border-orange-400/20 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-orange-300 font-medium">Extracted Text</span>
                      <span className="text-xs text-orange-200/60">
                        {localOutputData.text.length > 200 ? 'Truncated' : 'Full'}
                      </span>
                    </div>
                    <div className="text-xs text-orange-100 font-mono max-h-32 overflow-y-auto">
                      {truncateText(localOutputData.text)}
                    </div>
                  </div>

                  {/* Entities */}
                  {localOutputData.metadata.entities && (
                    <div className="space-y-2">
                      {localOutputData.metadata.entities.emails?.length > 0 && (
                        <div className="bg-slate-900/50 border border-orange-400/20 rounded p-2">
                          <div className="text-xs text-orange-300 font-medium mb-1">
                            Emails ({localOutputData.metadata.entities.emails.length})
                          </div>
                          <div className="text-xs text-orange-100 space-y-1">
                            {localOutputData.metadata.entities.emails.slice(0, 3).map((email: string, i: number) => (
                              <div key={i} className="font-mono">{email}</div>
                            ))}
                            {localOutputData.metadata.entities.emails.length > 3 && (
                              <div className="text-orange-200/60">
                                +{localOutputData.metadata.entities.emails.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {localOutputData.metadata.entities.urls?.length > 0 && (
                        <div className="bg-slate-900/50 border border-orange-400/20 rounded p-2">
                          <div className="text-xs text-orange-300 font-medium mb-1">
                            URLs ({localOutputData.metadata.entities.urls.length})
                          </div>
                          <div className="text-xs text-orange-100 space-y-1">
                            {localOutputData.metadata.entities.urls.slice(0, 2).map((url: string, i: number) => (
                              <div key={i} className="font-mono truncate">{url}</div>
                            ))}
                            {localOutputData.metadata.entities.urls.length > 2 && (
                              <div className="text-orange-200/60">
                                +{localOutputData.metadata.entities.urls.length - 2} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-between text-xs mt-4">
          <span className="text-orange-300/80">Document Processing</span>
          <div className={`w-2 h-2 rounded-full ${
            localStatus === 'running' ? 'bg-orange-400' :
            localStatus === 'completed' ? 'bg-green-400' :
            localStatus === 'error' ? 'bg-red-400' :
            'bg-orange-400/50'
          }`} />
        </div>
      </div>

      {/* Connection Handles */}
      <Handle type="target" position={Position.Left} className="w-3 h-3 border-2 border-orange-400 bg-orange-900" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 border-2 border-orange-400 bg-orange-900" />
    </div>
  );
};

export default DocumentNode; 