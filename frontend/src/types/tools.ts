/**
 * Type definitions for tool marketplace and integrations
 */

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'json' | 'file' | 'url' | 'email' | 'password';
  description: string;
  required: boolean;
  default?: any;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    format?: string;
  };
  placeholder?: string;
  help?: string;
  sensitive?: boolean; // For password/api key fields
}

export interface ToolExample {
  title: string;
  description: string;
  parameters: Record<string, any>;
  expectedOutput?: any;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  version: string;
  author: string;
  parameters: ToolParameter[];
  required: boolean;
  enabled: boolean;
  tags: string[];
  rating: number;
  downloads: number;
  cost: number; // Cost per execution
  provider: string;
  supportedModels: string[];
  documentation: string;
  examples: ToolExample[];
  config?: Record<string, any>;
  lastUpdated?: Date;
  license?: string;
  repository?: string;
  dependencies?: string[];
  platform?: string[];
  status?: 'active' | 'deprecated' | 'beta' | 'experimental';
  changelog?: string;
}

export interface ToolCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
  count: number;
  featured?: boolean;
}

export interface ToolPreset {
  id: string;
  name: string;
  description: string;
  tools: string[];
  author?: string;
  public?: boolean;
  featured?: boolean;
  tags?: string[];
  rating?: number;
  downloads?: number;
  lastUpdated?: Date;
}

export interface ToolExecution {
  id: string;
  toolId: string;
  parameters: Record<string, any>;
  result: any;
  success: boolean;
  error?: string;
  executionTime: number;
  cost: number;
  timestamp: Date;
  userId?: string;
  nodeId?: string;
  workflowId?: string;
  metadata?: Record<string, any>;
}

export interface ToolValidation {
  valid: boolean;
  errors: {
    field: string;
    message: string;
    code: string;
  }[];
  warnings?: {
    field: string;
    message: string;
    code: string;
  }[];
}

export interface ToolManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  repository?: string;
  homepage?: string;
  bugs?: string;
  keywords: string[];
  category: string;
  icon: string;
  parameters: ToolParameter[];
  requirements: {
    system?: string[];
    packages?: string[];
    environment?: Record<string, string>;
  };
  permissions: string[];
  pricing: {
    model: 'free' | 'usage' | 'subscription';
    cost?: number;
    currency?: string;
  };
  compatibility: {
    platforms: string[];
    models: string[];
    versions: string[];
  };
  config?: {
    schema: Record<string, any>;
    defaults: Record<string, any>;
  };
}

