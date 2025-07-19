import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap, Play, Activity, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';

import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { workflowPersistenceService } from '../../services/workflowPersistenceService';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';

interface TriggerNodeProps {
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
    config?: {
      eventType?: string;
      eventData?: string;
      [key: string]: any;
    };
  };
  selected: boolean;
}

const TriggerNode: React.FC<TriggerNodeProps> = ({ id, data }) => {
  const { updateNodeConfig, getSelectedNode } = useWorkflow();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localStatus, setLocalStatus] = useState<'idle' | 'running' | 'completed' | 'error'>(data.status || 'idle');
  
  // Get configuration from selected node or use defaults
  const selectedNode = getSelectedNode();
  const nodeConfig = selectedNode?.id === id ? selectedNode?.data?.config : data.config;
  const eventType = (nodeConfig as any)?.eventType || 'manual';
  const eventData = (nodeConfig as any)?.eventData || '';

  // Handle configuration changes
  const handleEventTypeChange = useCallback((newEventType: string) => {
    updateNodeConfig(id, { eventType: newEventType });
  }, [id, updateNodeConfig]);

  const handleEventDataChange = useCallback((newEventData: string) => {
    updateNodeConfig(id, { eventData: newEventData });
  }, [id, updateNodeConfig]);

  // Handle save configuration
  const handleSave = useCallback(async () => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Error", description: "User must be logged in to save configurations." });
      return;
    }

    setIsSaving(true);
    try {
      const idToken = await currentUser.getIdToken();
      const selectedNode = getSelectedNode();
      const position = selectedNode?.position || { x: 100, y: 100 };
      
      // Build the config object with current values
      const configObj = {
        eventType: eventType,
        eventData: eventData
      };
      
      await workflowPersistenceService.saveNodeConfig(id, configObj, 'TRIGGER', idToken, position);
      toast({ title: "Success", description: "Node configuration saved." });
    } catch (error) {
      console.error('Failed to save node:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to save node configuration." });
    } finally {
      setIsSaving(false);
    }
  }, [id, currentUser, getSelectedNode, data.config, toast]);

  useEffect(() => {
    if (data.status && data.status !== localStatus) {
      setLocalStatus(data.status);
    }
  }, [data.status]);

  const handleTrigger = useCallback(() => {
    setIsTriggering(true);
    setLocalStatus('running');
    data.onStatusChange?.('running');

    // Simulate trigger execution
    setTimeout(() => {
      const outputData = {
        type: 'trigger_event',
        eventType,
        data: eventData,
        timestamp: new Date().toISOString(),
        triggerId: id
      };

      setLocalStatus('completed');
      data.onStatusChange?.('completed');
      data.onOutputDataChange?.(outputData);
      data.onDataOutput?.(outputData);
      
      setIsTriggering(false);
      setIsDialogOpen(false);
    }, 1000);
  }, [eventType, eventData, id, data]);

  const getStatusColor = () => {
    switch (localStatus) {
      case 'running': return 'text-yellow-400';
      case 'completed': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-yellow-500';
    }
  };



  return (
    <div className="relative">

      
      <Handle
        type="source"
        position={Position.Right}
        className="w-5 h-5 bg-yellow-600 border-2 border-yellow-700"
      />

      {/* Lightning streaks animation */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 bg-gradient-to-b from-yellow-400 to-orange-500 opacity-0"
            style={{
              left: `${20 + i * 10}%`,
              top: '10%',
              height: '80%',
              transform: `rotate(${-45 + i * 15}deg)`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scaleY: [0, 1, 0],
            }}
            transition={{
              duration: 0.8,
              delay: i * 0.1,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          />
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <motion.div
            className="relative cursor-pointer group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Outer glow */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/20 to-orange-500/20 blur-lg group-hover:blur-xl transition-all duration-300" />
            
            {/* Main container */}
            <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg shadow-yellow-500/20 p-3 flex flex-col items-center justify-center group-hover:shadow-yellow-500/40 transition-all duration-300 min-w-[100px]">
              {/* Lightning bolt icon */}
              <motion.div
                animate={{
                  rotate: [0, 2, -2, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="mb-1"
              >
                <Zap 
                  className={`w-8 h-8 ${getStatusColor()} drop-shadow-lg`}
                  fill="currentColor"
                />
              </motion.div>
              
              {/* Trigger label */}
              <div className="text-white text-sm font-semibold drop-shadow-md tracking-wide">
                TRIGGER
              </div>
              
              {/* Pulsing ring */}
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-yellow-400"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.8, 0.3, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            {/* Status indicator */}
            <div className="absolute -top-2 -right-2">
              <Badge variant="outline" className="bg-black/50 border-yellow-400/50 text-yellow-400 text-xs px-1 py-0">
                {localStatus}
              </Badge>
            </div>
          </motion.div>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Trigger Configuration
            </DialogTitle>
          </DialogHeader>
          
          <Card className="bg-slate-800 border-slate-600">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Event Type</Label>
                <select
                  value={eventType}
                  onChange={(e) => handleEventTypeChange(e.target.value)}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="manual">Manual Trigger</option>
                  <option value="scheduled">Scheduled Event</option>
                  <option value="webhook">Webhook</option>
                  <option value="file_change">File Change</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Event Data</Label>
                <Textarea
                  value={eventData}
                  onChange={(e) => handleEventDataChange(e.target.value)}
                  placeholder="Enter event data (JSON format)"
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-yellow-400"
                  rows={3}
                />
              </div>

              {/* Save Configuration Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  variant="outline"
                  className="w-full border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-slate-900 font-semibold py-2 px-4 rounded-md transition-all duration-300"
                >
                  {isSaving ? (
                    <>
                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </motion.div>

              {/* Trigger Workflow Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleTrigger}
                  disabled={isTriggering}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-2 px-4 rounded-md transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {isTriggering ? (
                    <>
                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                      Triggering...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Trigger Workflow
                    </>
                  )}
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Animated lightning effects for active state */}
      <AnimatePresence>
        {localStatus === 'running' && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-px h-8 bg-yellow-400 shadow-lg shadow-yellow-400/50"
                style={{
                  left: `${50}%`,
                  top: `${50}%`,
                  transformOrigin: '0 4px',
                }}
                animate={{
                  rotate: [0, 360],
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.125,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TriggerNode; 