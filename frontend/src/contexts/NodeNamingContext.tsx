import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NodeNaming {
  customName: string;
  showCustomName: boolean;
}

interface NodeNamingContextType {
  nodeNames: Record<string, NodeNaming>;
  
  // Node naming operations
  setNodeCustomName: (nodeId: string, customName: string) => void;
  getNodeCustomName: (nodeId: string) => string;
  toggleNodeNameDisplay: (nodeId: string) => void;
  isShowingCustomName: (nodeId: string) => boolean;
  hasCustomName: (nodeId: string) => boolean;
  clearNodeCustomName: (nodeId: string) => void;
}

const NodeNamingContext = createContext<NodeNamingContextType | undefined>(undefined);

export const useNodeNaming = () => {
  const context = useContext(NodeNamingContext);
  if (context === undefined) {
    throw new Error('useNodeNaming must be used within a NodeNamingProvider');
  }
  return context;
};

interface NodeNamingProviderProps {
  children: ReactNode;
}

export function NodeNamingProvider({ children }: NodeNamingProviderProps) {
  const [nodeNames, setNodeNames] = useState<Record<string, NodeNaming>>({});

  const setNodeCustomName = useCallback((nodeId: string, customName: string) => {
    setNodeNames(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        customName: customName.trim(),
        showCustomName: customName.trim() !== '' ? true : (prev[nodeId]?.showCustomName || false)
      }
    }));
  }, []);

  const getNodeCustomName = useCallback((nodeId: string) => {
    return nodeNames[nodeId]?.customName || '';
  }, [nodeNames]);

  const toggleNodeNameDisplay = useCallback((nodeId: string) => {
    setNodeNames(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        customName: prev[nodeId]?.customName || '',
        showCustomName: !(prev[nodeId]?.showCustomName || false)
      }
    }));
  }, []);

  const isShowingCustomName = useCallback((nodeId: string) => {
    return nodeNames[nodeId]?.showCustomName || false;
  }, [nodeNames]);

  const hasCustomName = useCallback((nodeId: string) => {
    return (nodeNames[nodeId]?.customName || '').trim() !== '';
  }, [nodeNames]);

  const clearNodeCustomName = useCallback((nodeId: string) => {
    setNodeNames(prev => {
      const newNames = { ...prev };
      delete newNames[nodeId];
      return newNames;
    });
  }, []);

  const value: NodeNamingContextType = {
    nodeNames,
    setNodeCustomName,
    getNodeCustomName,
    toggleNodeNameDisplay,
    isShowingCustomName,
    hasCustomName,
    clearNodeCustomName,
  };

  return (
    <NodeNamingContext.Provider value={value}>
      {children}
    </NodeNamingContext.Provider>
  );
} 