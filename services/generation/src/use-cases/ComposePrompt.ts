/**
 * ComposePrompt Use Case
 * 
 * Generates video prompts from CreativeSpec using LLM.
 * This is the core logic that translates marketing specs into video generation instructions.
 */

import type { CreativeSpec, VideoPrompt, HookTemplate } from '@zigsaw/schemas';
import type { LLMPort } from '../ports/LLMPort';

export class ComposePrompt {
  constructor(private readonly llmClient: LLMPort) {}
  
  async execute(spec: CreativeSpec, hookTemplate: HookTemplate): Promise<VideoPrompt> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(spec, hookTemplate);
    
    // Use structured output for reliable parsing
    const response = await this.llmClient.completeJSON<VideoPrompt>(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      this.getVideoPromptJSONSchema(),
      {
        temperature: 0.7,
        maxTokens: 2000,
      }
    );
    
    return this.validateAndEnhancePrompt(response, spec);
  }
  
  private buildSystemPrompt(): string {
    return `You are an expert marketing video prompt generator specializing in short-form social media content.

Your job is to create compelling, highly specific video prompts that will be used to generate marketing videos.

Key principles:
- Hook viewers in the first 2 seconds
- Match the brand's tone and aesthetic
- Include specific visual elements that showcase the product
- Create fast-paced, engaging content
- Ensure captions are punchy and easy to read
- Include a clear call-to-action

Output format: Structured JSON with scenes, captions, audio, and timing.`;
  }
  
  private buildUserPrompt(spec: CreativeSpec, hookTemplate: HookTemplate): string {
    const {brand, product, audience, campaign, creative, platforms} = spec;
    
    return `Generate a ${creative.lengthS}-second marketing video for ${platforms[0]}.

BRAND:
- Name: ${brand.name}
- Colors: ${brand.colors.join(', ')}
- Logo: ${brand.logoUrl}

PRODUCT:
- Key points: ${product.keyPoints.join(', ')}
- Price: $${product.price}
- Images: ${product.images.length} product images available

AUDIENCE:
- Persona: ${audience.persona}
- Locale: ${audience.locale}

CAMPAIGN:
- Goal: ${campaign.goal}
- KPIs: ${campaign.kpi.join(', ')}

CREATIVE DIRECTION:
- Hook style: ${hookTemplate.name} (${hookTemplate.description})
- Hook template: "${hookTemplate.template}"
- Opening duration: ${creative.openingSeconds}s (critical - grab attention fast!)
- Pacing: ${creative.cutsPer15s} cuts per 15 seconds
- Aspect ratio: ${creative.aspect}
- Caption style: ${creative.captionStyle}
- Music mood: ${creative.musicMood}
- Voiceover: ${creative.voiceover ? 'Yes' : 'No'}
- CTA: "${creative.cta}"

Create a compelling video prompt with:
1. A strong opening hook following the "${hookTemplate.name}" pattern
2. ${Math.ceil(creative.lengthS / 5)} distinct scenes showing the product
3. Dynamic captions that appear at key moments
4. A clear call-to-action at the end

Be SPECIFIC about visuals: describe products, environments, camera angles, and movements.`;
  }
  
  private getVideoPromptJSONSchema(): any {
    return {
      type: 'object',
      properties: {
        visualDescription: { type: 'string' },
        scenes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timingSeconds: { type: 'number' },
              description: { type: 'string' },
              visualElements: { type: 'array', items: { type: 'string' } },
              cameraMovement: { type: 'string' },
            },
            required: ['timingSeconds', 'description', 'visualElements'],
          },
        },
        captions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              timingSeconds: { type: 'number' },
              style: { type: 'string' },
              position: { type: 'string', enum: ['top', 'center', 'bottom'] },
            },
            required: ['text', 'timingSeconds', 'style'],
          },
        },
        audio: {
          type: 'object',
          properties: {
            musicMood: { type: 'string' },
            voiceoverScript: { type: 'string' },
            soundEffects: { type: 'array', items: { type: 'string' } },
          },
          required: ['musicMood'],
        },
        cta: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            timingSeconds: { type: 'number' },
          },
          required: ['text', 'timingSeconds'],
        },
      },
      required: ['visualDescription', 'scenes', 'captions', 'audio', 'cta'],
    };
  }
  
  private validateAndEnhancePrompt(prompt: VideoPrompt, spec: CreativeSpec): VideoPrompt {
    // Add metadata
    return {
      ...prompt,
      hookStyle: spec.creative.hookStyle,
      targetDuration: spec.creative.lengthS,
    };
  }
}

