import React, { useState, useCallback } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { Tag, Activity, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { NodeNameHeader } from '../ui/node-name-header';
import { toast } from '../ui/use-toast';
import { useGmailAuth } from '../../hooks/useGmailAuth';

interface GmailLabelEmailNodeProps {
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
  selected?: boolean;
}

function GmailLabelEmailNode({ id, data, selected }: GmailLabelEmailNodeProps) {
  const [isRunning, setIsRunning] = useState(false);
  const { isConnected, hasTokens, loading } = useGmailAuth();

  const executeLabeling = async () => {
    if (!isConnected || !hasTokens) {
      toast({
        title: "Not Connected",
        description: "Please connect your Gmail account first",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    data.onStatusChange?.('running');

    try {
      // Get message ID from input data (most recent email)
      const messageId = data.inputData?.messageId || data.inputData?.id;

      if (!messageId) {
        throw new Error('No email found. Connect an email source first.');
      }

      const isLocalhost = window.location.hostname === 'localhost';
      const backendUrl = isLocalhost ? 'http://localhost:3000' : 'https://zigsaw-backend.vercel.app';

      // Apply a simple label (e.g., "Important") to the most recent email
      const response = await fetch(`${backendUrl}/api/gmail/label-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          messageId,
          action: 'add',
          labelIds: ['IMPORTANT'] // Simple default label
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to label email');
      }

      const result = await response.json();

      data.onOutputDataChange?.(result);
      data.onDataOutput?.(result);
      data.onStatusChange?.('completed');

      toast({
        title: "Success!",
        description: "Email labeled successfully",
        variant: "default"
      });

    } catch (error) {
      console.error('Label email error:', error);
      data.onStatusChange?.('error');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to label email',
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = () => {
    switch (data.status) {
      case 'running': return 'border-yellow-500 bg-yellow-50';
      case 'completed': return 'border-green-500 bg-green-50';
      case 'error': return 'border-red-500 bg-red-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  const getConnectionStatus = () => {
    if (loading) return { icon: Activity, text: 'Checking...', color: 'text-gray-500' };
    if (isConnected && hasTokens) return { icon: CheckCircle, text: 'Connected', color: 'text-green-600' };
    return { icon: XCircle, text: 'Not Connected', color: 'text-red-600' };
  };

  const connectionStatus = getConnectionStatus();
  const IconComponent = connectionStatus.icon;

  return (
    <>
      <NodeResizer 
        color="#ff0071" 
        isVisible={selected} 
        minWidth={300} 
        minHeight={200}
      />
      
      <motion.div
        className={`w-full h-full min-w-[300px] min-h-[200px] bg-white border-2 rounded-xl shadow-lg overflow-hidden ${getStatusColor()}`}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Handle type="target" position={Position.Left} className="w-4 h-4" />
        <Handle type="source" position={Position.Right} className="w-4 h-4" />

        <div className="p-4 h-full flex flex-col">
          <NodeNameHeader 
            icon={Tag}
            title="Label Email"
            subtitle="Label most recent email"
            status={data.status}
          />

          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            {/* Big Words */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-gray-800">
                LABEL EMAIL
              </h3>
              <p className="text-lg text-gray-600">
                Most Recent Email
              </p>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <IconComponent className={`w-5 h-5 ${connectionStatus.color}`} />
              <span className={`text-sm font-medium ${connectionStatus.color}`}>
                {connectionStatus.text}
              </span>
            </div>

            {/* Status Badge */}
            {data.status !== 'idle' && (
              <Badge 
                variant={data.status === 'completed' ? 'default' : data.status === 'error' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {data.status === 'running' ? 'Running...' : 
                 data.status === 'completed' ? 'Completed' : 
                 data.status === 'error' ? 'Error' : 'Idle'}
              </Badge>
            )}
          </div>

          {/* Run Button */}
          <div className="mt-4">
            <Button
              onClick={executeLabeling}
              disabled={isRunning || data.status === 'running' || !isConnected || !hasTokens}
              className="w-full h-10 text-sm font-medium"
              size="lg"
            >
              {isRunning ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Labeling...
                </>
              ) : (
                <>
                  <Tag className="w-4 h-4 mr-2" />
                  Label Email
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default GmailLabelEmailNode;
