import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Repeat, Play, Pause, Settings, Eye, Activity, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';



interface LoopNodeProps {
  id: string;
  data: {
    label: string;
    description: string;
    status: 'idle' | 'running' | 'completed' | 'error';
    inputData?: any;
    outputData?: any;
    onDataOutput?: (data: any) => void;
    onStatusChange?: (status: 'idle' | 'running' | 'completed' | 'error') => void;
    onOutputDataChange?: (outputData: any) => void;
    isWorkflowExecution?: boolean;
  };
  selected: boolean;
}

const LoopNode: React.FC<LoopNodeProps> = ({ data }) => {
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Loop configuration
  const [iterations, setIterations] = useState(3);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [totalIterations, setTotalIterations] = useState(0);
  
  // State management
  const [localStatus, setLocalStatus] = useState<'idle' | 'running' | 'completed' | 'error'>(data.status || 'idle');
  const [localOutputData, setLocalOutputData] = useState<any>(data.outputData);
  const [loopResults, setLoopResults] = useState<any[]>([]);

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
      console.log('🔄 Workflow execution detected, auto-executing loop...');
      handleExecute();
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
      case 'running': return 'border-cyan-400/60 bg-cyan-500/10';
      case 'completed': return 'border-green-400/60 bg-green-500/10';
      case 'error': return 'border-red-400/60 bg-red-500/10';
      default: return 'border-cyan-400/40 bg-cyan-900/20';
    }
  };

  const getStatusIcon = () => {
    switch (localStatus) {
      case 'running': return <Activity className="w-4 h-4 animate-spin" />;
      case 'completed': return <Play className="w-4 h-4 text-green-400" />;
      case 'error': return <Pause className="w-4 h-4 text-red-400" />;
      default: return <Repeat className="w-4 h-4" />;
    }
  };

  const executeLoop = useCallback(async (inputData: any) => {
    try {
      setTotalIterations(iterations);
      const results: any[] = [];

      // Process each iteration
      for (let i = 0; i < iterations; i++) {
        setCurrentIteration(i + 1);
        
        // Simulate processing each iteration
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const result = {
          iteration: i + 1,
          inputData: inputData,
          processed: true,
          timestamp: new Date().toISOString()
        };
        
        results.push(result);
      }

      return {
        type: 'loop_completed',
        totalIterations: iterations,
        results,
        inputData,
        loopConfig: {
          iterations
        }
      };

    } catch (error) {
      throw new Error(`Loop execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [iterations]);

  const handleExecute = useCallback(async () => {
    if (isExecuting) return;

    try {
      setIsExecuting(true);
      updateStatus('running');
      setCurrentIteration(0);
      setTotalIterations(0);
      setLoopResults([]);

      console.log('🔄 Starting loop execution with config:', {
        iterations,
        inputData: data.inputData
      });

      const inputData = data.inputData || { items: [1, 2, 3, 4, 5] }; // Default data for testing
      const result = await executeLoop(inputData);
      
      setLoopResults(result.results);
      updateOutputData(result);
      updateStatus('completed');

      console.log('✅ Loop execution completed:', result);

    } catch (error) {
      console.error('❌ Loop execution error:', error);
      updateStatus('error');
    } finally {
      setIsExecuting(false);
    }
  }, [isExecuting, data.inputData, executeLoop, updateStatus, updateOutputData, iterations]);

  const progress = totalIterations > 0 ? (currentIteration / totalIterations) * 100 : 0;

  return (
    <div 
      className={`relative flex items-center justify-center transition-all duration-300`}
      style={{ width: '240px', height: '240px' }}
    >


      {/* Main circular container */}
      <div className={`relative w-full h-full rounded-full backdrop-blur-xl border-4 shadow-2xl transition-all duration-300 ${getStatusColor()}`}>
        
        {/* Animated background gradient */}
        <div className="absolute inset-0 rounded-full opacity-30">
          <motion.div
            className="w-full h-full rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-500/30"
            animate={{
              background: [
                'radial-gradient(circle, rgba(34, 211, 238, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)',
                'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(34, 211, 238, 0.3) 100%)'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          />
        </div>

        {/* Outermost rotating ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-cyan-300/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        >
          {/* Outer ring arrows */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, index) => (
            <div
              key={index}
              className="absolute flex items-center justify-center text-cyan-400/70"
              style={{
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-115px) rotate(${angle}deg)`,
              }}
            >
              <motion.div
                animate={{ 
                  scale: [0.8, 1, 0.8],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity, 
                  delay: index * 0.1,
                  ease: "easeInOut"
                }}
                className="text-xs"
              >
                →
              </motion.div>
            </div>
          ))}
        </motion.div>

        {/* Progress ring - fills up during iterations */}
        {isExecuting && (
          <svg
            className="absolute inset-1 w-full h-full"
            style={{ transform: 'rotate(-90deg)' }}
          >
            <circle
              cx="50%"
              cy="50%"
              r="48%"
              fill="none"
              stroke="rgba(34, 211, 238, 0.2)"
              strokeWidth="4"
            />
            <motion.circle
              cx="50%"
              cy="50%"
              r="48%"
              fill="none"
              stroke="rgba(34, 211, 238, 0.8)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 0.48 * 240}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 0.48 * 240 }}
              animate={{ 
                strokeDashoffset: 2 * Math.PI * 0.48 * 240 * (1 - progress / 100)
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </svg>
        )}

        {/* Second rotating ring with prominent arrows */}
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-cyan-400/40"
          animate={{ rotate: -360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          {/* Large directional arrows */}
          {[0, 60, 120, 180, 240, 300].map((angle, index) => (
            <div
              key={index}
              className="absolute flex items-center justify-center text-cyan-400"
              style={{
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-50px) rotate(${angle}deg)`,
              }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  delay: index * 0.3,
                  ease: "easeInOut"
                }}
                className="text-xl font-bold"
              >
                ➤
              </motion.div>
            </div>
          ))}
        </motion.div>

        {/* Third rotating ring with arrows */}
        <motion.div
          className="absolute inset-4 rounded-full border-2 border-dashed border-cyan-300/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          {/* Curved arrows */}
          {[0, 90, 180, 270].map((angle, index) => (
            <div
              key={index}
              className="absolute flex items-center justify-center text-cyan-300"
              style={{
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-40px) rotate(${angle}deg)`,
              }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 15, 0]
                }}
                transition={{ 
                  duration: 1.8, 
                  repeat: Infinity, 
                  delay: index * 0.2,
                  ease: "easeInOut"
                }}
                className="text-sm"
              >
                ↷
              </motion.div>
            </div>
          ))}
        </motion.div>

        {/* Inner rotating loop arrows */}
        <motion.div
          className="absolute inset-8 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          {[0, 120, 240].map((angle, index) => (
            <div
              key={index}
              className="absolute w-6 h-6 flex items-center justify-center text-cyan-300"
              style={{
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-30px) rotate(-${angle}deg)`,
              }}
            >
              <motion.div
                animate={{ 
                  rotateZ: [0, 360],
                  scale: [1, 1.3, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  delay: index * 0.3,
                  ease: "easeInOut"
                }}
                className="text-lg"
              >
                🔄
              </motion.div>
            </div>
          ))}
        </motion.div>

        {/* Central content area */}
        <div 
          className="absolute inset-12 rounded-full bg-slate-900/80 backdrop-blur-sm border border-cyan-400/30 flex flex-col items-center justify-center p-4 cursor-pointer"
          title={`Loop ${iterations} times`}
          onClick={() => setIsConfigExpanded(true)}
        >
          {/* Main icon and status */}
          <motion.div 
            className="flex flex-col items-center space-y-2 text-center"
            animate={isExecuting ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <div className="text-cyan-300 mb-1">
              {getStatusIcon()}
            </div>
            <div className="text-xs font-bold text-cyan-200 leading-tight">
              LOOP
            </div>
            <div className="text-xs text-cyan-400/80 leading-tight">
              {iterations}x
            </div>
            
            {/* Iteration counter during execution */}
            {isExecuting && (
              <div className="w-full mt-2 text-center">
                <div className="text-xs text-cyan-300 font-semibold">
                  {currentIteration}/{totalIterations}
                </div>
                <div className="text-xs text-cyan-400/60 mt-1">
                  {Math.round(progress)}% Complete
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Pulsing outer glow during execution */}
        {isExecuting && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-cyan-400/60"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>

      {/* Input Handle - positioned on the left side of circle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-6 h-6 bg-gradient-to-r from-cyan-500 to-blue-500 border-3 border-cyan-300 rounded-full shadow-lg"
        style={{ left: '8px' }}
      />

      {/* Output Handle - positioned on the right side of circle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-6 h-6 bg-gradient-to-r from-cyan-500 to-blue-500 border-3 border-cyan-300 rounded-full shadow-lg"
        style={{ right: '8px' }}
      />

      {/* Configuration Modal */}
      {isConfigExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-slate-900/95 backdrop-blur-xl border border-cyan-400/30 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-cyan-200 flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Loop Configuration</span>
              </h3>
              <Button
                onClick={() => setIsConfigExpanded(false)}
                variant="ghost"
                size="sm"
                className="text-cyan-400 hover:text-cyan-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Simple Iterations Input */}
              <div>
                <Label className="text-cyan-300 text-sm">Number of Iterations</Label>
                <Input
                  type="number"
                  value={iterations}
                  onChange={(e) => setIterations(parseInt(e.target.value) || 1)}
                  min={1}
                  max={100}
                  className="bg-slate-800/50 border-cyan-400/30 text-cyan-100"
                  placeholder="How many times to loop"
                />
                <p className="text-xs text-cyan-400/70 mt-1">
                  The loop will repeat this many times
                </p>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={() => setIsConfigExpanded(false)}
                  className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200"
                >
                  Save Configuration
                </Button>
                <Button
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-200"
                >
                  {isExecuting ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Execute
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Output Modal */}
      {isOutputExpanded && localOutputData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-slate-900/95 backdrop-blur-xl border border-cyan-400/30 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-cyan-200 flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>Loop Results ({loopResults.length} iterations)</span>
              </h3>
              <Button
                onClick={() => setIsOutputExpanded(false)}
                variant="ghost"
                size="sm"
                className="text-cyan-400 hover:text-cyan-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="overflow-y-auto max-h-96 border border-cyan-400/20 rounded p-3 bg-slate-800/30">
              <div className="text-xs text-cyan-100 space-y-2">
                {loopResults.map((result, index) => (
                  <div key={index} className="border-b border-cyan-400/10 pb-2 last:border-b-0">
                    <div className="font-semibold text-cyan-300">
                      Iteration {result.iteration}
                    </div>
                    <div className="text-cyan-100/80">
                      Status: {result.processed ? 'Completed' : 'Pending'}
                    </div>
                    <div className="text-cyan-100/60 text-xs">
                      {result.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Floating action buttons inside the circle */}
      <div className="absolute top-6 right-8 flex flex-col space-y-2">
        <Button
          onClick={() => setIsConfigExpanded(true)}
          size="sm"
          className="w-8 h-8 p-0 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30"
          title="Configure Loop"
        >
          <Settings className="w-3 h-3 text-cyan-300" />
        </Button>
        
        {localOutputData && (
          <Button
            onClick={() => setIsOutputExpanded(true)}
            size="sm"
            className="w-8 h-8 p-0 rounded-full bg-green-500/20 hover:bg-green-500/30 border border-green-400/30"
            title="View Results"
          >
            <Eye className="w-3 h-3 text-green-300" />
          </Button>
        )}
        
        <Button
          onClick={handleExecute}
          disabled={isExecuting}
          size="sm"
          className="w-8 h-8 p-0 rounded-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30"
          title="Execute Loop"
        >
          {isExecuting ? <Activity className="w-3 h-3 animate-spin text-blue-300" /> : <Play className="w-3 h-3 text-blue-300" />}
        </Button>
      </div>
    </div>
  );
};

export default LoopNode; 