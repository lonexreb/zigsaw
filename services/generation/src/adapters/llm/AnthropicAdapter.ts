/**
 * Anthropic Claude Adapter
 * 
 * Implements LLMPort using Anthropic's Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import type { LLMPort, LLMMessage, LLMResponse, LLMCompletionOptions } from '../../application/ports/LLMPort';

export class AnthropicAdapter implements LLMPort {
  private client: Anthropic;
  private defaultModel: string;
  
  constructor(apiKey?: string, defaultModel = 'claude-3-5-sonnet-20241022') {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
    this.defaultModel = defaultModel;
  }
  
  async complete(messages: LLMMessage[], options?: LLMCompletionOptions): Promise<LLMResponse> {
    // Convert messages to Anthropic format (system message separate)
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
    
    const response = await this.client.messages.create({
      model: options?.model || this.defaultModel,
      system: systemMessage,
      messages: conversationMessages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
    });
    
    const content = response.content[0];
    const textContent = content.type === 'text' ? content.text : '';
    
    return {
      content: textContent,
      model: response.model,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      finishReason: response.stop_reason || 'end_turn',
    };
  }
  
  async completeJSON<T>(
    messages: LLMMessage[],
    schema: any,
    options?: LLMCompletionOptions
  ): Promise<T> {
    // Anthropic doesn't have native JSON mode, so we prompt for JSON
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const enhancedSystem = `${systemMessage}\n\nYou must respond with valid JSON only. No additional text, explanations, or formatting. Just the raw JSON object.`;
    
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map((m, idx) => {
        // For the last user message, add JSON instruction
        if (m.role === 'user' && idx === messages.filter(msg => msg.role !== 'system').length - 1) {
          return {
            role: m.role as 'user' | 'assistant',
            content: `${m.content}\n\nRespond with a JSON object matching this structure:\n${JSON.stringify(schema, null, 2)}`,
          };
        }
        return {
          role: m.role as 'user' | 'assistant',
          content: m.content,
        };
      });
    
    const response = await this.client.messages.create({
      model: options?.model || this.defaultModel,
      system: enhancedSystem,
      messages: conversationMessages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
    });
    
    const content = response.content[0];
    const textContent = content.type === 'text' ? content.text : '{}';
    
    // Extract JSON if wrapped in markdown code blocks
    const jsonMatch = textContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : textContent;
    
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('Failed to parse Anthropic JSON response:', textContent);
      throw new Error(`Invalid JSON response from Claude: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

