import { Brick3D, BrickNodeSync, WorkspaceState } from '../types/brick-types';
import { findAdjacentBrickPairs, areAdjacentIn3D } from '../lib/brick-utils';

export interface BrickConnectionAnalysis {
  brickId: string;
  connectedBricks: string[];
  connectionTypes: ('spatial' | 'functional' | 'data-flow')[];
  optimalPosition: { x: number; y: number; z: number };
  suggestedConnections: Array<{
    targetBrickId: string;
    connectionType: string;
    strength: number;
    reasoning: string;
  }>;
}

export interface WorkflowOptimization {
  suggestedNodeOrder: string[];
  dataFlowPath: string[];
  optimizationScore: number;
  reasoning: string;
  potentialIssues: string[];
  recommendations: string[];
}

export interface GroqAnalysisRequest {
  workspaceState: WorkspaceState;
  analysisType: 'connection-analysis' | 'workflow-optimization' | 'full-analysis';
  includeReasoning?: boolean;
  optimizationGoals?: ('performance' | 'clarity' | 'efficiency' | 'scalability')[];
}

export interface GroqAnalysisResponse {
  success: boolean;
  analysis?: BrickConnectionAnalysis[];
  optimization?: WorkflowOptimization;
  reasoning?: string;
  error?: string;
  processingTime?: number;
}

class GroqBrickAnalysisService {
  private groqApiKey: string | null = null;
  private baseUrl: string = 'http://localhost:8000/api/ai/groq';

  constructor() {
    // Try to get groq API key from context or local storage
    this.initializeApiKey();
  }

  private initializeApiKey(): void {
    // Try to get from localStorage first
    const storedKey = localStorage.getItem('groqllama_api_key');
    if (storedKey) {
      this.groqApiKey = storedKey;
      return;
    }

    // Try to get from context
    const apiKeysContext = localStorage.getItem('apiKeys');
    if (apiKeysContext) {
      try {
        const keys = JSON.parse(apiKeysContext);
        this.groqApiKey = keys.groqllama || null;
      } catch (e) {
        console.warn('Failed to parse API keys from context');
      }
    }
  }

  /**
   * Analyze brick connections using Groq's fast inference
   */
  async analyzeBrickConnections(workspaceState: WorkspaceState): Promise<GroqAnalysisResponse> {
    const startTime = Date.now();
    
    try {
      // Prepare the analysis prompt
      const analysisPrompt = this.buildConnectionAnalysisPrompt(workspaceState);
      
      // Use Groq for fast analysis
      const response = await this.callGroqAPI(analysisPrompt, {
        model: 'llama3-70b-8192',
        temperature: 0.1, // Low temperature for consistent analysis
        max_tokens: 2000
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to analyze brick connections'
        };
      }

      // Parse the analysis response
      const analysis = this.parseConnectionAnalysis(response.content, workspaceState);
      
      return {
        success: true,
        analysis,
        reasoning: response.content,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Error analyzing brick connections:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during analysis'
      };
    }
  }

  /**
   * Optimize workflow using Groq's analysis
   */
  async optimizeWorkflow(workspaceState: WorkspaceState, goals: string[] = ['performance', 'clarity']): Promise<GroqAnalysisResponse> {
    const startTime = Date.now();
    
    try {
      // Prepare the optimization prompt
      const optimizationPrompt = this.buildWorkflowOptimizationPrompt(workspaceState, goals);
      
      // Use Groq for fast optimization
      const response = await this.callGroqAPI(optimizationPrompt, {
        model: 'llama3-70b-8192',
        temperature: 0.2, // Slightly higher for creative optimization
        max_tokens: 3000
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to optimize workflow'
        };
      }

      // Parse the optimization response
      const optimization = this.parseWorkflowOptimization(response.content, workspaceState);
      
      return {
        success: true,
        optimization,
        reasoning: response.content,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Error optimizing workflow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during optimization'
      };
    }
  }

  /**
   * Full analysis combining connection analysis and workflow optimization
   */
  async performFullAnalysis(request: GroqAnalysisRequest): Promise<GroqAnalysisResponse> {
    const startTime = Date.now();
    
    try {
      // Perform connection analysis first
      const connectionAnalysis = await this.analyzeBrickConnections(request.workspaceState);
      if (!connectionAnalysis.success) {
        return connectionAnalysis;
      }

      // Perform workflow optimization
      const optimization = await this.optimizeWorkflow(
        request.workspaceState, 
        request.optimizationGoals || ['performance', 'clarity']
      );
      if (!optimization.success) {
        return optimization;
      }

      return {
        success: true,
        analysis: connectionAnalysis.analysis,
        optimization: optimization.optimization,
        reasoning: `Connection Analysis: ${connectionAnalysis.reasoning}\n\nWorkflow Optimization: ${optimization.reasoning}`,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Error performing full analysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during full analysis'
      };
    }
  }

