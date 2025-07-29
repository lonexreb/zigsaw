import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

// Test configuration
const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000; // 30 seconds for API calls

// Test data
const testNodeId = `test-node-${Date.now()}`;
const testExecutionId = `exec-${Date.now()}`;

describe('Node Execution System Tests', () => {
  
  // Test 1: Verify existing APIs still work (backward compatibility)
  describe('Existing API Compatibility', () => {
    
    test('POST /api/v1/chat still works with Groq', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'groq',
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: 'Hello, this is a test message.' }],
          temperature: 0.1,
          maxTokens: 50
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('content');
      expect(typeof data.content).toBe('string');
    }, TEST_TIMEOUT);

    test('POST /api/workflow/execute still works', async () => {
      const response = await fetch(`${API_BASE_URL}/api/workflow/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: { 
            nodes: [
              { id: 'test-1', type: 'groqllama', data: {} }
            ], 
            edges: [] 
          },
          test: true
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
    }, TEST_TIMEOUT);

    test('PUT /api/v1/nodes/[nodeId] still works', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/nodes/${testNodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'universal_agent',
          name: 'Test Node',
          description: 'Test node for compatibility',
          position: { x: 100, y: 100 },
          workflow_id: 'test-workflow',
          config: {
            model: 'llama-3.1-8b-instant',
            system_prompt: 'You are a test assistant'
          }
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.node_id).toBe(testNodeId);
    }, TEST_TIMEOUT);
  });

  // Test 2: New Node Execution Endpoints
  describe('Node Execution APIs', () => {

    test('POST /api/v1/nodes/execute/groq-llama should work', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: testNodeId,
          config: {
            model: 'llama-3.1-8b-instant',
            systemPrompt: 'You are a helpful assistant. Respond briefly.',
            userPrompt: 'Say hello and nothing else.',
            temperature: 0.1,
            maxTokens: 20
          }
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.nodeId).toBe(testNodeId);
      expect(data.outputData).toBeDefined();
      expect(data.outputData.type).toBe('text');
      expect(data.outputData.content).toBeDefined();
      expect(data.outputData.metadata).toBeDefined();
      expect(data.outputData.metadata.provider).toBe('groq');
      expect(data.outputData.metadata.execution_time_ms).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    test('POST /api/v1/nodes/execute/universal-agent should work', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/universal-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: testNodeId,
          config: {
            provider: 'groq',
            model: 'llama-3.1-8b-instant',
            systemPrompt: 'You are a helpful assistant. Respond briefly.',
            userPrompt: 'Hello, please respond with exactly: "Universal Agent works"',
            temperature: 0.1,
            maxTokens: 10
          }
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.nodeId).toBe(testNodeId);
      expect(data.outputData).toBeDefined();
      expect(data.outputData.metadata.provider).toBe('groq');
    }, TEST_TIMEOUT);

    test('POST /api/v1/nodes/execute/claude should work with API key', async () => {
      // Skip if no Claude API key available
      if (!process.env.CLAUDE_API_KEY) {
        console.log('⚠️ Skipping Claude test - no API key available');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/claude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: testNodeId,
          config: {
            model: 'claude-3-haiku-20240307',
            systemPrompt: 'You are Claude. Respond briefly.',
            userPrompt: 'Say "Claude works" and nothing else.',
            temperature: 0.1,
            maxTokens: 10
          }
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.nodeId).toBe(testNodeId);
      expect(data.outputData.metadata.provider).toBe('anthropic');
    }, TEST_TIMEOUT);

    test('POST /api/v1/nodes/execute/gemini should work with API key', async () => {
      // Skip if no Gemini API key available
      if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_AI_API_KEY) {
        console.log('⚠️ Skipping Gemini test - no API key available');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: testNodeId,
          config: {
            model: 'gemini-1.5-flash',
            systemPrompt: 'You are Gemini. Respond briefly.',
            userPrompt: 'Say "Gemini works" and nothing else.',
            temperature: 0.1,
            maxTokens: 10
          }
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.nodeId).toBe(testNodeId);
      expect(data.outputData.metadata.provider).toBe('google');
    }, TEST_TIMEOUT);
  });

  // Test 3: Error Handling and Validation
  describe('Error Handling', () => {

    test('Should reject invalid node type', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/invalid-node`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: testNodeId,
          config: { model: 'test' }
        })
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNSUPPORTED_NODE_TYPE');
    });

    test('Should reject missing nodeId', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: { model: 'test' }
        })
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_NODE_ID');
    });

    test('Should reject missing config', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: testNodeId
        })
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_CONFIG');
    });

    test('Should handle OPTIONS requests', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
        method: 'OPTIONS'
      });
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    test('Should reject non-POST methods', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
        method: 'GET'
      });
      
      expect(response.status).toBe(405);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('METHOD_NOT_ALLOWED');
    });
  });

  // Test 4: Input Data Handling
  describe('Input Data Processing', () => {

    test('Should handle string input data', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: testNodeId,
          config: {
            model: 'llama-3.1-8b-instant',
            systemPrompt: 'Echo what the user says',
            temperature: 0.1,
            maxTokens: 50
          },
          inputData: 'This is input data from a previous node'
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.outputData.content).toBeDefined();
    }, TEST_TIMEOUT);

    test('Should handle JSON input data', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: testNodeId,
          config: {
            model: 'llama-3.1-8b-instant',
            systemPrompt: 'Summarize the data provided',
            temperature: 0.1,
            maxTokens: 100
          },
          inputData: {
            type: 'analysis',
            data: { users: 100, revenue: 50000 },
            metadata: { source: 'analytics' }
          }
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.outputData.content).toBeDefined();
    }, TEST_TIMEOUT);

    test('Should handle workflow context', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: testNodeId,
          config: {
            model: 'llama-3.1-8b-instant',
            systemPrompt: 'You are part of a workflow',
            userPrompt: 'Acknowledge the workflow context',
            temperature: 0.1,
            maxTokens: 30
          },
          workflowContext: {
            executionId: testExecutionId,
            variables: {
              step: 2,
              previousOutput: 'processed data'
            }
          }
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.executionId).toBe(testExecutionId);
    }, TEST_TIMEOUT);
  });

  // Test 5: Metadata and Cost Tracking
  describe('Metadata and Analytics', () => {

    test('Should include execution metadata', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: testNodeId,
          config: {
            model: 'llama-3.1-8b-instant',
            systemPrompt: 'Test metadata',
            userPrompt: 'Hello',
            temperature: 0.7,
            maxTokens: 50
          }
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.outputData.metadata).toBeDefined();
      expect(data.outputData.metadata.model).toBe('llama-3.1-8b-instant');
      expect(data.outputData.metadata.provider).toBe('groq');
      expect(data.outputData.metadata.execution_time_ms).toBeGreaterThan(0);
      expect(data.outputData.metadata.cost_usd).toBeGreaterThanOrEqual(0);
    }, TEST_TIMEOUT);

    test('Should track different model costs', async () => {
      const response1 = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: testNodeId,
          config: {
            model: 'llama-3.1-8b-instant',
            systemPrompt: 'Cost test',
            userPrompt: 'Short response',
            maxTokens: 10
          }
        })
      });

      expect(response1.status).toBe(200);
      const data1 = await response1.json();
      expect(data1.outputData.metadata.cost_usd).toBeDefined();
      expect(typeof data1.outputData.metadata.cost_usd).toBe('number');
    }, TEST_TIMEOUT);
  });

  // Cleanup
  afterAll(async () => {
    // Clean up test node if it was created
    try {
      await fetch(`${API_BASE_URL}/api/v1/nodes/${testNodeId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });
});

// Performance benchmark test
describe('Performance Benchmarks', () => {
  
  test('Groq execution should be fast (< 5 seconds)', async () => {
    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: `benchmark-${Date.now()}`,
        config: {
          model: 'llama-3.1-8b-instant',
          systemPrompt: 'Respond quickly',
          userPrompt: 'Hello',
          maxTokens: 20
        }
      })
    });
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    expect(response.status).toBe(200);
    expect(totalTime).toBeLessThan(5000); // Less than 5 seconds
    
    const data = await response.json();
    expect(data.success).toBe(true);
    console.log(`⚡ Groq execution time: ${totalTime}ms`);
  }, 10000);
});

// Integration test with multiple nodes
describe('Multi-Node Workflow Simulation', () => {
  
  test('Should simulate data flow between nodes', async () => {
    // Step 1: Execute first node
    const response1 = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: 'workflow-node-1',
        config: {
          model: 'llama-3.1-8b-instant',
          systemPrompt: 'Generate a simple JSON object with a name and age',
          userPrompt: 'Create a person object',
          maxTokens: 50
        },
        workflowContext: {
          executionId: 'workflow-test-123',
          variables: {}
        }
      })
    });

    expect(response1.status).toBe(200);
    const data1 = await response1.json();
    expect(data1.success).toBe(true);

    // Step 2: Use output from first node as input to second node
    const response2 = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/universal-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: 'workflow-node-2',
        config: {
          provider: 'groq',
          model: 'llama-3.1-8b-instant',
          systemPrompt: 'Analyze the data provided and extract key information',
          maxTokens: 100
        },
        inputData: data1.outputData.content,
        workflowContext: {
          executionId: 'workflow-test-123',
          variables: {
            previousNode: 'workflow-node-1'
          }
        }
      })
    });

    expect(response2.status).toBe(200);
    const data2 = await response2.json();
    expect(data2.success).toBe(true);
    expect(data2.executionId).toBe('workflow-test-123');
    
    console.log('✅ Multi-node workflow simulation completed successfully');
  }, TEST_TIMEOUT * 2);
}); 