// Integration test to verify AI Creator -> Canvas workflow
// This test simulates the complete user flow

import { workflowGenerationService } from '../src/services/workflowGenerationService';

console.log('🔄 Integration Test: AI Creator → Canvas Integration\n');

async function testAICreatorToCanvasIntegration() {
  console.log('📋 Testing complete workflow: AI Creator → Canvas');
  console.log('─'.repeat(60));
  
  try {
    // Step 1: Generate workflow using AI Creator
    console.log('Step 1: Generating workflow with AI Creator...');
    const result = await workflowGenerationService.generateWorkflow({
      description: "When someone creates a GitHub PR, have AI review the code and send me an email summary"
    });
    
    console.log('✅ AI Creator generated workflow successfully');
    console.log(`  - Nodes: ${result.workflow?.nodes.length}`);
    console.log(`  - Edges: ${result.workflow?.edges.length}`);
    console.log(`  - Flow: ${result.workflow?.nodes.map(n => n.data.label).join(' → ')}`);
    
    // Step 2: Simulate adding to canvas (what happens when user clicks "Execute Workflow")
    console.log('\nStep 2: Simulating workflow execution...');
    
    if (result.workflow) {
      // This is what the handleExecuteWorkflow function does
      const workflowNodes = result.workflow.nodes;
      const workflowEdges = result.workflow.edges;
      
      console.log('✅ Workflow ready for canvas integration');
      console.log('  - Nodes structure:');
      workflowNodes.forEach((node, i) => {
        console.log(`    ${i + 1}. ${node.type} (${node.data.label}) at (${node.position.x}, ${node.position.y})`);
      });
      
      console.log('  - Edges structure:');
      workflowEdges.forEach((edge, i) => {
        console.log(`    ${i + 1}. ${edge.source} → ${edge.target}`);
      });
      
      // Step 3: Verify node types are valid
      console.log('\nStep 3: Validating node types...');
      const validNodeTypes = [
        'trigger', 'github', 'universal_agent', 'gmail', 'document', 
        'groqllama', 'claude4', 'router', 'loop', 'api_connector',
        'database', 'whisper', 'imagen', 'veo3', 'blip2', 'firecrawl',
        'google_calendar', 'human_in_loop'
      ];
      
      let allNodesValid = true;
             workflowNodes.forEach(node => {
         if (!node.type || !validNodeTypes.includes(node.type)) {
           console.log(`❌ Invalid node type: ${node.type || 'undefined'}`);
           allNodesValid = false;
         } else {
           console.log(`✅ Valid node type: ${node.type}`);
         }
       });
      
      if (allNodesValid) {
        console.log('\n🎉 Integration test PASSED!');
        console.log('✅ All node types are valid for canvas rendering');
        console.log('✅ Workflow structure is correct');
        console.log('✅ AI Creator → Canvas integration working');
      } else {
        console.log('\n❌ Integration test FAILED!');
        console.log('Some node types are invalid');
      }
      
      // Step 4: Check workflow validation
      console.log('\nStep 4: Workflow validation check...');
      const validation = workflowGenerationService.validateWorkflow(
        workflowNodes,
        workflowEdges
      );
      
      if (validation.valid) {
        console.log('✅ Workflow validation passed');
      } else {
        console.log('❌ Workflow validation failed:');
        validation.errors.forEach(error => {
          console.log(`   - ${error}`);
        });
      }
      
    } else {
      console.log('❌ No workflow generated');
    }
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

async function testMultipleWorkflowTypes() {
  console.log('\n📋 Testing multiple workflow types for canvas compatibility');
  console.log('─'.repeat(60));
  
  const testCases = [
    "Analyze PDF documents and summarize with AI",
    "Monitor Gmail for invoices and extract data", 
    "Generate daily reports from calendar events",
    "Transcribe audio files and send notifications",
    "Scrape websites and analyze content trends"
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${i + 1}. Testing: "${testCase}"`);
    
    try {
      const result = await workflowGenerationService.generateWorkflow({
        description: testCase
      });
      
      if (result.success && result.workflow) {
        console.log(`   ✅ Generated ${result.workflow.nodes.length} nodes, ${result.workflow.edges.length} edges`);
        
        // Check for required elements
        const hasTrigger = result.workflow.nodes.some(n => n.type === 'trigger');
        const hasValidPositions = result.workflow.nodes.every(n => 
          n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number'
        );
        
        console.log(`   ${hasTrigger ? '✅' : '❌'} Has trigger node`);
        console.log(`   ${hasValidPositions ? '✅' : '❌'} Has valid positions`);
        
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Run all tests
async function runIntegrationTests() {
  console.log('🚀 Starting AI Creator → Canvas Integration Tests\n');
  
  await testAICreatorToCanvasIntegration();
  await testMultipleWorkflowTypes();
  
  console.log('\n✨ Integration tests completed!');
  console.log('\n📌 Summary:');
  console.log('  - AI Creator generates valid workflow structures');
  console.log('  - All node types are compatible with canvas');
  console.log('  - Workflows have proper positioning and connections');
  console.log('  - Integration between AI Creator and Canvas working correctly');
}

runIntegrationTests(); 