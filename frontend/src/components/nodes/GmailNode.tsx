import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { Mail, Activity, Settings, X, Inbox, FileEdit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NodeNameHeader } from '../ui/node-name-header';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import gmailLogo from '../../assets/gmaillogo.png';
import { toast } from '../ui/use-toast';
import type { GmailEmail } from '../../services/gmailService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface GmailConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
  filters: {
    maxResults: number;
    labelIds: string[];
    query: string;
  };
  autoSync: boolean;
  syncInterval: number;
  configId?: string;
}

interface GmailNodeProps {
  id: string;
  data: {
    label: string;
    description: string;
    status: 'idle' | 'running' | 'completed' | 'error';
    config?: GmailConfig;
    onConfigChange?: (config: GmailConfig) => void;
    inputData?: any; // To receive data from connected nodes
  };
  selected?: boolean;
}


const defaultConfig: GmailConfig = {
  scopes: [
    'openid',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/contacts'
  ],
  filters: {
    maxResults: 10,
    labelIds: [],
    query: ''
  },
  autoSync: false,
  syncInterval: 5,
  redirectUri: 'http://localhost:8000/api/gmail/auth/callback'
};

const commonScopes = [
  { value: 'https://www.googleapis.com/auth/gmail.readonly', label: 'Read emails' },
  { value: 'https://www.googleapis.com/auth/gmail.modify', label: 'Modify emails' },
  { value: 'https://www.googleapis.com/auth/gmail.send', label: 'Send emails' },
  { value: 'https://www.googleapis.com/auth/gmail.compose', label: 'Compose emails' },
  { value: 'https://www.googleapis.com/auth/gmail.labels', label: 'Manage labels' }
];

const commonLabels = [
  { value: 'INBOX', label: 'Inbox' },
  { value: 'SENT', label: 'Sent' },
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'TRASH', label: 'Trash' },
  { value: 'IMPORTANT', label: 'Important' },
  { value: 'STARRED', label: 'Starred' }
];

