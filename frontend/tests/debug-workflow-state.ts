// Debug script to test workflow state
import { workflowGenerationService } from '../src/services/workflowGenerationService';

console.log('🔍 Debug: Testing Workflow State Management\n');

async function debugWorkflowFlow() {
  console.log('📋 Step 1: Generate a workflow');
  console.log('─'.repeat(50));
  
  const result = await workflowGenerationService.generateWorkflow({
    description: "When someone creates a GitHub PR, have AI review the code and send me an email summary"
  });
  
  if (result.success && result.workflow) {
    console.log('✅ Workflow generated successfully');
    console.log('📊 Workflow details:');
    console.log(`  - ID: ${result.workflow.description}`);
    console.log(`  - Nodes: ${result.workflow.nodes.length}`);
    console.log(`  - Edges: ${result.workflow.edges.length}`);
    
    console.log('\n📋 Step 2: Inspect node structure');
    console.log('─'.repeat(50));
    
    result.workflow.nodes.forEach((node, i) => {
      console.log(`Node ${i + 1}:`);
      console.log(`  - ID: ${node.id}`);
      console.log(`  - Type: ${node.type}`);
      console.log(`  - Label: ${node.data?.label}`);
      console.log(`  - Position: (${node.position.x}, ${node.position.y})`);
      console.log(`  - Data keys: ${Object.keys(node.data || {}).join(', ')}`);
      console.log('');
    });
    
    console.log('📋 Step 3: Inspect edge structure');
    console.log('─'.repeat(50));
    
    result.workflow.edges.forEach((edge, i) => {
      console.log(`Edge ${i + 1}:`);
      console.log(`  - ID: ${edge.id}`);
      console.log(`  - From: ${edge.source} → To: ${edge.target}`);
      console.log(`  - Handles: ${edge.sourceHandle} → ${edge.targetHandle}`);
      console.log(`  - Type: ${edge.type}`);
      console.log(`  - Animated: ${edge.animated}`);
      console.log('');
    });
    
    console.log('📋 Step 4: Check what addNodes/addEdges would receive');
    console.log('─'.repeat(50));
    
    console.log('✅ These are the exact nodes that would be passed to addNodes():');
    console.log(JSON.stringify(result.workflow.nodes, null, 2));
    
    console.log('\n✅ These are the exact edges that would be passed to addEdges():');
    console.log(JSON.stringify(result.workflow.edges, null, 2));
    
    console.log('\n📋 Step 5: Simulate WorkflowContext behavior');
    console.log('─'.repeat(50));
    
    // Simulate what WorkflowContext.addNodes does
    let mockWorkflows = [];
    let mockActiveWorkflowId = null;
    
    // Simulate createWorkflow
    const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const mockWorkflow = {
      id: workflowId,
      name: 'Generated Workflow',
      description: 'Workflow created from AI',
      nodes: [],
      edges: [],
      isDeployed: false,
      isExecuting: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockWorkflows.push(mockWorkflow);
    mockActiveWorkflowId = workflowId;
    
    console.log(`✅ Created workflow: ${workflowId}`);
    
    // Simulate addNodes
    const activeWorkflow = mockWorkflows.find(w => w.id === mockActiveWorkflowId);
    if (activeWorkflow) {
      const updatedNodes = [...activeWorkflow.nodes, ...result.workflow.nodes];
      activeWorkflow.nodes = updatedNodes;
      console.log(`✅ Added ${result.workflow.nodes.length} nodes to workflow`);
      console.log(`✅ Workflow now has ${activeWorkflow.nodes.length} nodes`);
    }
    
    // Simulate addEdges
    if (activeWorkflow) {
      const updatedEdges = [...activeWorkflow.edges, ...result.workflow.edges];
      activeWorkflow.edges = updatedEdges;
      console.log(`✅ Added ${result.workflow.edges.length} edges to workflow`);
      console.log(`✅ Workflow now has ${activeWorkflow.edges.length} edges`);
    }
    
    console.log('\n📋 Step 6: Final workflow state');
    console.log('─'.repeat(50));
    console.log(`✅ Active workflow ID: ${mockActiveWorkflowId}`);
    console.log(`✅ Total workflows: ${mockWorkflows.length}`);
    console.log(`✅ Active workflow nodes: ${activeWorkflow?.nodes.length}`);
    console.log(`✅ Active workflow edges: ${activeWorkflow?.edges.length}`);
    
    if (activeWorkflow && activeWorkflow.nodes.length > 0) {
      console.log('\n🎉 SUCCESS: Workflow state simulation shows nodes should appear!');
      console.log('   This means the issue is in the Index.tsx synchronization.');
    } else {
      console.log('\n❌ PROBLEM: Workflow state simulation failed');
    }
    
  } else {
    console.log('❌ Workflow generation failed:', result.error);
  }
}

debugWorkflowFlow().catch(console.error); 