/**
 * Generation Service — public API.
 *
 * LLM + Video generation behind hexagonal ports. Adapters swap freely.
 * Ported from lonexreb/zigsaw-labs/services/generation.
 */

// Ports
export type { LLMPort, LLMMessage, LLMResponse, LLMCompletionOptions } from './ports/LLMPort';
export type { VideoPort, VideoGenerationOptions, VideoGenerationResult } from './ports/VideoPort';

// LLM adapters
export { AnthropicAdapter } from './adapters/llm/AnthropicAdapter';
export { LLMFactory, type LLMProvider, type LLMConfig } from './adapters/llm/LLMFactory';

// Video adapters
export { Veo3Adapter } from './adapters/video/Veo3Adapter';

// Use cases
export { ComposePrompt } from './use-cases/ComposePrompt';