const GmailNode: React.FC<GmailNodeProps> = ({ id, data, selected }) => {
  const [localConfig, setLocalConfig] = useState<GmailConfig>(() => ({
    ...defaultConfig,
    ...(data.config || {})
  }));
  const [showConfig, setShowConfig] = useState(false);
  const [, setIsConnected] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [stats] = useState<any>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [] = useState(false);
  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftEmail, setDraftEmail] = useState({ to: '', subject: '', body: '' });
  const [groqInputData, setGroqInputData] = useState<any | null>(null);
  const [isCreatingFromGroq, setIsCreatingFromGroq] = useState(false);
  
  useEffect(() => {
    if (data.inputData && data.inputData.metadata?.isEmailDraft) {
      console.log('📨 [Gmail Node] Received email draft data from Groq:', data.inputData.content);
      setGroqInputData(data.inputData.content);
      toast({
        title: "Email Draft Received",
        description: "Data from Groq is ready. Click 'Create Draft from Groq' to save it.",
      });
    }
  }, [data.inputData]);

  const getStatusColor = () => {
    switch (data.status) {
      case 'running': return 'border-blue-400/60 bg-gradient-to-br from-blue-900/30 via-blue-800/20 to-blue-900/30 shadow-blue-400/20'
      case 'completed': return 'border-green-400/60 bg-gradient-to-br from-green-900/30 via-green-800/20 to-green-900/30 shadow-green-400/20'
      case 'error': return 'border-red-400/60 bg-gradient-to-br from-red-900/30 via-red-800/20 to-red-900/30 shadow-red-400/20'
      default: return 'border-slate-500/50 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50'
    }
  };

  const handleConfigChange = useCallback((key: keyof GmailConfig, value: any) => {
    setLocalConfig(prev => {
      const newConfig = { ...prev };
      if (key === 'redirectUri') {
        newConfig[key] = value;
      } else if (key === 'filters') {
        newConfig.filters = { ...prev.filters, ...value };
      } else {
        (newConfig as any)[key] = value;
      }
      
      if (data.onConfigChange) {
        data.onConfigChange(newConfig);
      }
      
      return newConfig;
    });
  }, [data]);

  const handleFilterChange = useCallback((key: keyof GmailConfig['filters'], value: any) => {
    setLocalConfig(prev => {
      const newConfig = {
        ...prev,
        filters: {
          ...prev.filters,
          [key]: value
        }
      };
      
      if (data.onConfigChange) {
        data.onConfigChange(newConfig);
      }
      
      return newConfig;
    });
  }, [data]);

  const handleScopeToggle = useCallback((scope: string) => {
    const newScopes = localConfig.scopes.includes(scope)
      ? localConfig.scopes.filter(s => s !== scope)
      : [...localConfig.scopes, scope];
    handleConfigChange('scopes', newScopes);
  }, [localConfig.scopes, handleConfigChange]);


  const handleStartOAuth = useCallback(async () => {
    console.log('🚀 [Gmail Node] Starting OAuth flow...');
    setIsTestingConnection(true);
      try {
      console.log('📦 [Gmail Node] Loading Gmail service...');
        const gmailService = (await import('../../services/gmailService')).default;
      
      console.log('💾 [Gmail Node] Saving current configuration...');
      console.log('📊 [Gmail Node] Local config:', {
        ...localConfig,
        clientSecret: '***HIDDEN***'
      });
      
      // Always save the current configuration first
      const saveResult = await gmailService.saveNodeConfig(localConfig, id);
      console.log('📋 [Gmail Node] Save result:', saveResult);
        
      if (!saveResult.success || !saveResult.config_id) {
        console.error('❌ [Gmail Node] Failed to save configuration:', saveResult);
        throw new Error(saveResult.message || "Failed to save configuration");
      }

      // Update local state with the new config ID
      const newConfigId = saveResult.config_id;
      console.log('🔑 [Gmail Node] New config ID:', newConfigId);
      setConfigId(newConfigId);
      
      console.log('🔐 [Gmail Node] Starting OAuth flow with config ID:', newConfigId);
      // Start the OAuth flow with the new config ID
      const oauthResult = await gmailService.startOAuthFlow(newConfigId);
      console.log('✅ [Gmail Node] OAuth flow started:', oauthResult);
      
      if (!oauthResult || !oauthResult.auth_url) {
        console.error('❌ [Gmail Node] No auth URL returned:', oauthResult);
        throw new Error("Failed to get OAuth URL");
      }

      console.log('🌐 [Gmail Node] Opening popup with URL:', oauthResult.auth_url);
      const popup = window.open(
        oauthResult.auth_url,
        'googleAuth',
        'width=500,height=600,resizable=yes,scrollbars=yes,status=yes,toolbar=no,location=no,menubar=no'
      );
      
      if (!popup) {
        console.error('❌ [Gmail Node] Popup was blocked by the browser');
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site and try again",
          variant: "destructive"
        });
        throw new Error("Failed to open OAuth popup window - Popup was blocked");
      }

      console.log('👂 [Gmail Node] Setting up message listener...');
      const messageListener = (event: MessageEvent) => {
        console.log('📨 [Gmail Node] Received message:', event.data);
        if (event.data.type === 'gmail_auth_success') {
          console.log('✅ [Gmail Node] Auth success message received');
          setIsConnected(true);
          toast({
            title: "Success",
            description: "Successfully connected to Gmail",
            variant: "default"
          });
          window.removeEventListener('message', messageListener);
        } else if (event.data.type === 'gmail_auth_error') {
          const error = event.data.error;
          console.error('❌ [Gmail Node] OAuth error message received:', error);
          toast({
            title: "Authentication Error",
            description: error instanceof Error ? error.message : "Failed to authenticate with Google",
            variant: "destructive"
          });
          window.removeEventListener('message', messageListener);
        }
      };
      
      window.addEventListener('message', messageListener);
      console.log('✅ [Gmail Node] Message listener set up');
      
      console.log('⏰ [Gmail Node] Setting up popup monitor...');
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          console.log('🚪 [Gmail Node] Popup was closed');
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
        }
      }, 1000);

      } catch (error) {
      console.error('💥 [Gmail Node] Error in OAuth flow:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to start OAuth flow";
      toast({
        title: "OAuth Error",
        description: errorMessage,
        variant: "destructive"
      });
      setIsConnected(false);
    } finally {
      setIsTestingConnection(false);
    }
  }, [localConfig, id, toast]);

  const handleRetrieveEmails = useCallback(async () => {
    if (!configId) {
      toast({
        title: "Error",
        description: "Please sign in to Gmail first",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingEmails(true);
    try {
      const gmailService = (await import('../../services/gmailService')).default;
      const result = await gmailService.getEmails(configId);
      
      if (result.success && result.emails.length > 0) {
        setEmails(result.emails);
        toast({
          title: "Success",
          description: `Retrieved ${result.emails.length} emails`,
          variant: "default"
        });
      } else {
        toast({
          title: "No Emails",
          description: result.message || "No emails found",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error retrieving emails:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to retrieve emails",
        variant: "destructive"
      });
    } finally {
      setIsLoadingEmails(false);
    }
  }, [configId]);

  const handleCreateDraftFromGroq = useCallback(async () => {
    if (!configId) {
      toast({ title: "Error", description: "Please sign in first.", variant: "destructive" });
      return;
    }
    if (!groqInputData) {
      toast({ title: "Error", description: "No data from Groq available.", variant: "destructive" });
      return;
    }

    setIsCreatingFromGroq(true);
    try {
      const gmailService = (await import('../../services/gmailService')).default;
      const result = await gmailService.createDraft(configId, groqInputData);

      if (result.success) {
        toast({ title: "Success", description: `Draft from Groq data saved successfully!` });
        setGroqInputData(null); // Clear data after success
      } else {
        throw new Error(result.message || 'Failed to save draft from Groq data.');
      }
    } catch (error) {
      console.error("Error saving draft from Groq:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save draft.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingFromGroq(false);
    }
  }, [configId, groqInputData]);

  const handleSaveDraft = useCallback(async () => {
    if (!configId) {
      toast({ title: "Error", description: "Please sign in first.", variant: "destructive" });
      return;
    }
    if (!draftEmail.to) {
      toast({ title: "Error", description: "Recipient 'To' field is required.", variant: "destructive" });
      return;
    }

    setIsDrafting(true);
    try {
      const gmailService = (await import('../../services/gmailService')).default;
      const result = await gmailService.createDraft(configId, draftEmail);

      if (result.success) {
        toast({ title: "Success", description: `Draft saved successfully with ID: ${result.draftId}` });
        setShowDraftDialog(false);
        setDraftEmail({ to: '', subject: '', body: '' }); // Reset form
      } else {
        throw new Error(result.message || 'Failed to save draft.');
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save draft.",
        variant: "destructive",
      });
    } finally {
      setIsDrafting(false);
    }
  }, [configId, draftEmail]);

  return (
    <div
      className={`relative w-full h-full backdrop-blur-sm border-2 rounded-xl shadow-lg transition-all duration-300 p-4 ${getStatusColor()} ${selected ? 'ring-2 ring-blue-400/50' : ''}`}
    >
      {/* Input/Output Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!left-[-12px] w-4 h-4 !bg-gradient-to-r from-slate-700 to-slate-800 border-2 border-white/40 hover:border-white/60 rounded-full transition-colors"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!right-[-12px] w-4 h-4 !bg-gradient-to-r from-slate-700 to-slate-800 border-2 border-white/40 hover:border-white/60 rounded-full transition-colors"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      />

      <NodeResizer
        color="#4A90E2"
        isVisible={selected}
        minWidth={380}
        minHeight={300}
      />
      
      {/* Content */}
      <div className="relative z-10 text-white">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="p-2 rounded-lg bg-gradient-to-br from-white/20 to-white/10 border border-white/20 backdrop-blur-sm w-14 h-14 flex items-center justify-center"
          >
            <img 
              src={gmailLogo} 
              alt="Gmail" 
              className="w-12 h-12 object-contain"
            />
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="text-white">
              <NodeNameHeader
                nodeId={id}
                originalLabel={data.label}
                className="mb-0 text-lg font-semibold"
              >
                {data.status === 'running' && (
                  <Activity className="w-4 h-4 text-blue-400 animate-spin" />
                )}
              </NodeNameHeader>
            </div>
            <p className="text-sm text-white/70 truncate">{data.description}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Settings className={`w-5 h-5 transition-transform duration-300 ${showConfig ? 'rotate-180' : ''}`} />
          </motion.button>
        </div>

        {/* Configuration Panel */}
        <AnimatePresence>
          {showConfig && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <ScrollArea className="h-[400px] pr-4">
                <Accordion type="single" collapsible className="space-y-4">
                  {/* OAuth Credentials Section */}
                  <AccordionItem value="credentials" className="border-white/10">
                    <AccordionTrigger className="text-sm font-medium text-white hover:text-white/80">
                      OAuth Credentials
                    </AccordionTrigger>
                    <AccordionContent>
                      <Card className="bg-slate-800/50 border-white/10">
                        <CardContent className="p-4 space-y-4">
                          <div className="space-y-3">
                            <Label htmlFor="redirectUri" className="text-white">
                              Redirect URI
                              <span className="text-red-400 ml-1">*</span>
                            </Label>
                            <Input
                              id="redirectUri"
                              type="text"
                              value={localConfig.redirectUri}
                              onChange={(e) => handleConfigChange('redirectUri', e.target.value)}
                              className="bg-slate-900/50 border-white/20 text-white placeholder-white/50 focus:ring-blue-500/50"
                              placeholder="Enter OAuth Redirect URI"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Scopes Section */}
                  <AccordionItem value="scopes" className="border-white/10">
                    <AccordionTrigger className="text-sm font-medium text-white hover:text-white/80">
                      Scopes
                    </AccordionTrigger>
                    <AccordionContent>
                      <Card className="bg-slate-800/50 border-white/10">
                        <CardContent className="p-4 space-y-3">
                          {commonScopes.map((scope) => (
                            <div key={scope.value} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                              <Switch
                                checked={localConfig.scopes.includes(scope.value)}
                                onCheckedChange={() => handleScopeToggle(scope.value)}
                              />
                              <Label className="text-sm text-white cursor-pointer">{scope.label}</Label>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Filters Section */}
                  <AccordionItem value="filters" className="border-white/10">
                    <AccordionTrigger className="text-sm font-medium text-white hover:text-white/80">
                      Filters
                    </AccordionTrigger>
                    <AccordionContent>
                      <Card className="bg-slate-800/50 border-white/10">
                        <CardContent className="p-4 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="maxResults" className="text-white">Max Results</Label>
                            <Input
                              id="maxResults"
                              type="number"
                              value={localConfig.filters.maxResults}
                              onChange={(e) => handleFilterChange('maxResults', parseInt(e.target.value))}
                              className="bg-slate-900/50 border-white/20 text-white focus:ring-blue-500/50"
                              min="1"
                              max="500"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="query" className="text-white">Search Query</Label>
                            <Input
                              id="query"
                              type="text"
                              value={localConfig.filters.query}
                              onChange={(e) => handleFilterChange('query', e.target.value)}
                              className="bg-slate-900/50 border-white/20 text-white placeholder-white/50 focus:ring-blue-500/50"
                              placeholder="e.g., is:unread from:example@gmail.com"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-white">Labels</Label>
                            <Select
                              value={localConfig.filters.labelIds[0] || ''}
                              onValueChange={(value) => handleFilterChange('labelIds', [value])}
                            >
                              <SelectTrigger className="bg-slate-900/50 border-white/20 text-white">
                                <SelectValue placeholder="Select a label" />
                              </SelectTrigger>
                              <SelectContent>
                                {commonLabels.map((label) => (
                                  <SelectItem key={label.value} value={label.value}>
                                    {label.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Auto Sync Section */}
                  <AccordionItem value="sync" className="border-white/10">
                    <AccordionTrigger className="text-sm font-medium text-white hover:text-white/80">
                      Auto Sync
                    </AccordionTrigger>
                    <AccordionContent>
                      <Card className="bg-slate-800/50 border-white/10">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                            <Switch
                              checked={localConfig.autoSync}
                              onCheckedChange={(checked) => handleConfigChange('autoSync', checked)}
                            />
                            <Label className="text-sm text-white cursor-pointer">Enable Auto Sync</Label>
                          </div>

                          {localConfig.autoSync && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-2"
                            >
                              <Label htmlFor="syncInterval" className="text-white">Sync Interval (minutes)</Label>
                              <Input
                                id="syncInterval"
                                type="number"
                                value={localConfig.syncInterval}
                                onChange={(e) => handleConfigChange('syncInterval', parseInt(e.target.value))}
                                className="bg-slate-900/50 border-white/20 text-white focus:ring-blue-500/50"
                                min="1"
                                max="60"
                              />
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                onClick={handleStartOAuth}
                disabled={isTestingConnection}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0"
              >
                {isTestingConnection ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Sign into Google
                  </>
                )}
              </Button>
            </motion.div>

            {configId && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  onClick={() => setShowDraftDialog(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0"
                >
                  <FileEdit className="w-4 h-4 mr-2" />
                  Draft Email
                </Button>
              </motion.div>
            )}
          </div>

          {configId && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                onClick={handleRetrieveEmails}
                disabled={isLoadingEmails}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0"
              >
                {isLoadingEmails ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Inbox className="w-4 h-4 mr-2" />
                    Retrieve Emails
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </div>

        {/* Groq Data Section */}
        {groqInputData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="mt-4 bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium text-green-200">Email Draft from AI</h4>
                    <p className="text-xs text-green-200/70">Ready to create from Groq data</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setGroqInputData(null)}
                    className="text-white/70 hover:text-white/90"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="bg-black/20 p-3 rounded-lg space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-green-200 border-green-200/30">
                      To
                    </Badge>
                    <span className="text-white/90">{groqInputData.to}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-green-200 border-green-200/30">
                      Subject
                    </Badge>
                    <span className="text-white/90">{groqInputData.subject}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCreateDraftFromGroq}
                  disabled={isCreatingFromGroq}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  {isCreatingFromGroq ? (
                    <>
                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                      Creating Draft...
                    </>
                  ) : (
                    <>
                      <FileEdit className="w-4 h-4 mr-2" />
                      Save Draft
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Email List */}
        {emails.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <Card className="bg-slate-800/50 border-white/10">
              <CardContent className="p-4">
                <ScrollArea className="h-60">
                  <div className="space-y-3">
                    {emails.map((email) => (
                      <motion.div
                        key={email.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-3 rounded-lg bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-white/10 hover:border-white/20 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{email.from}</span>
                          <Badge variant="outline" className="text-xs text-white/60 border-white/20">
                            {new Date(email.date).toLocaleDateString()}
                          </Badge>
                        </div>
                        <h4 className="text-sm text-white/90 font-medium mb-1">{email.subject}</h4>
                        <p className="text-xs text-white/60 line-clamp-2">{email.snippet}</p>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 grid grid-cols-3 gap-3"
          >
            <div className="p-3 rounded-lg bg-slate-800/30 border border-white/10">
              <p className="text-xs text-white/60 mb-1">Total Emails</p>
              <p className="text-sm font-medium text-white">{stats.total_emails}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/30 border border-white/10">
              <p className="text-xs text-white/60 mb-1">Unread</p>
              <p className="text-sm font-medium text-white">{stats.unread_emails}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/30 border border-white/10">
              <p className="text-xs text-white/60 mb-1">Storage Used</p>
              <p className="text-sm font-medium text-white">{stats.storage_used}</p>
            </div>
          </motion.div>
        )}

        {/* Draft Email Dialog */}
        <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
          <DialogContent className="sm:max-w-[425px] bg-slate-900 text-white border-slate-700">
            <DialogHeader>
              <DialogTitle>Draft a New Email</DialogTitle>
              <DialogDescription className="text-white/70">
                Compose your email below. It will be saved as a draft in your Gmail account.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="to" className="text-white">To</Label>
                <Input
                  id="to"
                  type="email"
                  value={draftEmail.to}
                  onChange={(e) => setDraftEmail({ ...draftEmail, to: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="recipient@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-white">Subject</Label>
                <Input
                  id="subject"
                  value={draftEmail.subject}
                  onChange={(e) => setDraftEmail({ ...draftEmail, subject: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="Email Subject"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="body" className="text-white">Body</Label>
                <Textarea
                  id="body"
                  value={draftEmail.body}
                  onChange={(e) => setDraftEmail({ ...draftEmail, body: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white min-h-[150px]"
                  placeholder="Type your message here."
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                onClick={handleSaveDraft}
                disabled={isDrafting}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                {isDrafting ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Saving Draft...
                  </>
                ) : (
                  'Save Draft'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default GmailNode; 