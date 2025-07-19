import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Globe, Activity, Send, X, Eye, ChevronDown, ChevronUp, Settings, ExternalLink } from 'lucide-react';
import { NodeNameHeader } from '../ui/node-name-header';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { createFirecrawlService } from '@/services/firecrawlService';

interface FirecrawlNodeProps {
  id: string;
  data: {
    label: string;
    description: string;
    status: 'idle' | 'running' | 'completed' | 'error';
    outputData?: {
      success: boolean;
      operation: string;
      url: string;
      data?: any;
      error?: string;
      job_id?: string;
      pages_count?: number;
      urls_found?: number;
      urls?: string[];
    };
    onDataOutput?: (data: any) => void;
    onStatusChange?: (status: 'idle' | 'running' | 'completed' | 'error') => void;
    onOutputDataChange?: (outputData: any) => void;
  };
  selected?: boolean;
}

const FirecrawlNode: React.FC<FirecrawlNodeProps> = ({ id, data, selected }) => {
  const [url, setUrl] = useState('');
  const [operation, setOperation] = useState('scrape');
  const [formats, setFormats] = useState(['markdown']);
  const [showPreview, setShowPreview] = useState(false);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [localStatus, setLocalStatus] = useState<'idle' | 'running' | 'completed' | 'error'>(data.status || 'idle');
  const [localOutputData, setLocalOutputData] = useState<any>(data.outputData);

  // Configuration options
  const [onlyMainContent, setOnlyMainContent] = useState(false);
  const [limit, setLimit] = useState(10);
  const [includePaths, setIncludePaths] = useState('');
  const [excludePaths, setExcludePaths] = useState('');
  const [extractionPrompt, setExtractionPrompt] = useState('');
  const [includeSubdomains, setIncludeSubdomains] = useState(false);

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
      default: return 'border-orange-400/40 bg-orange-900/20';
    }
  };

  const handleExecute = useCallback(async () => {
    if (!url.trim()) {
      alert('Please enter a URL to process');
      return;
    }

    setLocalStatus('running');
    data.onStatusChange?.('running');

    try {
      const firecrawlService = createFirecrawlService(id);
      let result;

      if (operation === 'scrape') {
        const requestData = {
          url: url.trim(),
          formats: formats,
          only_main_content: onlyMainContent,
          extraction_prompt: extractionPrompt.trim() || undefined,
        };
        result = await firecrawlService.scrapeUrl(requestData);
      } else if (operation === 'crawl') {
        const requestData = {
          url: url.trim(),
          limit: limit,
          include_paths: includePaths.trim() ? includePaths.split(',').map(p => p.trim()) : undefined,
          exclude_paths: excludePaths.trim() ? excludePaths.split(',').map(p => p.trim()) : undefined,
        };
        result = await firecrawlService.crawlUrl(requestData);
      } else if (operation === 'map') {
        const requestData = {
          url: url.trim(),
          limit: limit,
          include_subdomains: includeSubdomains,
        };
        result = await firecrawlService.mapUrl(requestData);
      } else {
        throw new Error(`Unsupported operation: ${operation}`);
      }

      setLocalOutputData(result);
      data.onOutputDataChange?.(result);

      // Send data to next node
      if (data.onDataOutput && result.success) {
        data.onDataOutput({
          type: 'firecrawl_processed',
          operation: operation,
          url: url,
          data: result.data,
          timestamp: new Date().toISOString()
        });
      }

      setLocalStatus(result.success ? 'completed' : 'error');
      data.onStatusChange?.(result.success ? 'completed' : 'error');

      if (!result.success) {
        console.error('Firecrawl operation failed:', result.error);
      }

    } catch (error) {
      setLocalStatus('error');
      data.onStatusChange?.('error');
      console.error('Firecrawl operation error:', error);
      
      // Set error output data
      const errorData = {
        success: false,
        operation: operation,
        url: url,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setLocalOutputData(errorData);
      data.onOutputDataChange?.(errorData);
    }
  }, [id, url, operation, formats, onlyMainContent, limit, includePaths, excludePaths, extractionPrompt, includeSubdomains, data]);

  const operationOptions = [
    { value: 'scrape', label: 'Scrape (Single Page)', description: 'Extract content from a single URL' },
    { value: 'crawl', label: 'Crawl (Website)', description: 'Crawl entire website and extract content' },
    { value: 'map', label: 'Map (URLs Only)', description: 'Get all URLs from a website' }
  ];

  const formatOptions = [
    { value: 'markdown', label: 'Markdown' },
    { value: 'html', label: 'HTML' },
    { value: 'json', label: 'JSON (Structured)' }
  ];

  const toggleFormat = (format: string) => {
    setFormats(prev => 
      prev.includes(format) 
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
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
          <Globe className="w-5 h-5" />
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
            {/* Operation Type */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Operation
              </label>
              <Select value={operation} onValueChange={setOperation}>
                <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {operationOptions.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      <div>
                        <div className="font-medium">{op.label}</div>
                        <div className="text-xs text-gray-400">{op.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Output Formats */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Output Formats
              </label>
              <div className="flex flex-wrap gap-2">
                {formatOptions.map((format) => (
                  <Button
                    key={format.value}
                    variant={formats.includes(format.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFormat(format.value)}
                    className={`text-xs ${formats.includes(format.value) 
                      ? 'bg-orange-600 hover:bg-orange-500' 
                      : 'border-gray-600 text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {format.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Operation-specific options */}
            {operation === 'scrape' && (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">
                    Only Main Content
                  </label>
                  <Switch 
                    checked={onlyMainContent} 
                    onCheckedChange={setOnlyMainContent}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Extraction Prompt (Optional)
                  </label>
                  <Textarea
                    value={extractionPrompt}
                    onChange={(e) => setExtractionPrompt(e.target.value)}
                    placeholder="Tell Firecrawl what specific data to extract. Example: 'Extract all product names and prices' or 'Get contact information'"
                    className="bg-gray-800/50 border-gray-600 text-white text-sm"
                    rows={2}
                  />
                </div>
              </>
            )}

            {(operation === 'crawl' || operation === 'map') && (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Page Limit
                </label>
                <Input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
                  min={1}
                  max={100}
                  className="bg-gray-800/50 border-gray-600 text-white"
                />
              </div>
            )}

            {operation === 'crawl' && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Include Paths (comma-separated)
                  </label>
                  <Input
                    value={includePaths}
                    onChange={(e) => setIncludePaths(e.target.value)}
                    placeholder="/blog, /products"
                    className="bg-gray-800/50 border-gray-600 text-white"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Exclude Paths (comma-separated)
                  </label>
                  <Input
                    value={excludePaths}
                    onChange={(e) => setExcludePaths(e.target.value)}
                    placeholder="/admin, /private"
                    className="bg-gray-800/50 border-gray-600 text-white"
                  />
                </div>
              </>
            )}

            {operation === 'map' && (
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  Include Subdomains
                </label>
                <Switch 
                  checked={includeSubdomains} 
                  onCheckedChange={setIncludeSubdomains}
                />
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* URL Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            Target URL
          </label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter website URL to scrape. Example: https://news.ycombinator.com or https://example.com"
            className="bg-gray-800/50 border-gray-600 text-white"
          />
        </div>

        {/* Execute Button */}
        <Button
          onClick={handleExecute}
          disabled={!url.trim() || localStatus === 'running'}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-50"
        >
          <Send className="w-4 h-4 mr-2" />
          {localStatus === 'running' ? 'Processing...' : `${operation.charAt(0).toUpperCase() + operation.slice(1)} URL`}
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
              {localStatus === 'running' ? `${operation}ing URL...` :
               localStatus === 'completed' ? 'Processing complete' : 'Processing failed'}
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
            <CollapsibleContent className="mt-2">
              <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-600 space-y-2">
                <div className="text-xs text-gray-400 grid grid-cols-2 gap-2">
                  <div>Operation: {localOutputData.operation}</div>
                  <div>Status: {localOutputData.success ? 'Success' : 'Failed'}</div>
                  {localOutputData.pages_count && (
                    <div>Pages: {localOutputData.pages_count}</div>
                  )}
                  {localOutputData.urls_found && (
                    <div>URLs: {localOutputData.urls_found}</div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400 flex items-center space-x-1">
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate">{localOutputData.url}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(true)}
                    className="border-gray-600 text-gray-300 hover:text-white hover:bg-white/5 text-xs px-2 py-1"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
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
          <div className="bg-gray-900 border border-gray-600 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>Firecrawl Result</span>
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
            
            <div className="space-y-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400">Operation</div>
                  <div className="text-white font-medium">{localOutputData.operation}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400">URL</div>
                  <div className="text-white text-xs truncate">{localOutputData.url}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400">Status</div>
                  <div className={`font-medium ${localOutputData.success ? 'text-green-400' : 'text-red-400'}`}>
                    {localOutputData.success ? 'Success' : 'Failed'}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-2">Result Data:</div>
                <pre className="text-white text-xs whitespace-pre-wrap overflow-x-auto bg-gray-900/50 rounded p-3">
                  {JSON.stringify(localOutputData.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirecrawlNode;