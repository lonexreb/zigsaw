import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { Calendar, Activity, Settings, X, Check, AlertCircle, Copy, ExternalLink, Plus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NodeNameHeader } from '../ui/node-name-header';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { toast } from '../ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import gcalLogo from '../../assets/gcallogo.png';

type McpConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  scopes: string[];
  redirectUri: string;
  authMethod: 'oauth2' | 'service_account';
  serviceAccountKey?: string;
  filters: {
    maxResults: number;
    calendarIds: string[];
    timeMin: string;
    timeMax: string;
    showDeleted: boolean;
  };
  autoSync: boolean;
  syncInterval: number;
  configId?: string;
}

interface GoogleCalendarNodeProps {
  id: string;
  data: {
    label: string;
    description: string;
    status: 'idle' | 'running' | 'completed' | 'error';
    config?: GoogleCalendarConfig;
    onConfigChange?: (config: GoogleCalendarConfig) => void;
    inputData?: any;
  };
  selected?: boolean;
}

interface CalendarEventTime {
  dateTime: string;
  timeZone: string;
}

interface CalendarEventAttendee {
  email: string;
  optional: boolean;
}

interface CalendarEventCreate {
  summary: string;
  description?: string;
  location?: string;
  start: CalendarEventTime;
  end: CalendarEventTime;
  attendees?: CalendarEventAttendee[];
}

const defaultConfig: GoogleCalendarConfig = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
  scopes: [
    'openid',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ],
  redirectUri: 'http://localhost:8000/api/calendar/auth/callback',
  authMethod: 'oauth2',
  filters: {
    maxResults: 10,
    calendarIds: ['primary'],
    timeMin: new Date().toISOString(),
    timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    showDeleted: false
  },
  autoSync: false,
  syncInterval: 5
};

const commonScopes = [
  { value: 'https://www.googleapis.com/auth/calendar.readonly', label: 'Read calendar events' },
  { value: 'https://www.googleapis.com/auth/calendar', label: 'Read/write calendar events' },
  { value: 'https://www.googleapis.com/auth/calendar.events', label: 'Manage calendar events' },
  { value: 'https://www.googleapis.com/auth/calendar.events.readonly', label: 'Read calendar events only' },
  { value: 'https://www.googleapis.com/auth/calendar.settings.readonly', label: 'Read calendar settings' }
];

