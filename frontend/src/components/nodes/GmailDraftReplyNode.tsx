import React, { useState, useCallback } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { Send, Activity, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { NodeNameHeader } from '../ui/node-name-header';
import { toast } from '../ui/use-toast';
import { useGmailAuth } from '../../hooks/useGmailAuth';

interface GmailDraftReplyNodeProps {
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

function GmailDraftReplyNode({ id, data, selected }: GmailDraftReplyNodeProps) {
  const [isRunning, setIsRunning] = useState(false);
  const { isConnected, hasTokens, loading } = useGmailAuth();

  const createDraftReply = async () => {
    if (!isConnected || !hasTokens) {
      toast({
        title: "Not Connected",
        description: "Please connect your Gmail account first",
        variant: "destructive"
      });
      return;
    }

    // Get thread ID from input data (most recent email)
    const threadId = data.inputData?.threadId || data.inputData?.id || data.inputData?.message?.threadId;

    if (!threadId) {
      toast({
        title: "No Email Found",
        description: "Connect an email source first",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    data.onStatusChange?.('running');

    try {
      const isLocalhost = window.location.hostname === 'localhost';
      const backendUrl = isLocalhost ? 'http://localhost:3000' : 'https://zigsaw-backend.vercel.app';

      // Create a simple draft reply
      const draftData = {
        threadId,
        to: data.inputData?.from || data.inputData?.sender || 'recipient@example.com',
        subject: `Re: ${data.inputData?.subject || 'Email'}`,
        body: 'Thank you for your email. I will review this and get back to you soon.\n\nBest regards'
      };

      const response = await fetch(`${backendUrl}/api/gmail/draft-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(draftData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create draft reply');
      }

      const result = await response.json();

      data.onOutputDataChange?.(result);
      data.onDataOutput?.(result);
      data.onStatusChange?.('completed');

      toast({
        title: "Success!",
        description: "Draft reply created successfully",
        variant: "default"
      });

    } catch (error) {
      console.error('Draft reply error:', error);
      data.onStatusChange?.('error');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create draft reply',
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = () => {
    switch (data.status) {
      case 'running': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
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
        className={`relative bg-gradient-to-br from-slate-900/90 via-purple-900/40 to-blue-900/60 backdrop-blur-xl border border-purple-400/20 rounded-2xl shadow-2xl transition-all duration-500 hover:shadow-purple-500/20 hover:border-purple-400/40 hover:scale-[1.02] min-w-[300px] min-h-[200px] ${
          selected ? "ring-2 ring-purple-400/60 shadow-purple-500/30" : ""
        }`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-indigo-600/10 rounded-2xl animate-pulse" />
        
        {/* Animated Light Streaks */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 rounded-2xl">
            {/* Top streak */}
            <motion.div 
              className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400/60 to-transparent"
              animate={{
                x: ['-100%', '100%'],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Right streak */}
            <motion.div 
              className="absolute top-0 right-0 w-0.5 h-full bg-gradient-to-b from-transparent via-blue-400/60 to-transparent"
              animate={{
                y: ['-100%', '100%'],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.75
              }}
            />
            
            {/* Bottom streak */}
            <motion.div 
              className="absolute bottom-0 right-0 w-full h-0.5 bg-gradient-to-l from-transparent via-purple-400/60 to-transparent"
              animate={{
                x: ['100%', '-100%'],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5
              }}
            />
            
            {/* Left streak */}
            <motion.div 
              className="absolute bottom-0 left-0 w-0.5 h-full bg-gradient-to-t from-transparent via-blue-400/60 to-transparent"
              animate={{
                y: ['100%', '-100%'],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2.25
              }}
            />
          </div>
        </div>

        <Handle type="target" position={Position.Left} className="w-4 h-4" />
        <Handle type="source" position={Position.Right} className="w-4 h-4" />

        <div className="relative p-4 h-full flex flex-col z-10">
          <NodeNameHeader 
            icon={Send}
            title="Draft Reply"
            subtitle="Create draft reply to email"
            status={data.status}
          />

          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            {/* Big Words */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold text-white font-sans tracking-wide">
                DRAFT REPLY
              </h3>
              <p className="text-lg text-gray-300 font-sans">
                Most Recent Email
              </p>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <IconComponent className={`w-5 h-5 ${connectionStatus.color}`} />
              <span className={`text-sm font-medium ${connectionStatus.color} font-sans`}>
                {connectionStatus.text}
              </span>
            </div>

            {/* Status Badge */}
            {data.status !== 'idle' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, type: "spring" }}
              >
                <Badge 
                  variant={data.status === 'completed' ? 'default' : data.status === 'error' ? 'destructive' : 'secondary'}
                  className="text-xs font-sans"
                >
                  {data.status === 'running' ? 'Running...' : 
                   data.status === 'completed' ? 'Completed' : 
                   data.status === 'error' ? 'Error' : 'Idle'}
                </Badge>
              </motion.div>
            )}
          </div>

          {/* Run Button */}
          <div className="mt-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
            <Button
              onClick={createDraftReply}
                disabled={isRunning || data.status === 'running' || !isConnected || !hasTokens}
                className="w-full h-10 text-sm font-medium bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 font-sans"
                size="lg"
            >
                {isRunning ? (
                <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Creating Draft...
                </>
              ) : (
                <>
                    <Send className="w-4 h-4 mr-2" />
                  Create Draft Reply
                </>
              )}
            </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default GmailDraftReplyNode;
