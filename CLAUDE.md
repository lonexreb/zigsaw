# ZIGSAW - AI-Powered Workflow Automation Platform
## Claude Development Manual & Project Guide

⸻

## 1. Project Overview

**Zigsaw** is a next-generation visual workflow automation platform that democratizes AI-powered automation. Think of it as "Zapier meets GitHub Actions meets AI" - where users can visually connect AI models, APIs, and services to create powerful automated workflows without writing code.

### Core Value Proposition
- **Natural Language Workflow Creation**: Chat interface that converts plain English into executable workflows
- **Visual Workflow Builder**: Drag-and-drop interface using ReactFlow for intuitive workflow design
- **Multi-Modal AI Integration**: Native support for Claude, GPT, Gemini, Groq, and specialized models
- **Real-time Execution**: Live workflow monitoring with streaming results and progress tracking
- **Enterprise-Ready**: Secure, scalable, multi-tenant platform with role-based access control

### Key Differentiators from Competitors
| Feature | Zigsaw | n8n | Zapier | Flowise | AgentOps |
|---------|--------|-----|--------|---------|----------|
| Natural Language Creation | ✅ Chat-to-Workflow | ❌ | ❌ | ❌ | ❌ |
| AI-First Design | ✅ Multi-Modal | ❌ | ❌ | ✅ Basic | ✅ Basic |
| Real-time Streaming | ✅ Live Results | ❌ | ❌ | ✅ | ❌ |
| Visual Flow Editor | ✅ ReactFlow | ✅ Basic | ❌ | ✅ Basic | ✅ |
| Code Generation | ✅ Auto-Deploy APIs | ❌ | ❌ | ❌ | ❌ |
| Multi-tenant SaaS | ✅ Enterprise | ✅ Self-hosted | ✅ SaaS | ❌ OSS | ✅ SaaS |

⸻

## 2. Architecture & Tech Stack

### Current Stack Analysis
**Frontend (React/TypeScript/Vite)**:
```yaml
Core Framework: React 18 + TypeScript + Vite
UI Library: Radix UI + Tailwind CSS + Framer Motion
Workflow Engine: ReactFlow (visual editor)
State Management: Context API + custom hooks
Auth: Firebase Authentication
Real-time: WebSocket connections for live updates
```

**Backend (Next.js API)**:
```yaml
Runtime: Node.js 20 LTS
Framework: Next.js 14 (API routes)
Language: TypeScript
Database: Firebase Firestore
Authentication: Firebase Admin SDK
File Storage: Firebase Storage
Validation: Zod (recommended addition)
```

### Recommended Enhancements
```yaml
Performance Optimization:
  - Add React Query for API caching
  - Implement virtual scrolling for large workflows
  - Add service worker for offline capabilities

Backend Scaling:
  - Migrate to Fastify for better performance
  - Add Redis for caching and sessions
  - Implement background job processing with BullMQ
  - Add GraphQL for efficient data fetching
```

⸻

## 3. Zigsaw Use Cases & Implementation Roadmap

### Priority 1: Live User Testing Use Cases

#### 3.1 Natural Language Workflow Creation
**Feature**: Chat interface where users describe workflows in plain English
**Implementation**: frontend/src/components/NaturalLanguageChat.tsx

```typescript
interface ChatWorkflowCreator {
  // Convert natural language to workflow nodes
  parseNaturalLanguage: (input: string) => Promise<WorkflowDefinition>;
  // Generate workflow from AI interpretation
  generateWorkflow: (interpretation: AIAnalysis) => WorkflowNodes[];
  // Execute generated workflow with confirmation
  executeWithConfirmation: (workflow: WorkflowDefinition) => Promise<ExecutionResult>;
}

// Example user inputs:
// "Send daily summary of GitHub PRs to my email"
// "Analyze customer feedback and create action items in calendar"
// "Generate social media content from blog posts and post to Twitter"
```

**David's Use Case Flow**:
1. **User Intent**: "I need to analyze code commits and generate weekly reports"
2. **AI Parsing**: System identifies GitHub → Claude Analysis → Email Report pattern
3. **Workflow Generation**: Auto-creates GitHub API → Claude Sonnet → Gmail nodes
4. **User Confirmation**: Shows generated workflow for approval
5. **One-Click Execute**: "Ready to Execute" button appears
6. **Live Monitoring**: Real-time progress with streaming results

