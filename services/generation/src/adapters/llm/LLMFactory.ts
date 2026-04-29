/**
 * LLM Factory
 * 
 * Creates the appropriate LLM adapter based on configuration
 */

import type { LLMPort } from '../../application/ports/LLMPort';
import { OpenAIAdapter } from './OpenAIAdapter';
import { AnthropicAdapter } from './AnthropicAdapter';

export type LLMProvider = 'openai' | 'anthropic';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  model?: string;
}

export class LLMFactory {
  static create(config?: LLMConfig): LLMPort {
    const provider = config?.provider || (process.env.LLM_PROVIDER as LLMProvider) || 'openai';
    
    switch (provider) {
      case 'openai':
        return new OpenAIAdapter(
          config?.apiKey || process.env.OPENAI_API_KEY,
          config?.model || process.env.OPENAI_MODEL
        );
      
      case 'anthropic':
        return new AnthropicAdapter(
          config?.apiKey || process.env.ANTHROPIC_API_KEY,
          config?.model || process.env.ANTHROPIC_MODEL
        );
      
      default:
        throw new Error(`Unknown LLM provider: ${provider}`);
    }
  }
  
  /**
   * Create multiple LLM adapters for comparison/fallback
   */
  static createMultiple(providers: LLMProvider[]): LLMPort[] {
    return providers.map(provider => this.create({ provider }));
  }
}

