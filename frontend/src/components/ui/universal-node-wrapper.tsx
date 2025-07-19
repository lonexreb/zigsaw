import React, { ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from './button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './alert-dialog';
import { apiService } from '@/services/apiService';

interface UniversalNodeWrapperProps {
  nodeId: string;
  nodeType?: string;
  onDelete?: (nodeId: string) => void;
  children: ReactNode;
  className?: string;
}

export function UniversalNodeWrapper({ 
  nodeId, 
  nodeType = 'Node', 
  onDelete, 
  children, 
  className = '' 
}: UniversalNodeWrapperProps) {
  const handleDelete = async () => {
    try {
      // Call backend API to delete the node
      await apiService.deleteNode(nodeId);
      
      // Call parent callback to remove from frontend
      if (onDelete) {
        onDelete(nodeId);
      }
    } catch (error) {
      console.error('Failed to delete node:', error);
      alert('Failed to delete node. Please try again.');
    }
  };

  // Don't show delete button if onDelete callback is not provided
  if (!onDelete) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Delete Button - Positioned absolutely in top-right corner */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="absolute -top-2 -right-2 z-50 h-6 w-6 p-0 bg-red-500/80 hover:bg-red-500 text-white border border-red-400 rounded-full shadow-lg"
            title={`Delete ${nodeType} node`}
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {nodeType}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {nodeType.toLowerCase()}? This action cannot be undone.
              All data and connections will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Original Node Content */}
      {children}
    </div>
  );
}