#### 3.2 Customer Onboarding Workflows
**Use Case**: New user testing with pre-built templates
```yaml
Template 1: "Email to Calendar"
  - Gmail trigger → Claude summary → Calendar event
Template 2: "Code Review Assistant"
  - GitHub webhook → Claude analysis → Slack notification
Template 3: "Content Creator Pipeline"
  - API data → GPT content → Image generation → Social posting
```

### Priority 2: Security Implementation

#### 3.3 Access Control & Credits System
**Location**: `/frontend/src/contexts/AuthContext.tsx`, `/api-backend/pages/api/auth/`

```typescript
interface SecuritySystem {
  // User tier management
  userTier: 'free' | 'pro' | 'enterprise';
  creditBalance: number;
  dailyLimit: number;
  
  // Workflow execution limits
  maxWorkflowsPerUser: number;
  maxNodesPerWorkflow: number;
  allowedAIProviders: string[];
  
  // API rate limiting
  requestsPerMinute: number;
  executionsPerDay: number;
}

// 7-Day Trial Implementation
const TRIAL_CONFIG = {
  duration: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  credits: 1000, // Trial credits
  features: ['all_ai_models', 'unlimited_workflows', 'real_time_monitoring'],
  autoUpgrade: false
};
```

**Security Fixes Needed**:
1. **API Key Management**: Encrypt user API keys at rest
2. **Credit Deduction**: Implement credit tracking per AI API call
3. **Rate Limiting**: Add per-user rate limits based on tier
4. **Access Control**: Implement RBAC for workflow sharing
5. **Audit Logging**: Track all user actions for compliance

### Priority 3: Competitive Feature Implementation

#### 3.4 Advanced Workflow Features (vs n8n/Zapier)
```typescript
// Enhanced node types needed
const ADVANCED_NODES = {
  // Data processing
  DataTransformer: 'JSON/CSV/XML manipulation',
  DatabaseConnector: 'PostgreSQL/MySQL/MongoDB integration',
  WebScraper: 'Intelligent data extraction',
  
  // AI-powered
  VisionAnalyzer: 'Image/video content analysis', 
  VoiceProcessor: 'Audio transcription and analysis',
  DocumentIntelligence: 'PDF/Word processing with AI',
  
  // Business logic
  ConditionalLogic: 'Advanced if/else/switch logic',
  LoopProcessor: 'Batch processing with iterations',
  ErrorHandler: 'Sophisticated error recovery',
  
  // Enterprise
  SSOConnector: 'SAML/OAuth enterprise auth',
  ComplianceLogger: 'GDPR/HIPAA audit trails',
  WorkflowScheduler: 'Cron-based execution'
};
```

#### 3.5 Real-time Collaboration (vs Flowise)
```typescript
// Multi-user workflow editing
interface CollaborationFeatures {
  realTimeEditing: boolean; // Live cursor tracking
  versionControl: boolean;  // Git-like workflow versioning  
  commentSystem: boolean;   // Node-level annotations
  shareWorkflows: boolean;  // Public/private workflow sharing
  teamWorkspaces: boolean;  // Organization-level access
}
```

⸻

## 4. Implementation Tasks & Development Plan

### Natural Language Interface

#### Task 1: Chat Interface Component
**File**: `/frontend/src/components/NaturalLanguageChat.tsx`
```typescript
const ChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const processNaturalLanguage = async (input: string) => {
    // 1. Send to Claude/GPT for workflow interpretation
    // 2. Generate workflow nodes and connections
    // 3. Show preview with "Ready to Execute" button
    // 4. Allow user to modify before execution
  };
  
  return (
    <div className="chat-interface">
      <ChatHistory messages={messages} />
      <ChatInput onSubmit={processNaturalLanguage} />
      <WorkflowPreview workflow={generatedWorkflow} />
    </div>
  );
};
```

