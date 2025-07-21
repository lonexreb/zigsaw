import React from 'react';
import { Node, Edge } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface WorkflowMiniCanvasProps {
  nodes: Node[];
  edges: Edge[];
  title?: string;
  className?: string;
}

export const WorkflowMiniCanvas: React.FC<WorkflowMiniCanvasProps> = ({
  nodes,
  edges,
  title = "Generated Workflow",
  className = ""
}) => {
  if (!nodes || nodes.length === 0) {
    return null;
  }

  // Sort nodes by x position for left-to-right flow
  const sortedNodes = [...nodes].sort((a, b) => a.position.x - b.position.x);

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-500" />
          {title}
          <Badge variant="secondary" className="ml-auto">
            {nodes.length} steps
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {sortedNodes.map((node, index) => (
            <React.Fragment key={node.id}>
              <div className="flex-shrink-0 min-w-[120px]">
                <div className="p-3 rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 text-center">
                                     <div className="text-xs font-medium text-primary truncate">
                     {(node.data?.label as string) || node.type || 'Node'}
                   </div>
                   <div className="text-xs text-muted-foreground mt-1 truncate">
                     {(node.data?.description as string) || 'Processing step'}
                   </div>
                </div>
              </div>
              {index < sortedNodes.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          {edges.length} connections • Ready to execute
        </div>
      </CardContent>
    </Card>
  );
}; 