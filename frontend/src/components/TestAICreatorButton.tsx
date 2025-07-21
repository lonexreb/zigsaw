import React, { useState } from 'react';
import { Button } from './ui/button';
import { useWorkflow } from '../contexts/WorkflowContext';
import { workflowGenerationService } from '../services/workflowGenerationService';

export const TestAICreatorButton: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const { addNodes, addEdges, getActiveWorkflow, workflows, activeWorkflowId } = useWorkflow();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const testWorkflow = async () => {
    setIsGenerating(true);
    setLogs([]);
    
    try {
      addLog('🚀 Starting AI Creator test...');
      
      // Step 1: Check initial state
      addLog(`📊 Initial state - Workflows: ${workflows.length}, Active: ${activeWorkflowId}`);
      
      // Step 2: Generate workflow
      addLog('🤖 Generating workflow...');
      const result = await workflowGenerationService.generateWorkflow({
        description: "When someone creates a GitHub PR, have AI review the code and send me an email summary"
      });
      
      if (result.success && result.workflow) {
        addLog(`✅ Generated workflow with ${result.workflow.nodes.length} nodes`);
        
        // Step 3: Add to workflow context
        addLog('📝 Adding nodes to workflow context...');
        addNodes(result.workflow.nodes);
        
        addLog('🔗 Adding edges to workflow context...');
        addEdges(result.workflow.edges);
        
        // Step 4: Check final state
        const finalActiveWorkflow = getActiveWorkflow();
        addLog(`📊 Final state - Active workflow nodes: ${finalActiveWorkflow?.nodes.length || 0}`);
        addLog(`📊 Final state - Active workflow edges: ${finalActiveWorkflow?.edges.length || 0}`);
        
        if (finalActiveWorkflow && finalActiveWorkflow.nodes.length > 0) {
          addLog('🎉 SUCCESS! Nodes should now appear on canvas');
        } else {
          addLog('❌ FAILED! No nodes in active workflow');
        }
        
      } else {
        addLog(`❌ Workflow generation failed: ${result.error}`);
      }
      
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 rounded-lg max-w-2xl">
      <h3 className="text-lg font-semibold text-white mb-4">AI Creator Test</h3>
      
      <Button 
        onClick={testWorkflow} 
        disabled={isGenerating}
        className="mb-4"
      >
        {isGenerating ? 'Testing...' : 'Test AI Creator → Canvas Integration'}
      </Button>
      
      <div className="bg-slate-800 rounded p-4 max-h-96 overflow-y-auto">
        <h4 className="text-sm font-medium text-slate-300 mb-2">Test Logs:</h4>
        {logs.length === 0 ? (
          <p className="text-slate-500 text-sm">Click the button to run the test...</p>
        ) : (
          <div className="text-xs font-mono text-green-400 space-y-1">
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-4 text-sm text-slate-400">
        <p>Current workflows: {workflows.length}</p>
        <p>Active workflow ID: {activeWorkflowId || 'None'}</p>
        <p>Active workflow nodes: {getActiveWorkflow()?.nodes.length || 0}</p>
      </div>
    </div>
  );
}; 