#### Task 2: Workflow Generation Service
**File**: `/frontend/src/services/workflowGenerationService.ts`
```typescript
class WorkflowGenerationService {
  async parseUserIntent(input: string): Promise<WorkflowDefinition> {
    const aiResponse = await fetch('/api/ai/parse-workflow', {
      method: 'POST',
      body: JSON.stringify({ prompt: input }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const analysis = await aiResponse.json();
    return this.convertToWorkflow(analysis);
  }
  
  private convertToWorkflow(analysis: AIAnalysis): WorkflowDefinition {
    // Convert AI analysis into ReactFlow nodes and edges
    const nodes = analysis.steps.map(step => ({
      id: generateId(),
      type: step.nodeType,
      data: step.config,
      position: step.position
    }));
    
    const edges = analysis.connections.map(conn => ({
      id: generateId(),
      source: conn.from,
      target: conn.to
    }));
    
    return { nodes, edges, metadata: analysis.metadata };
  }
}
```

### Security & Credits System

#### Task 3: Credit Management System
**File**: `/api-backend/pages/api/credits/index.ts`
```typescript
interface UserCredits {
  userId: string;
  balance: number;
  tier: 'free' | 'trial' | 'pro' | 'enterprise';
  trialStartDate?: Date;
  trialEndDate?: Date;
  monthlyLimit: number;
  usageThisMonth: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return getUserCredits(req, res);
    case 'POST':
      return deductCredits(req, res);
    case 'PUT':
      return addCredits(req, res);
  }
}

const CREDIT_COSTS = {
  'claude-3-sonnet': 0.3,
  'claude-3-haiku': 0.1,
  'gpt-4': 0.5,
  'gpt-3.5-turbo': 0.2,
  'gemini-pro': 0.25
};
```

#### Task 4: 7-Day Trial Implementation
**File**: `/frontend/src/hooks/useTrialStatus.ts`
```typescript
const useTrialStatus = () => {
  const [trialStatus, setTrialStatus] = useState<TrialStatus>();
  
  const startTrial = async () => {
    const response = await fetch('/api/trial/start', { method: 'POST' });
    const trial = await response.json();
    
    // Set 7-day countdown timer
    setTrialStatus({
      isActive: true,
      daysRemaining: 7,
      creditsRemaining: 1000,
      features: ['unlimited_workflows', 'all_ai_models', 'priority_support']
    });
  };
  
  return { trialStatus, startTrial };
};
```

### Advanced Features

#### Task 5: Workflow Templates & Marketplace
**File**: `/frontend/src/components/TemplateMarketplace.tsx`
```typescript
const WORKFLOW_TEMPLATES = {
  'email-to-calendar': {
    name: 'Email to Calendar',
    description: 'Convert emails into calendar events',
    nodes: [
      { type: 'gmail', config: { trigger: 'new_email' } },
      { type: 'claude', config: { prompt: 'Extract event details' } },
      { type: 'calendar', config: { action: 'create_event' } }
    ],
    category: 'productivity',
    popularity: 95
  },
  'code-review-assistant': {
    name: 'Code Review Assistant', 
    description: 'Automated code review with AI analysis',
    nodes: [
      { type: 'github', config: { trigger: 'pull_request' } },
      { type: 'claude', config: { prompt: 'Review code changes' } },
      { type: 'github', config: { action: 'add_comment' } }
    ],
    category: 'development',
    popularity: 87
  }
};
```

