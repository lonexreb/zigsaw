#!/usr/bin/env node

/**
 * Simple test runner for Node Execution System
 * Tests the new node execution endpoints and validates backward compatibility
 */

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function runTest(name, testFn) {
  process.stdout.write(`  ${name}... `);
  try {
    await testFn();
    log(colors.green, '✅ PASS');
    return true;
  } catch (error) {
    log(colors.red, '❌ FAIL');
    console.log(`    Error: ${error.message}`);
    return false;
  }
}

async function testBackwardCompatibility() {
  log(colors.bold, '\n🔄 Testing Backward Compatibility');
  
  let passed = 0;
  let total = 0;

  // Test 1: Existing chat API
  total++;
  if (await runTest('POST /api/v1/chat with Groq', async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'Hello, this is a test.' }],
        temperature: 0.1,
        maxTokens: 20
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.content || typeof data.content !== 'string') {
      throw new Error('Invalid response format');
    }
  })) passed++;

  // Test 2: Workflow execution
  total++;
  if (await runTest('POST /api/workflow/execute', async () => {
    const response = await fetch(`${API_BASE_URL}/api/workflow/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow: { 
          nodes: [{ id: 'test-1', type: 'groqllama', data: {} }], 
          edges: [] 
        },
        test: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error('Workflow execution failed');
    }
  })) passed++;

  log(colors.blue, `\n  Backward Compatibility: ${passed}/${total} tests passed`);
  return passed === total;
}

async function testNodeExecution() {
  log(colors.bold, '\n🚀 Testing Node Execution APIs');
  
  let passed = 0;
  let total = 0;
  const testNodeId = `test-node-${Date.now()}`;

  // Test 1: GroqLlama execution
  total++;
  if (await runTest('POST /api/v1/nodes/execute/groq-llama', async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: testNodeId,
        config: {
          model: 'llama-3.1-8b-instant',
          systemPrompt: 'You are a helpful assistant. Respond briefly.',
          userPrompt: 'Say hello.',
          temperature: 0.1,
          maxTokens: 20
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(`Execution failed: ${data.error?.message || 'Unknown error'}`);
    }
    
    if (data.nodeId !== testNodeId) {
      throw new Error('Invalid nodeId in response');
    }
    
    if (!data.outputData || !data.outputData.content) {
      throw new Error('Missing output data');
    }
    
    if (!data.outputData.metadata || data.outputData.metadata.provider !== 'groq') {
      throw new Error('Invalid metadata');
    }
  })) passed++;

  // Test 2: Universal Agent execution
  total++;
  if (await runTest('POST /api/v1/nodes/execute/universal-agent', async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/universal-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: testNodeId,
        config: {
          provider: 'groq',
          model: 'llama-3.1-8b-instant',
          systemPrompt: 'You are a helpful assistant.',
          userPrompt: 'Hello, please respond briefly.',
          temperature: 0.1,
          maxTokens: 20
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(`Execution failed: ${data.error?.message || 'Unknown error'}`);
    }
  })) passed++;

  // Test 3: Error handling - invalid node type
  total++;
  if (await runTest('Error handling - invalid node type', async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/invalid-node`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: testNodeId,
        config: { model: 'test' }
      })
    });
    
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
    
    const data = await response.json();
    if (data.success !== false || data.error?.code !== 'UNSUPPORTED_NODE_TYPE') {
      throw new Error('Invalid error response');
    }
  })) passed++;

  // Test 4: Error handling - missing nodeId
  total++;
  if (await runTest('Error handling - missing nodeId', async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: { model: 'test' }
      })
    });
    
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
    
    const data = await response.json();
    if (data.error?.code !== 'INVALID_NODE_ID') {
      throw new Error('Invalid error code');
    }
  })) passed++;

  // Test 5: CORS preflight
  total++;
  if (await runTest('CORS preflight (OPTIONS)', async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
      method: 'OPTIONS'
    });
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
    if (corsOrigin !== '*') {
      throw new Error('CORS origin header missing or incorrect');
    }
  })) passed++;

  log(colors.blue, `\n  Node Execution: ${passed}/${total} tests passed`);
  return passed === total;
}

async function testDataFlow() {
  log(colors.bold, '\n🔄 Testing Data Flow Between Nodes');
  
  let passed = 0;
  let total = 0;

  // Test: Multi-node workflow simulation
  total++;
  if (await runTest('Multi-node data flow simulation', async () => {
    // Execute first node
    const response1 = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: 'workflow-node-1',
        config: {
          model: 'llama-3.1-8b-instant',
          systemPrompt: 'Generate a simple greeting message',
          userPrompt: 'Create a greeting',
          maxTokens: 30
        },
        workflowContext: {
          executionId: 'test-workflow-123',
          variables: {}
        }
      })
    });

    if (!response1.ok) {
      throw new Error(`First node failed: ${response1.status}`);
    }

    const data1 = await response1.json();
    if (!data1.success) {
      throw new Error('First node execution failed');
    }

    // Execute second node with output from first
    const response2 = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/universal-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: 'workflow-node-2',
        config: {
          provider: 'groq',
          model: 'llama-3.1-8b-instant',
          systemPrompt: 'Analyze the input and provide a summary',
          maxTokens: 50
        },
        inputData: data1.outputData.content,
        workflowContext: {
          executionId: 'test-workflow-123',
          variables: { previousNode: 'workflow-node-1' }
        }
      })
    });

    if (!response2.ok) {
      throw new Error(`Second node failed: ${response2.status}`);
    }

    const data2 = await response2.json();
    if (!data2.success) {
      throw new Error('Second node execution failed');
    }

    if (data2.executionId !== 'test-workflow-123') {
      throw new Error('Workflow context not preserved');
    }
  })) passed++;

  log(colors.blue, `\n  Data Flow: ${passed}/${total} tests passed`);
  return passed === total;
}

async function testPerformance() {
  log(colors.bold, '\n⚡ Testing Performance');
  
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
        maxTokens: 10
      }
    })
  });
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  if (!response.ok) {
    log(colors.red, `  ❌ Performance test failed: HTTP ${response.status}`);
    return false;
  }
  
  const data = await response.json();
  if (!data.success) {
    log(colors.red, '  ❌ Performance test failed: Execution error');
    return false;
  }
  
  log(colors.green, `  ✅ Groq execution time: ${totalTime}ms`);
  
  if (totalTime < 5000) {
    log(colors.green, '  ✅ Performance target met (< 5 seconds)');
    return true;
  } else {
    log(colors.yellow, '  ⚠️ Performance target missed (>= 5 seconds)');
    return false;
  }
}

async function main() {
  log(colors.bold, '🧪 Node Execution System Test Suite');
  log(colors.blue, `Testing against: ${API_BASE_URL}`);
  
  const results = {
    backwardCompatibility: false,
    nodeExecution: false,
    dataFlow: false,
    performance: false
  };
  
  try {
    results.backwardCompatibility = await testBackwardCompatibility();
    results.nodeExecution = await testNodeExecution();
    results.dataFlow = await testDataFlow();
    results.performance = await testPerformance();
    
    log(colors.bold, '\n📊 Test Summary:');
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const color = passed ? colors.green : colors.red;
      log(color, `  ${test}: ${status}`);
    });
    
    const allPassed = Object.values(results).every(Boolean);
    
    if (allPassed) {
      log(colors.green, '\n🎉 All tests passed! The node execution system is working correctly.');
      process.exit(0);
    } else {
      log(colors.red, '\n💥 Some tests failed. Please check the implementation.');
      process.exit(1);
    }
    
  } catch (error) {
    log(colors.red, `\n💥 Test suite failed with error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 