export interface ToolInstallation {
  id: string;
  toolId: string;
  status: 'installing' | 'installed' | 'failed' | 'updating' | 'uninstalling';
  version: string;
  installedAt: Date;
  config: Record<string, any>;
  enabled: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ToolUsageStats {
  toolId: string;
  executions: number;
  successRate: number;
  averageExecutionTime: number;
  totalCost: number;
  lastUsed: Date;
  popularParameters: Record<string, any>;
  errors: {
    code: string;
    count: number;
    lastOccurrence: Date;
  }[];
}

export interface ToolProvider {
  id: string;
  name: string;
  description: string;
  website: string;
  supportEmail: string;
  tools: string[];
  verified: boolean;
  rating: number;
  lastUpdated: Date;
}

export interface ToolSearchResult {
  tools: Tool[];
  total: number;
  page: number;
  pageSize: number;
  filters: {
    category?: string;
    provider?: string;
    tags?: string[];
    priceRange?: [number, number];
    rating?: number;
    featured?: boolean;
    installed?: boolean;
  };
  suggestions?: string[];
  facets?: {
    categories: { id: string; name: string; count: number }[];
    providers: { id: string; name: string; count: number }[];
    tags: { tag: string; count: number }[];
  };
}

export interface ToolConfigSchema {
  type: 'object';
  properties: Record<string, {
    type: string;
    description: string;
    required?: boolean;
    default?: any;
    enum?: any[];
    format?: string;
    pattern?: string;
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
  }>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface ToolExecutionContext {
  nodeId?: string;
  workflowId?: string;
  userId?: string;
  sessionId?: string;
  environment?: 'development' | 'staging' | 'production';
  timeout?: number;
  retryCount?: number;
  metadata?: Record<string, any>;
  secrets?: Record<string, string>;
}

export interface ToolExecutionPlan {
  toolId: string;
  parameters: Record<string, any>;
  context: ToolExecutionContext;
  dependencies?: string[];
  estimatedCost?: number;
  estimatedTime?: number;
  validation?: ToolValidation;
}

export interface ToolBatch {
  id: string;
  tools: ToolExecutionPlan[];
  parallel?: boolean;
  failFast?: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  results?: ToolExecution[];
  startTime?: Date;
  endTime?: Date;
  totalCost?: number;
  metadata?: Record<string, any>;
}

export interface ToolWebhook {
  id: string;
  toolId: string;
  event: 'execution.started' | 'execution.completed' | 'execution.failed' | 'config.updated';
  url: string;
  secret?: string;
  enabled: boolean;
  lastTriggered?: Date;
  failureCount?: number;
}

export interface ToolAlert {
  id: string;
  toolId: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  threshold?: number;
  condition: string;
  enabled: boolean;
  lastTriggered?: Date;
  recipients: string[];
}

export interface ToolBackup {
  id: string;
  toolId: string;
  config: Record<string, any>;
  version: string;
  createdAt: Date;
  createdBy: string;
  description?: string;
  automatic?: boolean;
}

export interface ToolAuditLog {
  id: string;
  toolId: string;
  action: 'install' | 'uninstall' | 'configure' | 'execute' | 'update' | 'enable' | 'disable';
  userId: string;
  timestamp: Date;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ToolMetrics {
  toolId: string;
  period: 'hour' | 'day' | 'week' | 'month';
  metrics: {
    executions: number;
    successRate: number;
    averageExecutionTime: number;
    errorRate: number;
    cost: number;
    popularParameters: Record<string, number>;
    userCount: number;
    peakUsage: Date;
  };
  timestamp: Date;
}

export interface ToolDependency {
  toolId: string;
  dependsOn: string[];
  dependents: string[];
  version: string;
  optional: boolean;
  description?: string;
}

export interface ToolUpdate {
  toolId: string;
  currentVersion: string;
  availableVersion: string;
  changelog: string;
  breaking: boolean;
  security: boolean;
  recommended: boolean;
  releaseDate: Date;
  downloadUrl: string;
  checksum: string;
}

export interface ToolBundle {
  id: string;
  name: string;
  description: string;
  tools: string[];
  version: string;
  author: string;
  price: number;
  currency: string;
  license: string;
  featured: boolean;
  tags: string[];
  rating: number;
  downloads: number;
  lastUpdated: Date;
}

export interface ToolReview {
  id: string;
  toolId: string;
  userId: string;
  rating: number;
  title: string;
  content: string;
  helpful: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  response?: {
    content: string;
    author: string;
    createdAt: Date;
  };
}

export interface ToolNotification {
  id: string;
  toolId: string;
  type: 'update' | 'deprecation' | 'security' | 'maintenance' | 'promotion';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
  actionText?: string;
}

export interface ToolLicense {
  id: string;
  name: string;
  url: string;
  commercial: boolean;
  modification: boolean;
  distribution: boolean;
  privateUse: boolean;
  patent: boolean;
  trademark: boolean;
  liability: boolean;
  warranty: boolean;
}

export interface ToolSecurity {
  toolId: string;
  lastScanned: Date;
  vulnerabilities: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    cve?: string;
    fixed: boolean;
    patchVersion?: string;
  }[];
  permissions: string[];
  dataAccess: string[];
  networkAccess: boolean;
  fileSystemAccess: boolean;
  score: number; // 0-100
  certificate?: string;
}

export interface ToolPerformance {
  toolId: string;
  benchmarks: {
    metric: string;
    value: number;
    unit: string;
    timestamp: Date;
  }[];
  resourceUsage: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
  scalability: {
    maxConcurrentExecutions: number;
    maxRequestsPerSecond: number;
    maxDataSize: number;
  };
  reliability: {
    uptime: number;
    errorRate: number;
    meanTimeToFailure: number;
    meanTimeToRecovery: number;
  };
}

export interface ToolMarketplace {
  featured: Tool[];
  categories: ToolCategory[];
  trending: Tool[];
  new: Tool[];
  popular: Tool[];
  recommended: Tool[];
  stats: {
    totalTools: number;
    totalDownloads: number;
    totalProviders: number;
    averageRating: number;
  };
  promotions: {
    id: string;
    title: string;
    description: string;
    toolIds: string[];
    discount: number;
    validUntil: Date;
    code?: string;
  }[];
}

export interface ToolWorkflow {
  id: string;
  name: string;
  description: string;
  tools: {
    toolId: string;
    stepNumber: number;
    parameters: Record<string, any>;
    condition?: string;
    onSuccess?: string;
    onError?: string;
  }[];
  triggers: {
    type: 'schedule' | 'webhook' | 'manual' | 'event';
    config: Record<string, any>;
  }[];
  variables: Record<string, any>;
  enabled: boolean;
  created: Date;
  lastRun?: Date;
  runs: number;
  successRate: number;
}

export interface ToolIntegration {
  id: string;
  name: string;
  description: string;
  toolId: string;
  platform: string;
  version: string;
  config: Record<string, any>;
  enabled: boolean;
  lastSync: Date;
  syncStatus: 'success' | 'failed' | 'partial';
  error?: string;
  metadata?: Record<string, any>;
}

export interface ToolTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  toolId: string;
  parameters: Record<string, any>;
  tags: string[];
  public: boolean;
  featured: boolean;
  author: string;
  rating: number;
  downloads: number;
  lastUpdated: Date;
  examples: ToolExample[];
} 