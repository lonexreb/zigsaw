import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Play, Check, AlertCircle, RefreshCw, FileText, GitBranch, Star, Users, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { githubService, GitHubOperationCategory, GitHubOperationResponse } from '../services/githubService';
import { Node } from '@xyflow/react';

interface GitHubWorkflowTesterProps {
  nodes: Node[];
}

interface ExecutionResult {
  id: number;
  operation: string;
  repository: string;
  result: GitHubOperationResponse;
  timestamp: string;
}

const GitHubWorkflowTester: React.FC<GitHubWorkflowTesterProps> = ({ nodes }) => {
  const [availableOperations, setAvailableOperations] = useState<GitHubOperationCategory[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [repository, setRepository] = useState<string>('');
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load available operations on mount
  useEffect(() => {
    const loadOperations = async () => {
      try {
        const operations = await githubService.getAvailableOperations();
        setAvailableOperations(operations);
        if (operations.length > 0 && operations[0].operations.length > 0) {
          setSelectedOperation(operations[0].operations[0].name);
        }
      } catch (error) {
        console.error('Failed to load GitHub operations:', error);
        setError('Failed to load available operations');
      }
    };
    loadOperations();
  }, []);

  const handleExecuteOperation = async () => {
    if (!selectedOperation) return;

    setIsExecuting(true);
    setError(null);

    try {
      // Find a GitHub node to use for execution
      const githubNode = nodes.find(node => node.type === 'github');
      if (!githubNode) {
        throw new Error('No GitHub node found in the workflow');
      }

      const result = await githubService.executeOperation(
        githubNode.id,
        selectedOperation,
        parameters,
        repository || undefined
      );

      setResults(prev => [{
        id: Date.now(),
        operation: selectedOperation,
        repository: repository || 'N/A',
        result: result,
        timestamp: new Date().toISOString()
      }, ...prev]);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Operation failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleParameterChange = (key: string, value: string) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  const getOperationDescription = (operationName: string) => {
    for (const category of availableOperations) {
      const operation = category.operations.find(op => op.name === operationName);
      if (operation) {
        return operation.description;
      }
    }
    return '';
  };

  const getOperationParameters = (operationName: string) => {
    for (const category of availableOperations) {
      const operation = category.operations.find(op => op.name === operationName);
      if (operation) {
        return operation.parameters;
      }
    }
    return [];
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
            GitHub Workflow Tester
          </h3>
        </div>
        <p className="text-purple-200/70">Test GitHub operations and workflows end-to-end</p>
      </div>

      {/* Error Display */}
      <AnimatePresence>
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

      {/* Operation Configuration */}
      <Card className="bg-slate-800/30 border-purple-400/30">
        <CardHeader>
          <CardTitle className="text-purple-200 flex items-center space-x-2">
            <Play className="w-5 h-5" />
            <span>Operation Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Repository Input */}
          <div>
            <Label className="text-purple-200">Repository (Optional)</Label>
            <Input
              placeholder="owner/repository"
              value={repository}
              onChange={(e) => setRepository(e.target.value)}
              className="bg-slate-800/50 border-purple-400/30 text-purple-200"
            />
            <p className="text-xs text-purple-300/70 mt-1">
              Format: username/repository-name (e.g., octocat/Hello-World)
            </p>
          </div>

          {/* Operation Selection */}
          <div>
            <Label className="text-purple-200">Operation</Label>
            <Select value={selectedOperation} onValueChange={setSelectedOperation}>
              <SelectTrigger className="bg-slate-800/50 border-purple-400/30 text-purple-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableOperations.map((category) => 
                  category.operations.map((op) => (
                    <SelectItem key={op.name} value={op.name}>
                      {category.category}: {op.description}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedOperation && (
              <p className="text-xs text-purple-300/70 mt-1">
                {getOperationDescription(selectedOperation)}
              </p>
            )}
          </div>

          {/* Dynamic Parameters */}
          {selectedOperation && getOperationParameters(selectedOperation).length > 0 && (
            <div className="space-y-3">
              <Label className="text-purple-200">Parameters</Label>
              {getOperationParameters(selectedOperation).map((param) => (
                <div key={param}>
                  <Label className="text-purple-200 text-sm">{param}</Label>
                  <Input
                    placeholder={`Enter ${param}`}
                    value={parameters[param] || ''}
                    onChange={(e) => handleParameterChange(param, e.target.value)}
                    className="bg-slate-800/50 border-purple-400/30 text-purple-200"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Execute Button */}
          <Button
            onClick={handleExecuteOperation}
            disabled={isExecuting || !selectedOperation}
            className="bg-purple-600 hover:bg-purple-700 text-white w-full"
          >
            {isExecuting ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Execute Operation
          </Button>
        </CardContent>
      </Card>

      {/* Results Display */}
      {results.length > 0 && (
        <Card className="bg-slate-800/30 border-purple-400/30">
          <CardHeader>
            <CardTitle className="text-purple-200 flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Execution Results</span>
              <Badge variant="secondary" className="bg-purple-600/30 text-purple-200">
                {results.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${
                    result.result.success 
                      ? 'border-emerald-400/30 bg-emerald-900/20' 
                      : 'border-red-400/30 bg-red-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {result.result.success ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`font-medium ${
                        result.result.success ? 'text-emerald-300' : 'text-red-300'
                      }`}>
                        {result.operation}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-purple-300/70">
                      <GitBranch className="w-3 h-3" />
                      <span>{result.repository}</span>
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-slate-800/30 rounded">
                        <span className="text-slate-400">Status:</span>
                        <p className={`font-mono ${result.result.success ? 'text-emerald-300' : 'text-red-300'}`}>
                          {result.result.success ? 'Success' : 'Failed'}
                        </p>
                      </div>
                      <div className="p-2 bg-slate-800/30 rounded">
                        <span className="text-slate-400">Message:</span>
                        <p className="font-mono text-purple-300 truncate">
                          {result.result.message}
                        </p>
                      </div>
                    </div>

                    {result.result.success && result.result.data && (
                      <div className="p-2 bg-slate-800/30 rounded">
                        <span className="text-slate-400 text-xs">Data:</span>
                        <div className="mt-1 max-h-20 overflow-y-auto">
                          <pre className="text-xs text-emerald-300 font-mono">
                            {JSON.stringify(result.result.data, null, 2).substring(0, 200)}
                            {JSON.stringify(result.result.data, null, 2).length > 200 && '...'}
                          </pre>
                        </div>
                      </div>
                    )}

                    {!result.result.success && result.result.message && (
                      <div className="p-2 bg-red-500/10 border border-red-500/20 rounded">
                        <p className="text-red-400 text-xs">{result.result.message}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Test Templates */}
      <Card className="bg-slate-800/30 border-purple-400/30">
        <CardHeader>
          <CardTitle className="text-purple-200 flex items-center space-x-2">
            <Star className="w-5 h-5" />
            <span>Quick Test Templates</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedOperation('list_repositories');
                setRepository('');
                setParameters({});
              }}
              className="border-purple-400/30 text-purple-200 hover:bg-purple-600/20"
            >
              <Users className="w-4 h-4 mr-2" />
              List Repositories
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setSelectedOperation('get_user_info');
                setRepository('');
                setParameters({});
              }}
              className="border-purple-400/30 text-purple-200 hover:bg-purple-600/20"
            >
              <Github className="w-4 h-4 mr-2" />
              Get User Info
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setSelectedOperation('list_issues');
                setRepository('octocat/Hello-World');
                setParameters({ state: 'open' });
              }}
              className="border-purple-400/30 text-purple-200 hover:bg-purple-600/20"
            >
              <FileText className="w-4 h-4 mr-2" />
              List Issues
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setSelectedOperation('get_rate_limit');
                setRepository('');
                setParameters({});
              }}
              className="border-purple-400/30 text-purple-200 hover:bg-purple-600/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Rate Limit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GitHubWorkflowTester; 