#### Task 6: Real-time Execution Monitoring
**File**: `/frontend/src/components/ExecutionMonitor.tsx`
```typescript
const ExecutionMonitor = ({ workflowId }: { workflowId: string }) => {
  const [execution, setExecution] = useState<ExecutionState>();
  
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3000/api/execution/${workflowId}`);
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setExecution(update);
      
      // Update node status in real-time
      updateNodeStatus(update.nodeId, update.status);
    };
    
    return () => ws.close();
  }, [workflowId]);
  
  return (
    <div className="execution-monitor">
      <ProgressBar 
        current={execution?.completedSteps} 
        total={execution?.totalSteps} 
      />
      <NodeStatusList nodes={execution?.nodeStatuses} />
      <LiveLogStream logs={execution?.logs} />
    </div>
  );
};
```

⸻

## 5. AI Pragmatic Programmer Guidelines for New-Age Computing

### Core Philosophy
1. **Think Responsibly, Act Iteratively** – The cone of uncertainty shrinks through short feedback loops; pair frequent checkpoints with automated evaluation.
2. **Automation Adds, Not Abandons, Craft** – AI is a co-pilot; code remains your liability.
3. **Data Is Source Code** – Treat datasets, prompts, and models with the same rigor as code: version, diff, review, refactor.

### Enduring Principles, AI Edition
| Classic Principle | Modern Extension |
|-------------------|------------------|
| **DRY** | Consolidate prompts and feature engineering pipelines; avoid "prompt sprawl." |
| **KISS** | Prefer deterministic rules before invoking generative models. |
| **SOLID** | Encapsulate model calls behind clear interfaces; LSP violations hide as hallucinations. |
| **YAGNI** | Don't pre-train a bespoke model until SaaS APIs fail to meet verifiable requirements. |

### The AI-Augmented Development Loop
1. **Plan** – Capture intent in tests and eval harnesses before coding.
2. **Prompt** – Use structured templates with explicit constraints.
3. **Generate & Review** – Treat every AI suggestion like an intern's PR: linters, static analysis, human review.
4. **Refine** – Iteratively improve prompts and fine-tune models based on test failures.
5. **Ship** – Continuous delivery gated by red-teaming and bias scans.

### Data & Model Lifecycle
- **Version Everything** – Data snapshots, labeling guidelines, hyper-parameters.
- **Reproducibility** – Hash datasets; pin model weights; capture random seeds.
- **Observability** – Log inputs/outputs, latency, drift metrics, cost.

### Ethics & Responsible AI
- **Transparency** – Surface model provenance and limitations to users.
- **Fairness Audits** – Automate checks against disparate impact across protected classes.
- **Privacy by Design** – Anonymize PII before training; employ differential privacy when feasible.

### Tooling & Automation
- **AI in the IDE** – Pair-programming agents, refactor bots, test-case generators.
- **CI/CD** – Add steps for prompt linting, model size budget, token-cost regression.
- **Infrastructure as Code** – Provision GPUs, feature stores, and vector DBs declaratively.

### Continuous Learning Culture
- **Weekly Demo Days**
- **Brown-Bag Deep-dives** 
- **Learning Sprints** – Allocate 10% time to exploring new AI methods with a write-up.

### Collaboration Patterns
- **Prompt-as-Code Reviews** – Diff and comment on prompt evolutions.
- **AI Design Docs** – Include system diagrams showing data, model, and human oversight loops.

### Scaling & Performance
- **Latency Budgets** – Choose model sizes according to 99th-percentile SLA.
- **Cost Awareness** – Track tokens like you track CPU cycles.

### Security Hardening
- **Prompt Injection Defense** – Sanitize user input, use system messages, and scope tools.
- **Model Supply Chain** – Verify signatures on third-party weights; monitor CVEs.

### Testing & Evaluation
- **Golden Sets** – Curate deterministic eval questions.
- **Adversarial Suites** – Include harmful, biased, and edge-case prompts.
- **Automatic Regression Gates** – Block deploys on metric degradation.

### Documentation & Knowledge Sharing
- **Living README** – Link Jupyter notebooks, data lineage, and evaluation dashboards.
- **Decision Records (ADR)** – Capture why a particular model/prompt was chosen.

### Leadership & Strategy
- **North-Star Metric** – Tie AI efforts to user-visible value, not model accuracy alone.
- **Ethical Review Board** – Cross-functional group approves high-impact releases.

⸻

## 6. Competitor Analysis & Market Positioning

### Detailed Competitive Analysis

#### n8n (Open Source Automation)
**Strengths**: Open source, self-hosted, decent node library
**Weaknesses**: No AI-first design, complex setup, limited SaaS offering
**Zigsaw Advantage**: Hosted SaaS with AI-native architecture

#### Zapier (SaaS Automation Leader)
**Strengths**: Huge integration library, established market presence
**Weaknesses**: No visual editor, no AI-powered workflow creation, expensive
**Zigsaw Advantage**: Visual workflow builder + AI-first + competitive pricing

#### Microsoft Power Automate
**Strengths**: Enterprise integration, Office 365 ecosystem
**Weaknesses**: Microsoft ecosystem lock-in, poor user experience
**Zigsaw Advantage**: Cross-platform, modern UI, AI-powered

#### Flowise (AI Workflow Builder)
**Strengths**: AI-focused, visual builder
**Weaknesses**: Limited integrations, no enterprise features, OSS only
**Zigsaw Advantage**: Enterprise SaaS + comprehensive integrations

#### AgentOps (AI Monitoring)
**Strengths**: AI observability focus
**Weaknesses**: Developer-only, no visual workflow creation
**Zigsaw Advantage**: Business user friendly + visual creation + execution

### Market Positioning Strategy
```yaml
Primary Market: "AI-Native Workflow Automation" 
- Target: Technical business users, growth teams, agencies
- Size: $2.1B automation market + $1.3B AI services = $3.4B TAM

