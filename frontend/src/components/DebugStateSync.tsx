import React, { useEffect, useState } from 'react';
import { useWorkflow } from '../contexts/WorkflowContext';

export const DebugStateSync: React.FC = () => {
  const { workflows, activeWorkflowId, getActiveWorkflow } = useWorkflow();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  useEffect(() => {
    const info = [
      `Workflows count: ${workflows.length}`,
      `Active workflow ID: ${activeWorkflowId || 'None'}`,
      `Active workflow exists: ${!!getActiveWorkflow()}`,
      `Active workflow nodes: ${getActiveWorkflow()?.nodes.length || 0}`,
      `Active workflow edges: ${getActiveWorkflow()?.edges.length || 0}`
    ];
    setDebugInfo(info);
  }, [workflows, activeWorkflowId, getActiveWorkflow]);

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 text-white p-3 rounded text-xs font-mono max-w-xs z-50">
      <div className="font-bold mb-2">Workflow Debug</div>
      {debugInfo.map((info, i) => (
        <div key={i}>{info}</div>
      ))}
    </div>
  );
}; 