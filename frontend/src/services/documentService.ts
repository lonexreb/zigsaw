/**
 * Service for document processing and file uploads
 */

const API_BASE_URL = 'http://localhost:8000/api';

export interface DocumentMetadata {
  pageCount: number;
  wordCount: number;
  charCount: number;
  entities: {
    emails: string[];
    urls: string[];
  };
}

export interface ProcessedDocument {
  text: string;
  metadata: DocumentMetadata;
}

export interface DocumentResponse {
  success: boolean;
  filename: string;
  filesize: number;
  data: ProcessedDocument;
}

class DocumentService {
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} ${error}`);
    }

    return response.json();
  }

  async uploadDocument(file: File): Promise<DocumentResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.request('/documents/upload', {
        method: 'POST',
        body: formData,
      });

      return response;
    } catch (error) {
      console.error('Failed to upload document:', error);
      throw error;
    }
  }

  async processDocument(file: File): Promise<ProcessedDocument> {
    try {
      console.log('📄 Processing document:', file.name);
      const response = await this.uploadDocument(file);
      
      if (!response.success) {
        throw new Error('Failed to process document');
      }

      console.log('✅ Document processed successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error processing document:', error);
      throw error;
    }
  }
}

export const documentService = new DocumentService(); 