Secondary Market: "No-Code AI Applications"
- Target: Non-technical business users, consultants
- Size: $13.2B no-code/low-code market (30% growth YoY)

Pricing Strategy:
  Free Tier: 100 executions/month, basic nodes only
  Starter ($29/mo): 1,000 executions, all AI models, basic support  
  Pro ($99/mo): 10,000 executions, advanced features, priority support
  Enterprise ($299/mo): Unlimited executions, SSO, dedicated support
```

⸻

## 7. Sales Strategy & Customer Acquisition (YC-Inspired)

### YC Customer Development Framework

#### Phase 1: Problem Validation
**Objective**: Validate that workflow automation pain exists
```yaml
Customer Discovery Interviews (50 people):
  - Target: Growth marketers, operations managers, technical PMs
  - Questions: "How do you currently handle repetitive tasks?"
  - Success Metric: 70% say "I wish I could automate X but it's too complex"

Landing Page Test:
  - Headline: "Turn English into Automated Workflows with AI"
  - CTA: "Get Early Access"
  - Success Metric: 5% email capture rate
```

#### Phase 2: Solution Validation
**Objective**: Validate that our approach solves the problem
```yaml
MVP Demo to 20 Interviewed Prospects:
  - Show: Natural language → Visual workflow → Execution
  - Ask: "Would you pay $50/month for this?"
  - Success Metric: 60% say "Yes, absolutely"

Concierge Testing:
  - Manually create workflows for 10 early users
  - Deliver results as if automated
  - Learn: What workflows do they actually need?
```

#### Phase 3: Early Customers
**Objective**: Get first 10 paying customers
```yaml
Pricing Experiment:
  - A/B test: $29/mo vs $49/mo vs $99/mo
  - Value metric: Executions per month
  - Success Metric: >$500 MRR from first cohort

Customer Success:
  - Weekly check-ins with each customer
  - Success metric: 90% workflow completion rate
  - Expansion: Average customer adds 2nd workflow within 30 days
```

#### Phase 4: Product-Market Fit
**Objective**: Achieve strong retention and word-of-mouth growth
```yaml
Retention Metrics:
  - Weekly Active Users: >40% (strong PMF indicator)
  - Net Revenue Retention: >110% (expansion revenue)
  - NPS Score: >50 (promoter-heavy user base)

Growth Channels:
  - Content Marketing: AI workflow tutorials, case studies
  - Product-Led Growth: Viral sharing of workflows
  - Partnership: Integration with popular SaaS tools
```

### Go-to-Market Strategy

#### Target Customer Profiles
**Primary**: Growth Teams at B2B SaaS (100-1000 employees)
- **Pain**: Repetitive data processing, manual reporting, lead routing
- **Budget**: $500-2000/month for automation tools
- **Decision Process**: Growth/Ops manager recommends, VP approves

**Secondary**: Digital Marketing Agencies 
- **Pain**: Client reporting, campaign optimization, content creation
- **Budget**: $200-1000/month per client engagement
- **Decision Process**: Account manager evaluates, agency owner buys

**Tertiary**: Enterprise Operations Teams
- **Pain**: Cross-system data synchronization, compliance reporting
- **Budget**: $5000-20000/month for enterprise automation
- **Decision Process**: IT evaluates, CFO approves, 6-month sales cycle

#### Channel Strategy
```yaml
Month 1-3: Direct Sales + Content
  - Personal outreach to target prospects
  - Weekly blog posts on AI automation
  - LinkedIn thought leadership content

Month 4-6: Partnership Channel
  - Integration partnerships (Stripe, HubSpot, Salesforce) 
  - Referral program for agencies/consultants
  - App store listings (Zapier, Microsoft, Google)

Month 7-12: Product-Led Growth
  - Viral workflow sharing features
  - Template marketplace with attribution
  - Free tier with upgrade prompts
