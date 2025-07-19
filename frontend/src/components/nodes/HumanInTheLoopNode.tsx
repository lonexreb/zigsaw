import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { User, Play, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';

interface HumanInTheLoopNodeProps {
  id: string;
  data: {
    label: string;
    description: string;
    status: 'idle' | 'running' | 'completed' | 'error';
    outputData?: any;
    onDataOutput?: (data: any) => void;
    onStatusChange?: (status: 'idle' | 'running' | 'completed' | 'error') => void;
    onOutputDataChange?: (outputData: any) => void;
    isWorkflowExecution?: boolean;
  };
  selected?: boolean;
}

const HumanInTheLoopNode: React.FC<HumanInTheLoopNodeProps> = ({ id, data, selected }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [localStatus, setLocalStatus] = useState<'idle' | 'running' | 'completed' | 'error'>(data.status || 'idle');

  useEffect(() => {
    if (data.status && data.status !== localStatus) {
      setLocalStatus(data.status);
    }
  }, [data.status]);

  const handleUserInput = useCallback(() => {
    if (!userInput.trim()) return;

    setIsPending(true);
    setLocalStatus('running');
    data.onStatusChange?.('running');

    // Simulate processing time
    setTimeout(() => {
      const outputData = {
        type: 'human_input',
        userInput: userInput.trim(),
        feedback: feedback.trim(),
        timestamp: new Date().toISOString(),
        nodeId: id
      };

      setLocalStatus('completed');
      data.onStatusChange?.('completed');
      data.onOutputDataChange?.(outputData);
      data.onDataOutput?.(outputData);
      
      setIsPending(false);
      setIsDialogOpen(false);
      setUserInput('');
      setFeedback('');
    }, 500);
  }, [userInput, feedback, id, data]);

  const getStatusColor = () => {
    switch (localStatus) {
      case 'running': return 'text-amber-400';
      case 'completed': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-green-500';
    }
  };

  const getStatusIcon = () => {
    switch (localStatus) {
      case 'running': return <Clock className="w-4 h-4 animate-spin" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative">
      <NodeResizer
        color={selected ? '#10b981' : 'transparent'}
        isVisible={selected}
        minWidth={200}
        minHeight={120}
      />
      
      {/* Handles */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 !bg-green-500 border-2 border-green-600"
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 !bg-green-500 border-2 border-green-600"
      />

      <motion.div
        className={`
          relative min-w-[200px] min-h-[120px] rounded-xl border-2 transition-all duration-200
          ${selected 
            ? 'border-green-400 shadow-lg shadow-green-500/20' 
            : 'border-green-500 hover:border-green-400 hover:shadow-md hover:shadow-green-500/10'
          }
          ${localStatus === 'running' ? 'animate-pulse' : ''}
        `}
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-green-400/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {data.label || 'Human Review'}
              </h3>
              <p className="text-xs text-green-100 opacity-80">
                {data.description || 'Human decision point'}
              </p>
            </div>
          </div>
          
          <div className={`flex items-center gap-1 ${getStatusColor()}`}>
            {getStatusIcon()}
            <Badge 
              variant="secondary" 
              className="text-xs bg-white/20 text-white border-white/30"
            >
              {localStatus}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="text-center">
            <User className="w-8 h-8 text-white/80 mx-auto mb-2" />
            <p className="text-sm text-white/90 mb-3">
              Waiting for human input...
            </p>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Provide Input
                    </>
                  )}
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-green-600" />
                    Human Input Required
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="user-input">Your Input</Label>
                    <Textarea
                      id="user-input"
                      placeholder="Provide your input or decision..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="feedback">Additional Feedback (Optional)</Label>
                    <Textarea
                      id="feedback"
                      placeholder="Any additional context or feedback..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleUserInput}
                      disabled={!userInput.trim() || isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isPending ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Submit
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Output Data Preview */}
          {data.outputData && (
            <div className="mt-3 p-2 bg-white/10 rounded-lg">
              <p className="text-xs text-white/70 mb-1">Last Input:</p>
              <p className="text-xs text-white truncate">
                {data.outputData.userInput || 'No input provided'}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default HumanInTheLoopNode; 