import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch, Settings, Eye, X, Activity, Plus, Trash2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface RouterNodeProps {
  id: string;
  data: {
    label: string;
    description: string;
    status: 'idle' | 'running' | 'completed' | 'error';
    inputData?: any;
    outputData?: any;
    onDataOutput?: (data: any, outputPath?: string) => void;
    onStatusChange?: (status: 'idle' | 'running' | 'completed' | 'error') => void;
    onOutputDataChange?: (outputData: any) => void;
    isWorkflowExecution?: boolean;
  };
  selected: boolean;
}

interface OutputPath {
  id: string;
  name: string;
  color: string;
}

const RouterNode: React.FC<RouterNodeProps> = ({ id, data, selected }) => {
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Natural language routing logic
  const [routingLogic, setRoutingLogic] = useState('Route to Path A if priority is high, Path B if urgent, otherwise Path C');
  
  // Output paths configuration
  const [outputPaths, setOutputPaths] = useState<OutputPath[]>([
    { id: 'path-a', name: 'Path A', color: '#ef4444' },
    { id: 'path-b', name: 'Path B', color: '#f97316' },
    { id: 'path-c', name: 'Path C', color: '#22c55e' },
  ]);
  
  // State management
  const [localStatus, setLocalStatus] = useState<'idle' | 'running' | 'completed' | 'error'>(data.status || 'idle');
  const [localOutputData, setLocalOutputData] = useState<any>(data.outputData);
  const [routingHistory, setRoutingHistory] = useState<any[]>([]);
  const [activeOutput, setActiveOutput] = useState<string | null>(null);

  // Sync with props
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

  // Auto-execute during workflow execution
  useEffect(() => {
    if (data.isWorkflowExecution && data.inputData && localStatus === 'idle') {
      console.log('🔄 Workflow execution detected, auto-routing data...');
      handleRoute();
    }
  }, [data.isWorkflowExecution, data.inputData, localStatus]);

  const updateStatus = useCallback((status: 'idle' | 'running' | 'completed' | 'error') => {
    setLocalStatus(status);
    data.onStatusChange?.(status);
  }, [data]);

  const updateOutputData = useCallback((outputData: any) => {
    setLocalOutputData(outputData);
    data.onOutputDataChange?.(outputData);
    data.onDataOutput?.(outputData);
  }, [data]);

  const getStatusColor = () => {
    switch (localStatus) {
      case 'running': return 'border-orange-400/60 bg-orange-500/10';
      case 'completed': return 'border-green-400/60 bg-green-500/10';
      case 'error': return 'border-red-400/60 bg-red-500/10';
      default: return 'border-purple-400/40 bg-purple-900/20';
    }
  };

  const getStatusIcon = () => {
    switch (localStatus) {
      case 'running': return <Activity className="w-4 h-4 animate-spin" />;
      case 'completed': return <GitBranch className="w-4 h-4 text-green-400" />;
      case 'error': return <X className="w-4 h-4 text-red-400" />;
      default: return <GitBranch className="w-4 h-4" />;
    }
  };

  // Simple natural language routing logic
  const determineOutputPath = useCallback((inputData: any) => {
    const logic = routingLogic.toLowerCase();
    const dataStr = JSON.stringify(inputData).toLowerCase();
    
    // Simple keyword matching for routing decisions
    if (logic.includes('path a') && (
      dataStr.includes('high') || 
      dataStr.includes('priority') || 
      dataStr.includes('urgent')
    )) {
      return outputPaths.find(p => p.id === 'path-a') || outputPaths[0];
    }
    
    if (logic.includes('path b') && (
      dataStr.includes('medium') || 
      dataStr.includes('normal') || 
      dataStr.includes('standard')
    )) {
      return outputPaths.find(p => p.id === 'path-b') || outputPaths[1];
    }
    
    // Default to Path C or last path
    return outputPaths.find(p => p.id === 'path-c') || outputPaths[outputPaths.length - 1];
  }, [routingLogic, outputPaths]);

  const handleRoute = useCallback(async () => {
    if (isExecuting) return;

    try {
      setIsExecuting(true);
      updateStatus('running');
      setActiveOutput(null);

      console.log('🔀 Starting natural language routing...');

      const inputData = data.inputData || { type: 'test', priority: 'normal' };
      
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const selectedPath = determineOutputPath(inputData);
      setActiveOutput(selectedPath.id);
      
      // Simulate routing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const routedData = {
        type: 'routed_data',
        originalData: inputData,
        selectedPath: selectedPath,
        routingLogic: routingLogic,
        timestamp: new Date().toISOString(),
        routerId: id
      };

      const historyEntry = {
        timestamp: new Date().toISOString(),
        selectedPath: selectedPath,
        inputData,
        reasoning: `Routed to ${selectedPath.name} based on natural language logic`
      };

      setRoutingHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10
      updateOutputData(routedData);
      updateStatus('completed');

      console.log('✅ Data routed to:', selectedPath.name);

      // Call the specific output handler
      data.onDataOutput?.(routedData, selectedPath.id);

    } catch (error) {
      console.error('❌ Routing error:', error);
      updateStatus('error');
    } finally {
      setIsExecuting(false);
      // Keep active output visible for a moment
      setTimeout(() => setActiveOutput(null), 2000);
    }
  }, [isExecuting, data.inputData, determineOutputPath, updateStatus, updateOutputData, routingLogic, id, data]);

  const addOutputPath = useCallback(() => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
    const newPath: OutputPath = {
      id: `path-${Date.now()}`,
      name: `Path ${String.fromCharCode(65 + outputPaths.length)}`,
      color: colors[outputPaths.length % colors.length]
    };
    setOutputPaths(prev => [...prev, newPath]);
  }, [outputPaths.length]);

  const removeOutputPath = useCallback((pathId: string) => {
    if (outputPaths.length > 2) { // Keep at least 2 paths
      setOutputPaths(prev => prev.filter(p => p.id !== pathId));
    }
  }, [outputPaths.length]);

  const updateOutputPath = useCallback((pathId: string, updates: Partial<OutputPath>) => {
    setOutputPaths(prev => prev.map(path => 
      path.id === pathId ? { ...path, ...updates } : path
    ));
  }, []);

  // Calculate node height based on number of outputs
  const nodeHeight = Math.max(200, 80 + (outputPaths.length * 25));

  return (
    <div 
      className="relative transition-all duration-300"
      style={{ width: '280px', minHeight: `${nodeHeight}px` }}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 bg-gradient-to-r from-purple-500 to-indigo-500 border-2 border-purple-300 rounded-full shadow-lg"
        style={{ top: '50%' }}
      />

      {/* Output Handles */}
      {outputPaths.map((path, index) => (
        <Handle
          key={path.id}
          type="source"
          position={Position.Right}
          id={path.id}
          className={`w-4 h-4 border-2 rounded-full shadow-lg transition-all duration-300 ${
            activeOutput === path.id 
              ? 'animate-pulse scale-125' 
              : 'hover:scale-110'
          }`}
          style={{ 
            top: `${30 + (index * 25)}%`,
            backgroundColor: path.color,
            borderColor: path.color,
          }}
          title={`${path.name}: Natural language routing`}
        />
      ))}

      {/* Main container */}
      <motion.div
        className={`
          w-full min-h-full rounded-xl border-2 backdrop-blur-xl shadow-2xl transition-all duration-300
          ${selected 
            ? 'border-purple-400 shadow-lg shadow-purple-500/20' 
            : 'border-purple-500 hover:border-purple-400 hover:shadow-md hover:shadow-purple-500/10'
          }
          ${getStatusColor()}
        `}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-3 border-b border-purple-400/30 cursor-pointer"
          onClick={() => setIsConfigExpanded(true)}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 backdrop-blur-sm">
              <GitBranch className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-purple-200">
                {data.label || 'Smart Router'}
              </h3>
              <p className="text-xs text-purple-300 opacity-80">
                {data.description || 'Natural language routing'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {getStatusIcon()}
            <span className="text-xs text-purple-200 capitalize bg-purple-500/20 px-2 py-1 rounded border border-purple-400/30">
              {localStatus}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Routing Logic Display */}
          <div className="bg-slate-800/50 border border-purple-400/30 rounded-lg p-3">
            <div className="text-xs text-purple-300 mb-1">Routing Logic:</div>
            <div className="text-xs text-purple-100 italic">
              "{routingLogic}"
            </div>
          </div>

          {/* Output Paths */}
          <div className="space-y-2">
            <div className="text-xs text-purple-300 font-medium">Output Paths:</div>
            {outputPaths.map((path) => (
              <motion.div
                key={path.id}
                className={`
                  flex items-center justify-between p-2 rounded border transition-all duration-200
                  ${activeOutput === path.id 
                    ? 'border-yellow-400 bg-yellow-400/10 animate-pulse' 
                    : 'border-purple-400/30 bg-purple-500/10'
                  }
                `}
                animate={activeOutput === path.id ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 0.5, repeat: activeOutput === path.id ? Infinity : 0 }}
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: path.color, borderColor: path.color }}
                  />
                  <span className="text-xs text-purple-100">{path.name}</span>
                </div>
                {activeOutput === path.id && (
                  <ArrowRight className="w-3 h-3 text-yellow-400 animate-bounce" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className="text-xs text-purple-200 capitalize">{localStatus}</span>
            </div>
            <Button
              onClick={handleRoute}
              disabled={isExecuting}
              size="sm"
              className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-200"
            >
              {isExecuting ? <Activity className="w-3 h-3 animate-spin" /> : <GitBranch className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Configuration Modal */}
      {isConfigExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-slate-900/95 backdrop-blur-xl border border-purple-400/30 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-purple-200 flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Smart Router Configuration</span>
              </h3>
              <Button
                onClick={() => setIsConfigExpanded(false)}
                variant="ghost"
                size="sm"
                className="text-purple-400 hover:text-purple-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Natural Language Routing Logic */}
              <div>
                <Label className="text-purple-300 text-sm">Natural Language Routing Logic</Label>
                <Textarea
                  value={routingLogic}
                  onChange={(e) => setRoutingLogic(e.target.value)}
                  className="bg-slate-800/50 border-purple-400/30 text-purple-100 mt-1"
                  placeholder="Describe how data should be routed (e.g., 'Route to Path A if priority is high, Path B if normal, otherwise Path C')"
                  rows={3}
                />
                <p className="text-xs text-purple-400/70 mt-1">
                  Describe your routing logic in plain English. The system will analyze incoming data and route accordingly.
                </p>
              </div>

              {/* Output Paths Configuration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-purple-300 text-sm">Output Paths</Label>
                  <Button
                    onClick={addOutputPath}
                    size="sm"
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-200"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Path
                  </Button>
                </div>
                <div className="space-y-2">
                  {outputPaths.map((path) => (
                    <div key={path.id} className="flex items-center space-x-2 p-2 bg-slate-800/30 border border-purple-400/20 rounded">
                      <div 
                        className="w-4 h-4 rounded-full border-2"
                        style={{ backgroundColor: path.color, borderColor: path.color }}
                      />
                      <Input
                        value={path.name}
                        onChange={(e) => updateOutputPath(path.id, { name: e.target.value })}
                        className="flex-1 bg-slate-700/50 border-purple-400/30 text-purple-100 text-sm"
                        placeholder="Path name"
                      />
                      {outputPaths.length > 2 && (
                        <Button
                          onClick={() => removeOutputPath(path.id)}
                          size="sm"
                          variant="ghost"
                          className="w-6 h-6 p-0 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={() => setIsConfigExpanded(false)}
                  className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200"
                >
                  Save Configuration
                </Button>
                <Button
                  onClick={handleRoute}
                  disabled={isExecuting}
                  className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-200"
                >
                  {isExecuting ? <Activity className="w-4 h-4 animate-spin mr-2" /> : <GitBranch className="w-4 h-4 mr-2" />}
                  Test Route
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Routing History Modal */}
      {isOutputExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-slate-900/95 backdrop-blur-xl border border-purple-400/30 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-purple-200 flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>Routing History ({routingHistory.length})</span>
              </h3>
              <Button
                onClick={() => setIsOutputExpanded(false)}
                variant="ghost"
                size="sm"
                className="text-purple-400 hover:text-purple-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="overflow-y-auto max-h-96 border border-purple-400/20 rounded p-3 bg-slate-800/30">
              {routingHistory.length === 0 ? (
                <div className="text-center text-purple-400/60 py-8">
                  No routing history yet. Execute the router to see results.
                </div>
              ) : (
                <div className="space-y-3">
                  {routingHistory.map((entry, index) => (
                    <div key={index} className="p-3 bg-slate-700/30 border border-purple-400/20 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-purple-300">{entry.selectedPath.name}</span>
                        <span className="text-xs text-purple-400/70">{entry.timestamp}</span>
                      </div>
                      <div className="text-xs text-purple-200/80">
                        {entry.reasoning}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Floating action buttons */}
      <div className="absolute -top-2 -right-2 flex space-x-1">
        <Button
          onClick={() => setIsConfigExpanded(true)}
          size="sm"
          className="w-6 h-6 p-0 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30"
          title="Configure Smart Router"
        >
          <Settings className="w-3 h-3 text-purple-300" />
        </Button>
        
        {routingHistory.length > 0 && (
          <Button
            onClick={() => setIsOutputExpanded(true)}
            size="sm"
            className="w-6 h-6 p-0 rounded-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30"
            title="View History"
          >
            <Eye className="w-3 h-3 text-blue-300" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default RouterNode; 