const GoogleCalendarNode: React.FC<GoogleCalendarNodeProps> = ({ id, data, selected }) => {
  const [localConfig, setLocalConfig] = useState<GoogleCalendarConfig>(() => ({
    ...defaultConfig,
    ...(data.config || {})
  }));
  const [showConfig, setShowConfig] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [mcpConnectionStatus, setMcpConnectionStatus] = useState<McpConnectionStatus>('idle');
  const [availableMcpTools, setAvailableMcpTools] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<CalendarEventCreate>({
    summary: '',
    description: '',
    location: '',
    start: {
      dateTime: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16), // 1 hour from now
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    attendees: []
  });
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'retrieve' | 'create'>('retrieve');
  const [isRunning, setIsRunning] = useState(false);
  const [inputData, setInputData] = useState<any>(null);
  const [isCreatingFromGroq, setIsCreatingFromGroq] = useState(false);

  // Function to receive data from connected nodes
  const handleNodeInput = useCallback((receivedData: any) => {
    if (!receivedData) return;

    console.log('📨 [Calendar Node] Received input data:', receivedData);
    
    // Handle data from Groq node
    if (receivedData?.type === 'groq_processed' && receivedData?.metadata?.isCalendarEvent) {
      console.log('📨 [Calendar Node] Storing calendar event data from Groq:', receivedData.content);
      setInputData(receivedData);
      setSelectedAction('create'); // Switch view to create, but don't auto-run
      
      toast({
        title: "Event Data Received from Groq",
        description: "The data is ready. Click the 'Run Create Event' button.",
        duration: 5000,
      });
    }
  }, []);

  // This effect hook listens for changes to the `inputData` prop
  // This is the standard and reliable way to receive data in React Flow
  useEffect(() => {
    if (data.inputData) {
      handleNodeInput(data.inputData);
    }
  }, [data.inputData, handleNodeInput]);
  
  const getStatusColor = () => {
    switch (data.status) {
      case 'running': return 'border-blue-400/60 bg-gradient-to-br from-blue-900/30 via-blue-800/20 to-blue-900/30 shadow-blue-400/20'
      case 'completed': return 'border-green-400/60 bg-gradient-to-br from-green-900/30 via-green-800/20 to-green-900/30 shadow-green-400/20'
      case 'error': return 'border-red-400/60 bg-gradient-to-br from-red-900/30 via-red-800/20 to-red-900/30 shadow-red-400/20'
      default: return 'border-slate-500/50 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50'
    }
  };

  const getStatusIndicatorColor = () => {
    switch (data.status) {
      case 'running': return 'bg-blue-400';
      case 'completed': return 'bg-green-400';
      case 'error': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const handleConfigChange = useCallback((key: keyof GoogleCalendarConfig, value: any) => {
    setLocalConfig(prev => {
      const newConfig = { ...prev };
      if (key === 'clientId' || key === 'clientSecret' || key === 'redirectUri') {
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

  const handleFilterChange = useCallback((key: keyof GoogleCalendarConfig['filters'], value: any) => {
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
    console.log('🚀 [Calendar Node] Starting OAuth flow...');
    setIsTestingConnection(true);
    
    // Don't set connected status until OAuth completes
    
    try {
      console.log('📦 [Calendar Node] Loading Calendar service...');
      const calendarService = (await import('../../services/calendarService')).default;
      
      console.log('💾 [Calendar Node] Saving current configuration...');
      console.log('📊 [Calendar Node] Local config:', {
        ...localConfig,
        clientSecret: '***HIDDEN***'
      });
      
      // Always save the current configuration first
      const saveResult = await calendarService.saveNodeConfig(localConfig, id);
      console.log('📋 [Calendar Node] Save result:', saveResult);
      
      if (!saveResult.success || !saveResult.config_id) {
        console.error('❌ [Calendar Node] Failed to save configuration:', saveResult);
        throw new Error(saveResult.message || "Failed to save configuration");
      }
      
      // Update local state with the new config ID
      const newConfigId = saveResult.config_id;
      setConfigId(newConfigId);
      
      // Start OAuth flow
      console.log('🔐 [Calendar Node] Starting OAuth flow for config:', newConfigId);
      const authResponse = await calendarService.startOAuthFlow(newConfigId);
      
      if (!authResponse?.auth_url) {
        throw new Error('No auth URL received from server');
      }
      
      // Open OAuth window
      const authWindow = window.open(authResponse.auth_url, 'google-oauth', 'width=600,height=600');
      
      // Set up polling to check if authentication completed
      let pollCount = 0;
      const maxPolls = 120; // 120 seconds max (2 minutes)
      let authCompleted = false; // Flag to track if auth completed successfully
      
      const pollForAuth = async () => {
        try {
          // Don't start checking until after 5 seconds to give user time to authenticate
          if (pollCount < 5) {
            pollCount++;
            return;
          }
          
          // Check if the config status changed to connected
          const configs = await calendarService.getAllConfigs();
          const currentConfig = configs.find((c: any) => c.id === newConfigId);
          
          if (currentConfig && currentConfig.config.status === 'connected') {
            console.log('🎉 [Calendar Node] OAuth flow completed via polling');
            
            // Set flag to prevent cancellation message
            authCompleted = true;
            
            // Clean up
            if (authWindow) authWindow.close();
            clearInterval(pollInterval);
            clearInterval(checkWindow);
            
                setIsConnected(true);
            setConfigId(newConfigId);
            setMcpConnectionStatus('connecting');

            // Connect to MCP server
            try {
              const isMcpHealthy = await calendarService.checkMcpHealth();
              if (!isMcpHealthy) {
                throw new Error("Calendar MCP server is not available.");
              }

              const mcpResult = await calendarService.connectToMcp(id, newConfigId);
              if (mcpResult.success) {
                setMcpConnectionStatus('connected');
                setAvailableMcpTools(mcpResult.tools || []);
                toast({
                  title: "Connected to MCP",
                  description: "Successfully connected to Google Calendar MCP.",
                });
              } else {
                throw new Error(mcpResult.message || "Failed to connect to MCP");
              }
            } catch (error) {
              setMcpConnectionStatus('error');
              console.error('❌ [Calendar Node] MCP connection error:', error);
              toast({
                title: "MCP Connection Failed",
                description: error instanceof Error ? error.message : 'Failed to connect to MCP',
                variant: "destructive",
              });
            }
            
                toast({
                  title: "Connected to Google Calendar",
                  description: "Successfully authenticated with Google Calendar",
                });
                
                // Get initial stats
            try {
                const statsResult = await calendarService.getStats(newConfigId);
                setStats(statsResult);
            } catch (error) {
              console.log('Stats not available yet, continuing...');
            }
            
            setIsTestingConnection(false);
            return;
          }
          
          pollCount++;
          if (pollCount >= maxPolls) {
            console.log('❌ [Calendar Node] OAuth polling timeout');
            authCompleted = true; // Prevent cancellation message
            clearInterval(checkWindow);
            throw new Error('Authentication timeout - please try again');
          }
        } catch (error) {
          // Only fail if we've been trying for a while and it's a real error
          if (pollCount > 10 && !error.message.includes('404')) {
            console.error('❌ [Calendar Node] OAuth polling error:', error);
            authCompleted = true; // Prevent cancellation message
            clearInterval(pollInterval);
            clearInterval(checkWindow);
            if (authWindow) authWindow.close();
            
            setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
            setIsConnected(false);
            setIsTestingConnection(false);
            
              toast({
                title: "Authentication Failed",
              description: error instanceof Error ? error.message : 'Authentication failed',
                variant: "destructive",
            });
          } else {
            // Continue polling for early errors or 404s
            pollCount++;
          }
        }
      };
      
      // Start polling every 1 second
      const pollInterval = setInterval(pollForAuth, 1000);
      
      // Also check if the popup window was closed manually (but only if auth didn't complete)
      const checkWindow = setInterval(() => {
        if (authWindow?.closed && !authCompleted) {
          console.log('🔒 [Calendar Node] OAuth window closed by user before completion');
          clearInterval(pollInterval);
          clearInterval(checkWindow);
          setIsTestingConnection(false);
          
          toast({
            title: "Authentication Cancelled",
            description: "Please try signing in again if needed",
          });
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ [Calendar Node] Error in OAuth flow:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to authenticate');
      setIsConnected(false); // Reset connection state on error
      setIsTestingConnection(false);
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : 'Failed to authenticate',
        variant: "destructive",
      });
    }
  }, [localConfig, id]);

  const handleRetrieveEvents = useCallback(async () => {
    console.log('🔄 [Calendar Node] handleRetrieveEvents called, configId:', configId);
    
    if (!configId) {
      console.log('❌ [Calendar Node] No configId available');
      toast({
        title: "Error",
        description: "Please connect to Google Calendar first",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingEvents(true);
    try {
      console.log('📞 [Calendar Node] Calling calendar service...');
      const calendarService = (await import('../../services/calendarService')).default;
      const response = await calendarService.getEvents(configId);
      
      console.log('📥 [Calendar Node] Calendar service response:', response);
      console.log('📊 [Calendar Node] Response success:', response.success);
      console.log('📊 [Calendar Node] Events count:', response.events?.length || 0);
      
      if (response.success) {
        console.log('✅ [Calendar Node] Setting events state with:', response.events);
        setEvents(response.events || []);
        toast({
          title: "Events Retrieved",
          description: `Successfully retrieved ${response.events?.length || 0} events`,
        });
      } else {
        console.log('❌ [Calendar Node] Response not successful:', response.message);
        throw new Error(response.message || 'Failed to retrieve events');
      }
    } catch (error) {
      console.error('❌ [Calendar Node] Error retrieving events:', error);
      if (error.response) {
        console.error('❌ [Calendar Node] Error response:', error.response.data);
      }
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to retrieve events',
        variant: "destructive",
      });
    } finally {
      setIsLoadingEvents(false);
    }
  }, [configId]);

  const handleDirectCreateFromGroq = useCallback(async () => {
    if (!configId) {
      toast({ title: "Error", description: "Not connected", variant: "destructive" });
      return;
    }
    if (!inputData || !inputData.content) {
      toast({ title: "Error", description: "No event data from Groq", variant: "destructive" });
      return;
    }

    setIsCreatingFromGroq(true);
    console.log('🚀 [Calendar Node] Directly creating event from Groq data:', inputData.content);
    
    try {
      const calendarService = (await import('../../services/calendarService')).default;
      const result = await calendarService.createEvent(configId, inputData.content);

      if (result.success && result.event_link) {
        toast({
          title: "Event Created from Groq Data",
          description: (
            <span>
              Event successfully created.{" "}
              <a href={result.event_link} target="_blank" rel="noopener noreferrer" className="underline">
                View Event
              </a>
            </span>
          ),
        });
        setInputData(null); // Clear data after successful creation
      } else {
        throw new Error(result.message || "Failed to create event, backend error.");
      }
    } catch (error) {
      console.error('❌ [Calendar Node] Error creating event from Groq:', error);
      toast({
        title: "Failed to Create Event",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsCreatingFromGroq(false);
    }
  }, [configId, inputData]);

  const handleCreateEvent = useCallback(async () => {
    if (!configId) {
      toast({
        title: "Error",
        description: "Authentication error - please try signing in again",
        variant: "destructive",
      });
      return;
    }

    console.log('✨ Creating event with data:', newEvent);
    setIsCreatingEvent(true);
    try {
      const calendarService = (await import('../../services/calendarService')).default;
      const result = await calendarService.createEvent(configId, newEvent);

      if (result.success) {
        toast({
          title: "Event Created",
          description: "Successfully created calendar event",
        });
        setShowCreateEvent(false);
        // Reset form
        setNewEvent({
          summary: '',
          description: '',
          location: '',
          start: {
            dateTime: new Date().toISOString().slice(0, 16),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          attendees: []
        });
        // Refresh events list if we have one
        if (events.length > 0) {
          handleRetrieveEvents();
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('❌ [Calendar Node] Error creating event:', error);
      toast({
        title: "Failed to Create Event",
        description: error instanceof Error ? error.message : 'Failed to create event',
        variant: "destructive",
      });
    } finally {
      setIsCreatingEvent(false);
    }
  }, [configId, newEvent, events, handleRetrieveEvents]);

  const handleRun = useCallback(async () => {
    if (!isConnected || !configId) {
      toast({
        title: "Error",
        description: "Please connect to Google Calendar first",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    
    try {
      if (selectedAction === 'retrieve') {
        await handleRetrieveEvents();
      } else if (selectedAction === 'create') {
        await handleCreateEvent();
      }
    } catch (error) {
      console.error('❌ [Calendar Node] Error in run action:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Action failed',
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  }, [isConnected, configId, selectedAction, handleRetrieveEvents, handleCreateEvent]);

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
      {/* Light Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 rounded-xl" />
      
      {/* Content */}
      <div className="relative z-10 text-white">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="p-2 rounded-lg bg-gradient-to-br from-white/20 to-white/10 border border-white/20 backdrop-blur-sm w-14 h-14 flex items-center justify-center"
          >
            <img 
              src={gcalLogo} 
              alt="Google Calendar" 
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
            {mcpConnectionStatus === 'connected' && (
              <Badge variant="outline" className="text-xs text-green-400 border-green-400/50 ml-2">
                MCP Connected
              </Badge>
            )}
            {mcpConnectionStatus === 'connecting' && (
              <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400/50 ml-2 animate-pulse">
                Connecting to MCP...
              </Badge>
            )}
            {mcpConnectionStatus === 'error' && (
              <Badge variant="destructive" className="text-xs ml-2">
                MCP Failed
              </Badge>
            )}
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

        {/* Stats Section */}
        {stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-3 gap-3 mb-4"
          >
            <div className="p-3 rounded-lg bg-slate-800/30 border border-white/10">
              <p className="text-xs text-white/60 mb-1">Total Events</p>
              <p className="text-sm font-medium text-white">{stats.total_events || '--'}</p>
          </div>
            <div className="p-3 rounded-lg bg-slate-800/30 border border-white/10">
              <p className="text-xs text-white/60 mb-1">Calendars</p>
              <p className="text-sm font-medium text-white">{stats.calendar_count || '--'}</p>
          </div>
            <div className="p-3 rounded-lg bg-slate-800/30 border border-white/10">
              <p className="text-xs text-white/60 mb-1">Last Sync</p>
              <p className="text-sm font-medium text-white">
                {stats.last_sync ? new Date(stats.last_sync).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </motion.div>
        )}

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
                  {/* OAuth Settings */}
                  <AccordionItem value="oauth" className="border-white/10">
                    <AccordionTrigger className="text-sm font-medium text-white hover:text-white/80">
                      OAuth Settings
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
                      API Permissions
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

                  {/* Calendar Filters */}
                  <AccordionItem value="filters" className="border-white/10">
                    <AccordionTrigger className="text-sm font-medium text-white hover:text-white/80">
                      Calendar Filters
                    </AccordionTrigger>
                    <AccordionContent>
                      <Card className="bg-slate-800/50 border-white/10">
                        <CardContent className="p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-white">Max Results</Label>
                              <Input
                                type="number"
                                value={localConfig.filters.maxResults}
                                onChange={(e) => handleFilterChange('maxResults', parseInt(e.target.value))}
                                className="bg-slate-900/50 border-white/20 text-white"
                                min="1"
                                max="500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-white">Show Deleted</Label>
                              <div className="flex items-center space-x-2 h-10">
                                <Switch
                                  checked={localConfig.filters.showDeleted}
                                  onCheckedChange={(checked) => handleFilterChange('showDeleted', checked)}
                                />
                                <span className="text-white/70">
                                  {localConfig.filters.showDeleted ? 'Yes' : 'No'}
            </span>
                              </div>
          </div>
        </div>

                          <div className="space-y-2">
                            <Label className="text-white">Calendar IDs</Label>
                            <Input
                              value={localConfig.filters.calendarIds.join(', ')}
                              onChange={(e) => handleFilterChange('calendarIds', e.target.value.split(',').map(id => id.trim()))}
                              className="bg-slate-900/50 border-white/20 text-white"
                              placeholder="primary, calendar-id@group.calendar.google.com"
                            />
          </div>
          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-white">From Date</Label>
                              <Input
                                type="datetime-local"
                                value={localConfig.filters.timeMin.split('.')[0]}
                                onChange={(e) => handleFilterChange('timeMin', new Date(e.target.value).toISOString())}
                                className="bg-slate-900/50 border-white/20 text-white"
                              />
          </div>
                            <div className="space-y-2">
                              <Label className="text-white">To Date</Label>
                              <Input
                                type="datetime-local"
                                value={localConfig.filters.timeMax.split('.')[0]}
                                onChange={(e) => handleFilterChange('timeMax', new Date(e.target.value).toISOString())}
                                className="bg-slate-900/50 border-white/20 text-white"
                              />
        </div>
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
                              <Label className="text-white">Sync Interval (minutes)</Label>
                              <Input
                                type="number"
                                value={localConfig.syncInterval}
                                onChange={(e) => handleConfigChange('syncInterval', parseInt(e.target.value))}
                                className="bg-slate-900/50 border-white/20 text-white"
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

        {mcpConnectionStatus === 'connected' && availableMcpTools.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <Card className="bg-slate-800/30 border-white/10">
              <CardContent className="p-3">
                <h4 className="text-sm font-medium text-white/80 mb-2">Available Tools</h4>
                <div className="flex flex-wrap gap-2">
                  {availableMcpTools.map(tool => (
                    <Badge key={tool} variant="secondary" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 space-y-3">
        {!isConnected && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
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
                    <Calendar className="w-4 h-4 mr-2" />
                    Sign into Google Calendar
                </>
              )}
            </Button>
            </motion.div>
        )}

        {isConnected && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleRetrieveEvents}
                    disabled={isLoadingEvents}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0"
                  >
                    {isLoadingEvents ? (
                      <>
                        <Activity className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4 mr-2" />
                        Retrieve Events
                      </>
                    )}
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => setShowCreateEvent(true)}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </motion.div>
            </div>
            
              {/* Groq Data Section */}
              {inputData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="mt-4 bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                    <div>
                          <h4 className="text-sm font-medium text-green-200">Event Data from AI</h4>
                          <p className="text-xs text-green-200/70">Ready to create from Groq data</p>
                    </div>
                    <Button
                      variant="ghost"
                          size="icon"
                      onClick={() => setInputData(null)}
                          className="text-white/70 hover:text-white/90"
                    >
                          <X className="h-4 w-4" />
                    </Button>
                  </div>
                      
                      <div className="bg-black/20 p-3 rounded-lg space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-green-200 border-green-200/30">
                            Summary
                          </Badge>
                          <span className="text-white/90">{inputData.content.summary}</span>
                  </div>
                        {inputData.content.description && (
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-green-200 border-green-200/30">
                              Description
                            </Badge>
                            <span className="text-white/90">{inputData.content.description}</span>
                          </div>
                        )}
                      </div>

                  <Button
                    onClick={handleDirectCreateFromGroq}
                    disabled={isCreatingFromGroq}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  >
                    {isCreatingFromGroq ? (
                      <>
                            <Activity className="w-4 h-4 mr-2 animate-spin" />
                            Creating Event...
                      </>
                    ) : (
                      <>
                            <Calendar className="w-4 h-4 mr-2" />
                            Create Event
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
                </motion.div>
              )}

              {/* Events List */}
              {events.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <Card className="bg-slate-800/50 border-white/10">
                    <CardContent className="p-4">
                      <ScrollArea className="h-60">
                        <div className="space-y-3">
                          {events.map((event, index) => (
                            <motion.div
                              key={event.id || index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="p-3 rounded-lg bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-white/10 hover:border-white/20 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-white">{event.summary || 'Untitled Event'}</span>
                                <Badge variant="outline" className="text-xs text-white/60 border-white/20">
                                  {event.start?.dateTime ? new Date(event.start.dateTime).toLocaleDateString() : 'No date'}
                                </Badge>
                              </div>
                              {event.description && (
                                <p className="text-xs text-white/60 line-clamp-2">{event.description}</p>
                              )}
                              {event.location && (
                                <p className="text-xs text-white/60 mt-1">📍 {event.location}</p>
                              )}
                            </motion.div>
                          ))}
                </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </motion.div>
            )}
            </>
          )}
        </div>

        {/* Create Event Dialog */}
            <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
          <DialogContent className="sm:max-w-[425px] bg-slate-900 text-white border-slate-700">
                <DialogHeader>
                  <DialogTitle>Create Calendar Event</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="summary" className="text-white">Event Title</Label>
                    <Input
                      id="summary"
                      value={newEvent.summary}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, summary: e.target.value }))}
                  className="bg-slate-800 border-slate-600 text-white"
                      placeholder="Team Meeting"
                    />
                  </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description</Label>
                    <Textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-slate-800 border-slate-600 text-white min-h-[100px]"
                      placeholder="Meeting agenda and notes..."
                    />
                  </div>
              
              <div className="space-y-2">
                <Label htmlFor="location" className="text-white">Location</Label>
                    <Input
                      id="location"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                  className="bg-slate-800 border-slate-600 text-white"
                      placeholder="Conference Room A"
                    />
                  </div>
              
                  <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start" className="text-white">Start Time</Label>
                      <Input
                        id="start"
                        type="datetime-local"
                        value={newEvent.start.dateTime}
                        onChange={(e) => setNewEvent(prev => ({
                          ...prev,
                          start: { ...prev.start, dateTime: e.target.value }
                        }))}
                    className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                <div className="space-y-2">
                  <Label htmlFor="end" className="text-white">End Time</Label>
                      <Input
                        id="end"
                        type="datetime-local"
                        value={newEvent.end.dateTime}
                        onChange={(e) => setNewEvent(prev => ({
                          ...prev,
                          end: { ...prev.end, dateTime: e.target.value }
                        }))}
                    className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                  </div>
              
              <div className="space-y-2">
                <Label htmlFor="attendees" className="text-white">Attendees</Label>
                    <Textarea
                      id="attendees"
                      value={newEvent.attendees?.map(a => a.email).join('\n') || ''}
                      onChange={(e) => setNewEvent(prev => ({
                        ...prev,
                        attendees: e.target.value.split('\n')
                          .map(email => email.trim())
                          .filter(email => email)
                          .map(email => ({ email, optional: false }))
                      }))}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="One email per line"
                    />
                  </div>
              
                  <Button 
                    onClick={handleCreateEvent} 
                    disabled={isCreatingEvent || !newEvent.summary}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                {isCreatingEvent ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Event'
                )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
    </div>
  );
};

export default GoogleCalendarNode;