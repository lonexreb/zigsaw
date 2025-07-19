import { useState, useCallback } from 'react';
import { documentService, type ProcessedDocument } from '@/services/documentService';

export interface DocumentProcessorState {
  isProcessing: boolean;
  error: string | null;
  outputData: ProcessedDocument | null;
}

export function useDocumentProcessor() {
  const [state, setState] = useState<DocumentProcessorState>({
    isProcessing: false,
    error: null,
    outputData: null,
  });

  const processFile = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await documentService.processDocument(file);
      setState({
        isProcessing: false,
        error: null,
        outputData: result,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState({
        isProcessing: false,
        error: errorMessage,
        outputData: null,
      });
      throw error;
    }
  }, []);

  const clearData = useCallback(() => {
    setState({
      isProcessing: false,
      error: null,
      outputData: null,
    });
  }, []);

  return {
    ...state,
    processFile,
    clearData,
  };
} 