  /**
   * Build prompt for connection analysis
   */
  private buildConnectionAnalysisPrompt(workspaceState: WorkspaceState): string {
    const bricks = workspaceState.bricks;
    const nodeConnections = workspaceState.nodeConnections;

    const prompt = `Analyze the following brick workspace and provide detailed connection analysis:

WORKSPACE STATE:
- Total Bricks: ${bricks.length}
- Node Connections: ${nodeConnections.length}
- Timestamp: ${new Date(workspaceState.timestamp).toISOString()}

BRICKS:
${bricks.map((brick, index) => `
${index + 1}. ${brick.brickType.name} (ID: ${brick.customId})
   - Position: (${brick.position.x.toFixed(2)}, ${brick.position.y.toFixed(2)}, ${brick.position.z.toFixed(2)})
   - Dimensions: ${brick.brickType.dimensions.x}×${brick.brickType.dimensions.z}
   - Function Type: ${brick.brickType.functionType}
   - Capabilities: ${brick.brickType.capabilities.join(', ')}
   - Node Equivalent: ${brick.brickType.nodeEquivalent || 'None'}
`).join('')}

NODE CONNECTIONS:
${nodeConnections.map(conn => `
- Brick ${conn.brickId} → Node ${conn.nodeId}
  - Position: (${conn.position.x.toFixed(2)}, ${conn.position.y.toFixed(2)}, ${conn.position.z.toFixed(2)})
  - Last Updated: ${new Date(conn.lastUpdated).toISOString()}
`).join('')}

ANALYSIS TASK:
1. Identify all spatial connections between bricks (adjacent positioning)
2. Analyze functional relationships based on brick types and capabilities
3. Suggest optimal data flow paths
4. Identify potential bottlenecks or inefficiencies
5. Recommend connection improvements

Please provide your analysis in JSON format with the following structure:
{
  "analysis": [
    {
      "brickId": "string",
      "connectedBricks": ["string"],
      "connectionTypes": ["spatial", "functional", "data-flow"],
      "optimalPosition": {"x": number, "y": number, "z": number},
      "suggestedConnections": [
        {
          "targetBrickId": "string",
          "connectionType": "string",
          "strength": number,
          "reasoning": "string"
        }
      ]
    }
  ],
  "reasoning": "string"
}`;

    return prompt;
  }

  /**
   * Build prompt for workflow optimization
   */
  private buildWorkflowOptimizationPrompt(workspaceState: WorkspaceState, goals: string[]): string {
    const bricks = workspaceState.bricks;
    const nodeConnections = workspaceState.nodeConnections;

    const prompt = `Optimize the following AI workflow based on the brick workspace:

WORKSPACE STATE:
- Total Bricks: ${bricks.length}
- Node Connections: ${nodeConnections.length}
- Optimization Goals: ${goals.join(', ')}

BRICKS BY FUNCTION TYPE:
${this.groupBricksByFunction(bricks)}

CURRENT CONNECTIONS:
${nodeConnections.map(conn => `- ${conn.brickId} → ${conn.nodeId}`).join('\n')}

OPTIMIZATION TASK:
1. Analyze the current workflow structure
2. Suggest optimal node execution order
3. Identify data flow bottlenecks
4. Recommend performance improvements
5. Suggest scalability enhancements
6. Identify potential issues or conflicts

Please provide your optimization in JSON format with the following structure:
{
  "suggestedNodeOrder": ["string"],
  "dataFlowPath": ["string"],
  "optimizationScore": number,
  "reasoning": "string",
  "potentialIssues": ["string"],
  "recommendations": ["string"]
}`;

    return prompt;
  }

  /**
   * Group bricks by function type for analysis
   */
  private groupBricksByFunction(bricks: Brick3D[]): string {
    const grouped = bricks.reduce((acc, brick) => {
      const funcType = brick.brickType.functionType;
      if (!acc[funcType]) {
        acc[funcType] = [];
      }
      acc[funcType].push(brick);
      return acc;
    }, {} as Record<string, Brick3D[]>);

    return Object.entries(grouped).map(([funcType, funcBricks]) => `
${funcType.toUpperCase()} (${funcBricks.length} bricks):
${funcBricks.map(brick => `  - ${brick.brickType.name} (${brick.customId})`).join('\n')}
`).join('');
  }

