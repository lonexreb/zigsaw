/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Key, Eye, EyeOff, Check, AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { githubService, GitHubCredentials, GitHubStats, GitHubConnectionResponse } from '../services/githubService';

interface GitHubCredentialsTabProps {
  nodes: any[];
  isNodePanelOpen: boolean;
}

const GitHubCredentialsTab: React.FC<GitHubCredentialsTabProps> = ({ nodes, isNodePanelOpen }) => {
  const [credentials, setCredentials] = useState<GitHubCredentials>({
    auth_type: 'personal_access_token',
    token: '',
    username: '',
    base_url: 'https://api.github.com'
  });
  
  const [showToken, setShowToken] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [userInfo, setUserInfo] = useState<GitHubConnectionResponse['user_info'] | null>(null);
  const [stats, setStats] = useState<GitHubStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check for existing GitHub nodes and their connection status
  const githubNodes = nodes.filter(node => node.type === 'github');

  useEffect(() => {
    // Load saved credentials from localStorage
    const savedCredentials = localStorage.getItem('github_credentials');
    if (savedCredentials) {
      try {
        const parsed = JSON.parse(savedCredentials);
        setCredentials(parsed);
      } catch (error) {
        console.error('Failed to parse saved GitHub credentials:', error);
      }
    }
  }, []);

  const handleCredentialChange = (field: keyof GitHubCredentials, value: string) => {
    const updated = { ...credentials, [field]: value };
    setCredentials(updated);
    localStorage.setItem('github_credentials', JSON.stringify(updated));
  };

  const handleTestConnection = async () => {
    setIsConnecting(true);
    setConnectionStatus('connecting');
    setError(null);
    setSuccess(null);

    try {
      const testNodeId = 'github-credentials-test';
      const result = await githubService.connect(testNodeId, credentials);
      
      if (result.success) {
        setConnectionStatus('connected');
        setUserInfo(result.user_info || null);
        setSuccess('✅ GitHub credentials are valid!');
        
        try {
          const status = await githubService.getStatus(testNodeId);
          if (status.stats) {
            setStats(status.stats);
          }
        } catch (statsError) {
          console.log('Stats not available:', statsError);
        }
      } else {
        setConnectionStatus('error');
        setError('Failed to connect with provided credentials');
      }
    } catch (error) {
      setConnectionStatus('error');
      setError(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClearCredentials = () => {
    setCredentials({
      auth_type: 'personal_access_token',
      token: '',
      username: '',
      base_url: 'https://api.github.com'
    });
    localStorage.removeItem('github_credentials');
    setConnectionStatus('idle');
    setUserInfo(null);
    setStats(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400/30 to-pink-400/30 backdrop-blur-sm border border-purple-400/40">
            <Github className="w-6 h-6 text-purple-300" />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
            GitHub Credentials Manager
          </h3>
        </div>
        <p className="text-purple-200/70">Configure GitHub authentication for your workflows</p>
      </div>

      {/* Connection Status */}
      <AnimatePresence>
        {connectionStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4"
          >
            <Alert className={`border ${
              connectionStatus === 'connected' 
                ? 'border-emerald-400/30 bg-emerald-900/20' 
                : connectionStatus === 'connecting'
                ? 'border-yellow-400/30 bg-yellow-900/20'
                : 'border-red-400/30 bg-red-900/20'
            }`}>
              <div className="flex items-center space-x-2">
                {connectionStatus === 'connecting' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-yellow-400" />
                ) : connectionStatus === 'connected' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
                <AlertDescription className={`${
                  connectionStatus === 'connected' ? 'text-emerald-300' :
                  connectionStatus === 'connecting' ? 'text-yellow-300' :
                  'text-red-300'
                }`}>
                  {connectionStatus === 'connecting' && 'Testing connection...'}
                  {connectionStatus === 'connected' && 'Successfully connected to GitHub!'}
                  {connectionStatus === 'error' && 'Connection failed. Please check your credentials.'}
                </AlertDescription>
              </div>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert className="border-emerald-400/30 bg-emerald-900/20">
              <Check className="w-4 h-4 text-emerald-400" />
              <AlertDescription className="text-emerald-300">{success}</AlertDescription>
            </Alert>
          </motion.div>
        )}
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert className="border-red-400/30 bg-red-900/20">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <AlertDescription className="text-red-300">{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Info Display */}
      {userInfo && (
        <Card className="bg-slate-800/30 border-purple-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-purple-200 text-lg">Connected Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <img 
                src={userInfo.avatar_url} 
                alt={userInfo.name || userInfo.login}
                className="w-12 h-12 rounded-full border-2 border-purple-400/30"
              />
              <div>
                <h4 className="text-purple-200 font-medium">{userInfo.name || userInfo.login}</h4>
                <p className="text-purple-300/70 text-sm">@{userInfo.login}</p>
                <div className="flex space-x-4 mt-2 text-xs text-purple-300/70">
                  <span>{userInfo.public_repos} repos</span>
                  <span>{userInfo.followers} followers</span>
                  <span>{userInfo.following} following</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Display */}
      {stats && (
        <Card className="bg-slate-800/30 border-purple-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-purple-200 text-lg">Account Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-purple-300/70">Repositories:</span>
                <span className="text-purple-300 font-medium">{stats.repositories_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300/70">Total Stars:</span>
                <span className="text-yellow-300 font-medium">{stats.total_stars}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300/70">Open Issues:</span>
                <span className="text-orange-300 font-medium">{stats.open_issues}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300/70">Pull Requests:</span>
                <span className="text-blue-300 font-medium">{stats.open_pull_requests}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Nodes Status */}
      {githubNodes.length > 0 && (
        <Card className="bg-slate-800/30 border-purple-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-purple-200 text-lg">GitHub Nodes Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {githubNodes.map((node) => (
                <div key={node.id} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                  <div className="flex items-center space-x-2">
                    <Github className="w-4 h-4 text-purple-300" />
                    <span className="text-purple-200 text-sm">{node.data.label}</span>
                  </div>
                  <Badge 
                    variant={node.data.isConnected ? "default" : "secondary"}
                    className={node.data.isConnected ? "bg-emerald-600/30 text-emerald-300" : "bg-slate-600/30 text-slate-300"}
                  >
                    {node.data.isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credentials Form */}
      <Card className="bg-slate-800/30 border-purple-400/30">
        <CardHeader>
          <CardTitle className="text-purple-200 flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>Authentication Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-purple-200">Personal Access Token</Label>
              <div className="relative">
                <Input
                  type={showToken ? 'text' : 'password'}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={credentials.token || ''}
                  onChange={(e) => handleCredentialChange('token', e.target.value)}
                  className="bg-slate-800/50 border-purple-400/30 text-purple-200 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-purple-300 hover:text-purple-200"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-purple-300/70 mt-1">
                Generate a token at <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">GitHub Settings</a>
              </p>
            </div>
            
            <div>
              <Label className="text-purple-200">Username (Optional)</Label>
              <Input
                placeholder="github-username"
                value={credentials.username || ''}
                onChange={(e) => handleCredentialChange('username', e.target.value)}
                className="bg-slate-800/50 border-purple-400/30 text-purple-200"
              />
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={handleTestConnection}
                disabled={isConnecting || !credentials.token}
                className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
              >
                {isConnecting ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Test Connection
              </Button>
              
              <Button
                onClick={handleClearCredentials}
                variant="outline"
                className="border-purple-400/30 text-purple-200"
              >
                <Settings className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GitHubCredentialsTab; 