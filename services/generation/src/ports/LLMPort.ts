/**
 * LLM Port - Interface for LLM providers
 * 
 * This abstracts away the specific LLM implementation (OpenAI, Anthropic, etc.)
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  tokensUsed: number;
  finishReason: string;
}

export interface LLMPort {
  /**
   * Generate a completion from messages
   */
  complete(messages: LLMMessage[], options?: LLMCompletionOptions): Promise<LLMResponse>;
  
  /**
   * Generate a structured JSON response
   */
  completeJSON<T>(messages: LLMMessage[], schema: any, options?: LLMCompletionOptions): Promise<T>;
}

export interface LLMCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

