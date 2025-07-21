// Live Demo for AI Creator Button Improvements
// This demonstrates the enhanced workflow generation with:
// 1. Demo workflows (no API key needed)
// 2. All node types supported
// 3. Better error handling
// 4. Workflow validation

import React, { useState } from 'react';
import { workflowGenerationService } from '../src/services/workflowGenerationService';
import { Node, Edge } from '@xyflow/react';

// Demo component to test the AI Creator workflow
export const AICreatorLiveDemo: React.FC = () => {
  interface TestResult {
    name: string;
    description: string;
    success: boolean;
    error?: string;
    workflow?: any;
    questions?: any[];
    validation?: {
      hasWorkflow: boolean;
      hasNodes: boolean;
      hasEdges: boolean;
      hasExpectedNodes: boolean;
      nodeCount?: number;
      edgeCount?: number;
      hasTrigger?: boolean;
      estimatedTime?: number;
      requiredApiKeys?: string[];
      workflowValidation?: { valid: boolean; errors: string[] };
    };
  }
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Test cases that demonstrate different workflows
  const testCases = [
    {
      name: "GitHub PR to Email Workflow",
      description: "When someone creates a GitHub PR, have AI review the code and send me an email summary",
      expectedNodes: ['trigger', 'github', 'universal_agent', 'gmail']
    },
    {
      name: "Document Analysis Workflow", 
      description: "Analyze uploaded PDF documents with AI and generate a summary report",
      expectedNodes: ['trigger', 'document', 'universal_agent']
    },
    {
      name: "Calendar Event from Email",
      description: "When I receive an email with 'meeting' in subject, create a calendar event",
      expectedNodes: ['trigger', 'gmail', 'universal_agent', 'google_calendar']
    },
    {
      name: "Audio Transcription Pipeline",
      description: "Transcribe audio files and analyze the content with AI",
      expectedNodes: ['trigger', 'whisper', 'universal_agent']
    },
    {
      name: "Web Scraping with AI",
      description: "Scrape website content daily and generate AI insights",
      expectedNodes: ['trigger', 'firecrawl', 'universal_agent', 'gmail']
    }
  ];

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    for (const testCase of testCases) {
      try {
        console.log(`\n🧪 Testing: ${testCase.name}`);
        console.log(`📝 Description: ${testCase.description}`);
        
        // Call the workflow generation service
        const result = await workflowGenerationService.generateWorkflow({
          description: testCase.description,
          userPreferences: {
            preferredAIProvider: 'anthropic',
            complexity: 'intermediate',
            includeErrorHandling: true
          }
        });

        // Validate the result
        const testResult = {
          name: testCase.name,
          description: testCase.description,
          success: result.success,
          error: result.error,
          workflow: result.workflow,
          questions: result.questions,
          validation: {
            hasWorkflow: !!result.workflow,
            hasNodes: (result.workflow?.nodes?.length ?? 0) > 0,
            hasEdges: (result.workflow?.edges?.length ?? 0) > 0,
            hasExpectedNodes: testCase.expectedNodes.every(nodeType => 
              result.workflow?.nodes?.some(node => node.type === nodeType)
            ),
            nodeCount: result.workflow?.nodes?.length,
            edgeCount: result.workflow?.edges?.length,
            hasTrigger: result.workflow?.nodes?.some(node => node.type === 'trigger'),
            estimatedTime: result.workflow?.estimatedExecutionTime,
            requiredApiKeys: result.workflow?.requiredApiKeys
          }
        };

        // Additional validation
        if (result.workflow) {
          const validationResult = workflowGenerationService.validateWorkflow(
            result.workflow.nodes,
            result.workflow.edges
          );
          testResult.validation.workflowValidation = validationResult;
        }

        console.log('✅ Test Result:', testResult);
        setTestResults(prev => [...prev, testResult]);

      } catch (error) {
        console.error(`❌ Test failed for ${testCase.name}:`, error);
        setTestResults(prev => [...prev, {
          name: testCase.name,
          description: testCase.description,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }]);
      }
    }

    setIsRunning(false);
  };

  // Example of using the service directly
  const demonstrateDirectUsage = async () => {
    console.log('\n📋 Direct Usage Example:');
    
    // 1. Get available node types
    const nodeTypes = workflowGenerationService.getAvailableNodeTypes();
    console.log(`Available node types: ${nodeTypes.length}`);
    console.log('Categories:', [...new Set(nodeTypes.map(n => n.category))]);
    
    // 2. Get example workflows
    const examples = workflowGenerationService.getExampleWorkflows();
    console.log('\nExample workflows available:');
    examples.forEach(ex => {
      console.log(`- ${ex.name}: ${ex.prompt}`);
    });
    
    // 3. Generate a workflow
    const result = await workflowGenerationService.generateWorkflow({
      description: "When a GitHub issue is created, analyze it with AI and assign labels",
      userPreferences: {
        preferredAIProvider: 'anthropic',
        complexity: 'intermediate'
      }
    });
    
    console.log('\nGenerated workflow:', result);
    
    // 4. Validate the workflow
    if (result.workflow) {
      const validation = workflowGenerationService.validateWorkflow(
        result.workflow.nodes,
        result.workflow.edges
      );
      console.log('Validation result:', validation);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 AI Creator Live Demo</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Test the Enhanced AI Creator Workflow</h2>
        <p>This demo shows the improvements made to the AI Creator button:</p>
        <ul>
          <li>✅ Demo workflows work without API keys</li>
          <li>✅ Support for all 18+ node types</li>
          <li>✅ Better workflow validation</li>
          <li>✅ Intelligent error handling</li>
          <li>✅ Pre-built templates for common use cases</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runTests}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.6 : 1
          }}
        >
          {isRunning ? '🔄 Running Tests...' : '▶️ Run All Tests'}
        </button>

        <button 
          onClick={demonstrateDirectUsage}
          style={{
            marginLeft: '10px',
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📋 Show Direct Usage
        </button>
      </div>

      {testResults.length > 0 && (
        <div>
          <h2>Test Results</h2>
          {testResults.map((result, index) => (
            <div key={index} style={{
              marginBottom: '20px',
              padding: '15px',
              border: `2px solid ${result.success ? '#4CAF50' : '#f44336'}`,
              borderRadius: '8px',
              backgroundColor: result.success ? '#e8f5e9' : '#ffebee'
            }}>
              <h3>{result.success ? '✅' : '❌'} {result.name}</h3>
              <p><strong>Description:</strong> {result.description}</p>
              
              {result.error && (
                <p style={{ color: '#d32f2f' }}><strong>Error:</strong> {result.error}</p>
              )}
              
              {result.validation && (
                <div>
                  <h4>Validation Results:</h4>
                  <ul>
                    <li>Has Workflow: {result.validation.hasWorkflow ? '✅' : '❌'}</li>
                    <li>Has Nodes: {result.validation.hasNodes ? '✅' : '❌'} ({result.validation.nodeCount} nodes)</li>
                    <li>Has Edges: {result.validation.hasEdges ? '✅' : '❌'} ({result.validation.edgeCount} edges)</li>
                    <li>Has Expected Nodes: {result.validation.hasExpectedNodes ? '✅' : '❌'}</li>
                    <li>Has Trigger: {result.validation.hasTrigger ? '✅' : '❌'}</li>
                    <li>Estimated Time: {result.validation.estimatedTime}s</li>
                    <li>Required API Keys: {result.validation.requiredApiKeys?.join(', ') || 'None'}</li>
                    {result.validation.workflowValidation && (
                      <li>
                        Workflow Valid: {result.validation.workflowValidation.valid ? '✅' : '❌'}
                        {!result.validation.workflowValidation.valid && (
                          <ul>
                            {result.validation.workflowValidation.errors.map((error, i) => (
                              <li key={i} style={{ color: '#d32f2f' }}>{error}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {result.questions?.length > 0 && (
                <div>
                  <h4>Questions for User:</h4>
                  <ul>
                    {result.questions.map((q, i) => (
                      <li key={i}>
                        <strong>{q.question}</strong> (Type: {q.type}, Required: {q.required ? 'Yes' : 'No'})
                        <br />
                        <em>Context: {q.context}</em>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.workflow && (
                <details>
                  <summary style={{ cursor: 'pointer', marginTop: '10px' }}>
                    <strong>View Generated Workflow</strong>
                  </summary>
                  <pre style={{ 
                    backgroundColor: '#f5f5f5', 
                    padding: '10px', 
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '300px'
                  }}>
                    {JSON.stringify(result.workflow, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Console test function for Node.js environment
export async function runConsoleTest() {
  console.log('🚀 AI Creator Workflow - Console Test\n');
  
  const testPrompts = [
    "When someone creates a GitHub PR, have AI review the code and send me an email summary",
    "Monitor my Gmail for invoices and automatically extract data to a spreadsheet",
    "Every morning at 9am, generate an AI summary of yesterday's activities and post to Slack",
    "When a document is uploaded, extract text, analyze sentiment, and store in database",
    "Create a voice-to-text pipeline that transcribes audio and generates meeting notes"
  ];

  for (const prompt of testPrompts) {
    console.log(`\n📝 Testing prompt: "${prompt}"`);
    console.log('─'.repeat(80));
    
    const result = await workflowGenerationService.generateWorkflow({
      description: prompt
    });
    
    if (result.success) {
      console.log('✅ Workflow generated successfully!');
      console.log(`📊 Nodes: ${result.workflow?.nodes.length}, Edges: ${result.workflow?.edges.length}`);
      console.log(`⏱️  Estimated time: ${result.workflow?.estimatedExecutionTime}s`);
      console.log(`🔑 Required APIs: ${result.workflow?.requiredApiKeys.join(', ')}`);
      
      // Show node flow
      if (result.workflow) {
        const nodeFlow = result.workflow.nodes
          .map(n => `${n.type}(${n.data.label})`)
          .join(' → ');
        console.log(`🔄 Flow: ${nodeFlow}`);
      }
      
      // Show questions if any
      if (result.questions && result.questions.length > 0) {
        console.log('\n❓ Questions for user:');
        result.questions.forEach(q => {
          console.log(`   - ${q.question}`);
        });
      }
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }
  }
  
  console.log('\n\n✨ Test completed!');
}

// Export for testing
export default AICreatorLiveDemo; 