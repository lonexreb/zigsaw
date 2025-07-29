#!/usr/bin/env node

/**
 * Implementation Validation Script
 * Validates that our node execution system is working correctly
 * without requiring actual API keys
 */

const API_BASE_URL = 'http://localhost:3000';

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

async function validateEndpoints() {
  log(colors.bold, '\n🔍 Validating Node Execution System Implementation');
  
  const results = [];
  
  // Test 1: Server connectivity
  try {
    const response = await fetch(`${API_BASE_URL}/api/hello`);
    if (response.ok) {
      results.push({ test: 'Server Connectivity', status: '✅ PASS', details: 'Server responding' });
    } else {
      results.push({ test: 'Server Connectivity', status: '❌ FAIL', details: `HTTP ${response.status}` });
    }
  } catch (error) {
    results.push({ test: 'Server Connectivity', status: '❌ FAIL', details: 'Connection failed' });
  }

  // Test 2: Invalid node type handling
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/invalid-node`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId: 'test', config: { model: 'test' } })
    });
    
    if (response.status === 400) {
      const data = await response.json();
      if (data.error?.code === 'UNSUPPORTED_NODE_TYPE') {
        results.push({ test: 'Invalid Node Type Validation', status: '✅ PASS', details: 'Proper error handling' });
      } else {
        results.push({ test: 'Invalid Node Type Validation', status: '❌ FAIL', details: 'Wrong error code' });
      }
    } else {
      results.push({ test: 'Invalid Node Type Validation', status: '❌ FAIL', details: `Expected 400, got ${response.status}` });
    }
  } catch (error) {
    results.push({ test: 'Invalid Node Type Validation', status: '❌ FAIL', details: error.message });
  }

  // Test 3: Missing nodeId validation
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: { model: 'test' } })
    });
    
    if (response.status === 400) {
      const data = await response.json();
      if (data.error?.code === 'INVALID_NODE_ID') {
        results.push({ test: 'Missing NodeId Validation', status: '✅ PASS', details: 'Proper validation' });
      } else {
        results.push({ test: 'Missing NodeId Validation', status: '❌ FAIL', details: 'Wrong error code' });
      }
    } else {
      results.push({ test: 'Missing NodeId Validation', status: '❌ FAIL', details: `Expected 400, got ${response.status}` });
    }
  } catch (error) {
    results.push({ test: 'Missing NodeId Validation', status: '❌ FAIL', details: error.message });
  }

  // Test 4: CORS preflight
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
      method: 'OPTIONS'
    });
    
    if (response.status === 200) {
      const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
      if (corsOrigin === '*') {
        results.push({ test: 'CORS Preflight', status: '✅ PASS', details: 'CORS headers correct' });
      } else {
        results.push({ test: 'CORS Preflight', status: '❌ FAIL', details: 'CORS headers missing' });
      }
    } else {
      results.push({ test: 'CORS Preflight', status: '❌ FAIL', details: `Expected 200, got ${response.status}` });
    }
  } catch (error) {
    results.push({ test: 'CORS Preflight', status: '❌ FAIL', details: error.message });
  }

  // Test 5: Method not allowed
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
      method: 'GET'
    });
    
    if (response.status === 405) {
      const data = await response.json();
      if (data.error?.code === 'METHOD_NOT_ALLOWED') {
        results.push({ test: 'Method Not Allowed', status: '✅ PASS', details: 'Proper method validation' });
      } else {
        results.push({ test: 'Method Not Allowed', status: '❌ FAIL', details: 'Wrong error code' });
      }
    } else {
      results.push({ test: 'Method Not Allowed', status: '❌ FAIL', details: `Expected 405, got ${response.status}` });
    }
  } catch (error) {
    results.push({ test: 'Method Not Allowed', status: '❌ FAIL', details: error.message });
  }

  // Test 6: API key validation (should fail with proper error)
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: 'test-node',
        config: {
          model: 'llama-3.1-8b-instant',
          systemPrompt: 'Test',
          userPrompt: 'Hello'
        }
      })
    });
    
    if (response.status === 200) {
      const data = await response.json();
      if (!data.success && data.error?.message?.includes('GROQ_API_KEY')) {
        results.push({ test: 'API Key Validation', status: '✅ PASS', details: 'Proper API key validation' });
      } else {
        results.push({ test: 'API Key Validation', status: '❌ FAIL', details: 'Unexpected response' });
      }
    } else {
      results.push({ test: 'API Key Validation', status: '❌ FAIL', details: `Unexpected status ${response.status}` });
    }
  } catch (error) {
    results.push({ test: 'API Key Validation', status: '❌ FAIL', details: error.message });
  }

  // Test 7: Workflow context preservation
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/nodes/execute/groq-llama`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: 'context-test',
        config: { model: 'llama-3.1-8b-instant', systemPrompt: 'Test' },
        workflowContext: { executionId: 'test-workflow-123', variables: {} }
      })
    });
    
    if (response.status === 200) {
      const data = await response.json();
      if (data.executionId === 'test-workflow-123') {
        results.push({ test: 'Workflow Context Preservation', status: '✅ PASS', details: 'Context preserved correctly' });
      } else {
        results.push({ test: 'Workflow Context Preservation', status: '❌ FAIL', details: 'Context not preserved' });
      }
    } else {
      results.push({ test: 'Workflow Context Preservation', status: '❌ FAIL', details: `HTTP ${response.status}` });
    }
  } catch (error) {
    results.push({ test: 'Workflow Context Preservation', status: '❌ FAIL', details: error.message });
  }

  // Test 8: Backward compatibility
  try {
    const response = await fetch(`${API_BASE_URL}/api/workflow/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow: { nodes: [], edges: [] },
        test: true
      })
    });
    
    if (response.status === 200) {
      const data = await response.json();
      if (data.success) {
        results.push({ test: 'Backward Compatibility', status: '✅ PASS', details: 'Existing APIs working' });
      } else {
        results.push({ test: 'Backward Compatibility', status: '❌ FAIL', details: 'Existing API failed' });
      }
    } else {
      results.push({ test: 'Backward Compatibility', status: '❌ FAIL', details: `HTTP ${response.status}` });
    }
  } catch (error) {
    results.push({ test: 'Backward Compatibility', status: '❌ FAIL', details: error.message });
  }

  return results;
}

async function main() {
  log(colors.bold, '🧪 Node Execution System - Implementation Validation');
  log(colors.blue, `Testing against: ${API_BASE_URL}`);
  
  const results = await validateEndpoints();
  
  // Display results
  log(colors.bold, '\n📊 Validation Results:');
  results.forEach(result => {
    const color = result.status.includes('✅') ? colors.green : colors.red;
    log(color, `  ${result.test}: ${result.status}`);
    if (result.details) {
      console.log(`    ${result.details}`);
    }
  });
  
  const passedTests = results.filter(r => r.status.includes('✅')).length;
  const totalTests = results.length;
  
  log(colors.bold, `\n🎯 Summary: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    log(colors.green, '\n🎉 Implementation Validation SUCCESSFUL!');
    log(colors.green, '✅ Node execution system is working correctly');
    log(colors.green, '✅ All endpoints responding properly');
    log(colors.green, '✅ Error handling implemented correctly');
    log(colors.green, '✅ Validation and security working');
    log(colors.green, '✅ Backward compatibility maintained');
    log(colors.yellow, '\n💡 API key failures are expected in development environment');
    log(colors.blue, '🚀 Ready for frontend integration!');
    process.exit(0);
  } else {
    log(colors.red, '\n💥 Some validation tests failed');
    log(colors.red, 'Please check the implementation');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 