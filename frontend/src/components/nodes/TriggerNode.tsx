import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap, Play, Activity, Save, Mail, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { workflowPersistenceService } from '../../services/workflowPersistenceService';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useGmailAuth } from '../../hooks/useGmailAuth';

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
      name?: string;
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
  const { isConnected, hasTokens, loading: gmailLoading } = useGmailAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [localStatus, setLocalStatus] = useState<'idle' | 'running' | 'completed' | 'error'>(data.status || 'idle');
  
  // Get configuration from selected node or use defaults
  const selectedNode = getSelectedNode();
  const nodeConfig = selectedNode?.id === id ? selectedNode?.data?.config : data.config;
  const triggerName = (nodeConfig as any)?.name || 'Trigger';
  const eventType = (nodeConfig as any)?.eventType || 'manual';
  const eventData = (nodeConfig as any)?.eventData || '';

  // Handle configuration changes
  const handleNameChange = useCallback((newName: string) => {
    updateNodeConfig(id, { name: newName });
  }, [id, updateNodeConfig]);

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
        name: triggerName,
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
  }, [id, currentUser, getSelectedNode, triggerName, eventType, eventData, toast]);

  // Gmail email retrieval function
  const handleRetrieveGmailEmails = useCallback(async () => {
    if (!isConnected || !hasTokens) {
      toast({
        title: "Gmail Not Connected",
        description: "Please sign in to Gmail first using the workflow header",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingEmails(true);
    setLocalStatus('running');
    data.onStatusChange?.('running');

    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const backendUrl = 'https://zigsaw-backend.vercel.app';

      const response = await fetch(`${backendUrl}/api/gmail/list-emails?maxResults=5&q=is:unread`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` })
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to retrieve emails`);
      }

      const result = await response.json();
      
      if (result.success && result.messages && result.messages.length > 0) {
        const outputData = {
          type: 'gmail_emails',
          name: triggerName,
          eventType: 'gmail_emails',
          emails: result.messages,
          messageDetails: result.messageDetails || [],
          timestamp: new Date().toISOString(),
          triggerId: id,
          count: result.messages.length
        };

        setLocalStatus('completed');
        data.onStatusChange?.('completed');
        data.onOutputDataChange?.(outputData);
        data.onDataOutput?.(outputData);

        toast({
          title: "Success!",
          description: `Retrieved ${result.messages.length} recent emails`,
          variant: "default"
        });

        setIsDialogOpen(false);
      } else {
        toast({
          title: "No Emails",
          description: "No unread emails found",
          variant: "default"
        });
        setLocalStatus('completed');
        data.onStatusChange?.('completed');
      }
    } catch (error) {
      console.error('Error retrieving Gmail emails:', error);
      setLocalStatus('error');
      data.onStatusChange?.('error');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to retrieve emails",
        variant: "destructive"
      });
    } finally {
      setIsLoadingEmails(false);
    }
  }, [isConnected, hasTokens, triggerName, id, data, toast]);

  useEffect(() => {
    if (data.status && data.status !== localStatus) {
      setLocalStatus(data.status);
    }
  }, [data.status]);

  const handleTrigger = useCallback(() => {
    // Handle Gmail email trigger differently
    if (eventType === 'gmail_emails') {
      handleRetrieveGmailEmails();
      return;
    }

    // Handle other trigger types
    setIsTriggering(true);
    setLocalStatus('running');
    data.onStatusChange?.('running');

    // Simulate trigger execution for other types
    setTimeout(() => {
      const outputData = {
        type: 'trigger_event',
        name: triggerName,
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
  }, [triggerName, eventType, eventData, id, data, handleRetrieveGmailEmails]);

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
        className="w-6 h-6 bg-yellow-600 border-2 border-yellow-700"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <motion.div
            className="relative cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Main container - Bigger and simpler */}
            <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg p-6 flex flex-col items-center justify-center min-w-[140px] min-h-[120px]">
              {/* Lightning bolt icon */}
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut"
                }}
                className="mb-2"
              >
                <Zap className="w-8 h-8 text-white drop-shadow-lg" />
              </motion.div>
              {/* Editable label */}
              <Input
                value={triggerName}
                onChange={e => handleNameChange(e.target.value)}
                className="text-center font-bold text-lg bg-transparent border-none shadow-none focus:ring-0 focus:outline-none px-0 py-1 w-full max-w-[100px] text-white placeholder:text-white/60"
                placeholder="Trigger"
                spellCheck={false}
                aria-label="Trigger name"
              />
              
              {/* Simple status indicator */}
              <div className="mt-2">
                <Badge variant="outline" className="bg-black/30 border-white/50 text-white text-xs px-2 py-1">
                  {localStatus}
                </Badge>
              </div>
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
              {/* Trigger Name Input */}
              <div className="space-y-2">
                <Label className="text-slate-200">Trigger Name</Label>
                <Input
                  value={triggerName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter trigger name"
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-yellow-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Event Type</Label>
                <div onClick={(e) => e.stopPropagation()}>
                  <Select value={eventType} onValueChange={handleEventTypeChange}>
                    <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white focus:border-yellow-400">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="manual" className="text-white hover:bg-slate-700">Manual Trigger</SelectItem>
                      <SelectItem value="gmail_emails" className="text-white hover:bg-slate-700">Gmail - Recent Emails</SelectItem>
                      <SelectItem value="scheduled" className="text-white hover:bg-slate-700">Scheduled Event</SelectItem>
                      <SelectItem value="webhook" className="text-white hover:bg-slate-700">Webhook</SelectItem>
                      <SelectItem value="file_change" className="text-white hover:bg-slate-700">File Change</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

              {/* Trigger Button - Different text based on event type */}
              <Button
                onClick={handleTrigger}
                disabled={isTriggering || (eventType === 'gmail_emails' && isLoadingEmails)}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-2 px-4 rounded-md transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {(isTriggering || isLoadingEmails) ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {eventType === 'gmail_emails' ? 'Retrieving Emails...' : 'Triggering...'}
                  </>
                ) : (
                  <>
                    {eventType === 'gmail_emails' ? (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Retrieve Recent Emails
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Trigger Workflow
                      </>
                    )}
                  </>
                )}
              </Button>

              {/* Gmail Connection Status */}
              {eventType === 'gmail_emails' && (
                <div className="mt-2 p-2 bg-slate-700 rounded-md">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4" />
                    <span className="text-slate-300">Gmail Status:</span>
                    {gmailLoading ? (
                      <span className="text-yellow-400">Checking...</span>
                    ) : isConnected && hasTokens ? (
                      <span className="text-green-400">Connected ✓</span>
                    ) : (
                      <span className="text-red-400">Not Connected</span>
                    )}
                  </div>
                  {(!isConnected || !hasTokens) && !gmailLoading && (
                    <p className="text-xs text-slate-400 mt-1">
                      Sign in to Gmail using the workflow header first
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TriggerNode; 