  /**
   * Call Groq API for analysis
   */
  private async callGroqAPI(prompt: string, options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  } = {}): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      if (!this.groqApiKey) {
        return {
          success: false,
          error: 'Groq API key not available. Please configure your API key in the API Keys tab.'
        };
      }

      const response = await fetch(`${this.baseUrl}/completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an expert AI workflow analyst specializing in brick-based visual programming. Provide detailed, actionable analysis and optimization recommendations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: options.model || 'llama3-70b-8192',
          temperature: options.temperature || 0.1,
          max_tokens: options.max_tokens || 2000,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Groq API error: ${response.status} - ${errorText}`
        };
      }

      const data = await response.json();
      
      // Extract content from response
      let content = '';
      if (data.choices && data.choices[0] && data.choices[0].message) {
        content = data.choices[0].message.content;
      } else if (data.content) {
        content = data.content;
      } else {
        return {
          success: false,
          error: 'Invalid response format from Groq API'
        };
      }

      return {
        success: true,
        content
      };

    } catch (error) {
      console.error('Error calling Groq API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error calling Groq API'
      };
    }
  }

  /**
   * Parse connection analysis from Groq response
   */
  private parseConnectionAnalysis(content: string, workspaceState: WorkspaceState): BrickConnectionAnalysis[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.analysis || !Array.isArray(parsed.analysis)) {
        throw new Error('Invalid analysis format');
      }

      return parsed.analysis.map((item: {
        brickId: string;
        connectedBricks?: string[];
        connectionTypes?: string[];
        optimalPosition?: { x: number; y: number; z: number };
        suggestedConnections?: Array<{
          targetBrickId: string;
          connectionType: string;
          strength: number;
          reasoning: string;
        }>;
      }) => ({
        brickId: item.brickId,
        connectedBricks: item.connectedBricks || [],
        connectionTypes: item.connectionTypes || [],
        optimalPosition: item.optimalPosition || { x: 0, y: 0, z: 0 },
        suggestedConnections: item.suggestedConnections || []
      }));

    } catch (error) {
      console.error('Error parsing connection analysis:', error);
      // Fallback: create basic analysis from spatial connections
      return this.createFallbackAnalysis(workspaceState);
    }
  }

  /**
   * Parse workflow optimization from Groq response
   */
  private parseWorkflowOptimization(content: string, workspaceState: WorkspaceState): WorkflowOptimization {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        suggestedNodeOrder: parsed.suggestedNodeOrder || [],
        dataFlowPath: parsed.dataFlowPath || [],
        optimizationScore: parsed.optimizationScore || 0,
        reasoning: parsed.reasoning || 'No reasoning provided',
        potentialIssues: parsed.potentialIssues || [],
        recommendations: parsed.recommendations || []
      };

    } catch (error) {
      console.error('Error parsing workflow optimization:', error);
      // Fallback: create basic optimization
      return this.createFallbackOptimization(workspaceState);
    }
  }

  /**
   * Create fallback analysis when Groq parsing fails
   */
  private createFallbackAnalysis(workspaceState: WorkspaceState): BrickConnectionAnalysis[] {
    const adjacentPairs = findAdjacentBrickPairs(workspaceState.bricks);
    
    return workspaceState.bricks.map(brick => {
      const connectedBricks = adjacentPairs
        .filter(pair => pair.brick1.customId === brick.customId || pair.brick2.customId === brick.customId)
        .map(pair => pair.brick1.customId === brick.customId ? pair.brick2.customId : pair.brick1.customId);

      return {
        brickId: brick.customId,
        connectedBricks,
        connectionTypes: connectedBricks.length > 0 ? ['spatial'] : [],
        optimalPosition: brick.position,
        suggestedConnections: connectedBricks.map(targetId => ({
          targetBrickId: targetId,
          connectionType: 'spatial',
          strength: 0.8,
          reasoning: 'Spatially adjacent bricks'
        }))
      };
    });
  }

  /**
   * Create fallback optimization when Groq parsing fails
   */
  private createFallbackOptimization(workspaceState: WorkspaceState): WorkflowOptimization {
    const nodeOrder = workspaceState.nodeConnections.map(conn => conn.nodeId);
    
    return {
      suggestedNodeOrder: nodeOrder,
      dataFlowPath: nodeOrder,
      optimizationScore: 0.5,
      reasoning: 'Fallback optimization based on current node connections',
      potentialIssues: ['Limited optimization data available'],
      recommendations: ['Consider adding more bricks for better workflow analysis']
    };
  }

  /**
   * Update API key
   */
  updateApiKey(apiKey: string): void {
    this.groqApiKey = apiKey;
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.groqApiKey !== null;
  }
}

// Export singleton instance
export const groqBrickAnalysisService = new GroqBrickAnalysisService(); 