```

### Revenue Model & Unit Economics
```yaml
Customer Acquisition:
  - CAC Target: $150 (blended across channels)
  - LTV Target: $1,800 (12x LTV:CAC ratio)
  - Payback Period: 6 months

Pricing Optimization:
  - Value Metric: Workflow executions per month
  - Usage-based pricing prevents churn
  - Enterprise contracts: Annual prepay discounts

Revenue Projections:
  - Month 6: $10K MRR (50 customers @ $200 ARPU)
  - Month 12: $100K MRR (400 customers @ $250 ARPU)  
  - Month 18: $500K MRR (1,600 customers @ $310 ARPU)
```

⸻

## 8. Development Workflow & Best Practices

### Git Workflow
```bash
# Feature development
git checkout -b feature/natural-language-chat
git add . && git commit -m "feat: add chat interface for workflow creation"
git push origin feature/natural-language-chat

# Code review process
gh pr create --title "Natural Language Chat Interface" \
  --body "Implements chat-based workflow creation with AI parsing"

# Testing commands
npm run dev          # Frontend development server
npm run build        # Production build
npm run lint         # ESLint + TypeScript check
npm run test         # Jest unit tests
npm run e2e          # Playwright end-to-end tests
```

### Development Commands
```bash
# Frontend (port 3000)
cd frontend && npm run dev

# Backend (port 8000) 
cd api-backend && npm run dev

# Full stack development
npm run dev:all      # Starts both frontend and backend

# Deployment
npm run build        # Build for production
npm run deploy       # Deploy to Vercel/Netlify
```

### Environment Configuration
```bash
# Frontend (.env.local)
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_API_URL=http://localhost:8000/api
VITE_CLAUDE_API_KEY=your_claude_key

# Backend (.env.local)
NEXTAUTH_SECRET=your_nextauth_secret
FIREBASE_SERVICE_ACCOUNT_KEY=your_firebase_service_account
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
```

⸻

## 9. Success Metrics & KPIs

### Product Metrics
```yaml
User Engagement:
  - Daily Active Users (DAU): Target 1,000 by month 6
  - Workflow Creation Rate: 2.5 workflows per user per month
  - Execution Success Rate: >95% (workflow reliability)
  - Time to First Workflow: <5 minutes (onboarding efficiency)

Technical Metrics:
  - API Response Time: <200ms p95 (performance)
  - Uptime: 99.9% (reliability) 
  - Error Rate: <0.1% (quality)
  - Credit Utilization: 70% (monetization efficiency)
```

### Business Metrics
```yaml
Growth:
  - Monthly Recurring Revenue (MRR): +20% month-over-month
  - Customer Acquisition Cost (CAC): <$200
  - Customer Lifetime Value (LTV): >$2,000
  - Net Revenue Retention: >120%

User Satisfaction:
  - Net Promoter Score (NPS): >60
  - Customer Satisfaction (CSAT): >4.5/5
  - Support Ticket Volume: <2% of active users
  - Feature Request Fulfillment: 50% within 3 months
```

### Competitive Metrics
```yaml
Market Position:
  - Feature Completeness vs Zapier: 80% parity by month 12
  - AI Capabilities vs Flowise: 150% feature advantage
  - Enterprise Features vs n8n: Full SaaS offering advantage
  - Pricing Competitiveness: 30% better value per execution
```

⸻

## 10. Appendix: Reference Resources

### Essential Reading
- **The Pragmatic Programmer** (Hunt & Thomas) - Software craftsmanship fundamentals
- **Google's PAIR Guidelines** - Responsible AI development practices  
- **Microsoft's Responsible AI Standard** - Enterprise AI governance
- **Stanford CRFM Holistic Evaluation** - AI model evaluation framework

### Technical References
- **ReactFlow Documentation** - Visual workflow editor implementation
- **Firebase Documentation** - Authentication and data persistence
- **Anthropic Claude API** - AI model integration best practices
- **Next.js API Routes** - Backend API development patterns

### Business References
- **YC Startup School** - Customer development methodology
- **$1M ARR Playbook** - SaaS growth strategies
- **The Mom Test** - Customer interview techniques
- **Crossing the Chasm** - Technology adoption lifecycle

---

© 2025 Zigsaw, Inc. All rights reserved.

**Last Updated**: January 20, 2025  
**Version**: 1.0  
**Maintainer**: Development Team