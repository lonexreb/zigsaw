# Architecture Diagram

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React Frontend]
        Mobile[Mobile Apps]
        API_Client[API Clients]
    end
    
    subgraph "API Gateway"
        Gateway[FastAPI Gateway]
        Auth[Authentication]
        RateLimit[Rate Limiting]
        Validation[Input Validation]
    end
    
    subgraph "Application Layer"
        WorkflowUC[Workflow Use Cases]
        NodeUC[Node Use Cases]
        UserUC[User Use Cases]
        IntegrationUC[Integration Use Cases]
    end
    
    subgraph "Domain Layer"
        WorkflowDomain[Workflow Domain]
        NodeDomain[Node Domain]
        UserDomain[User Domain]
        ExecutionDomain[Execution Domain]
    end
    
    subgraph "Infrastructure Layer"
        subgraph "Data Layer"
            Database[(Database - Neo4j Removed)]
            Supabase[(Supabase)]
            Redis[(Redis Cache)]
        end
        
        subgraph "External Services"
            OpenAI[OpenAI API]
            Gmail[Gmail API]
            Calendar[Google Calendar]
            GitHub[GitHub API]
        end
        
        subgraph "Infrastructure Services"
            FileSystem[File Storage]
            Queue[Message Queue]
            Monitoring[Monitoring]
        end
    end
    
    %% Client to Gateway
    UI --> Gateway
    Mobile --> Gateway
    API_Client --> Gateway
    
    %% Gateway to Application
    Gateway --> Auth
    Gateway --> RateLimit
    Gateway --> Validation
    Auth --> WorkflowUC
    RateLimit --> NodeUC
    Validation --> UserUC
    Gateway --> IntegrationUC
    
    %% Application to Domain
    WorkflowUC --> WorkflowDomain
    NodeUC --> NodeDomain
    UserUC --> UserDomain
    IntegrationUC --> ExecutionDomain
    
    %% Domain to Infrastructure
    WorkflowDomain --> Database
    NodeDomain --> Redis
    UserDomain --> Supabase
    ExecutionDomain --> Queue
    
    %% External Service Integrations
    IntegrationUC --> OpenAI
    IntegrationUC --> Gmail
    IntegrationUC --> Calendar
    IntegrationUC --> GitHub
    
    %% Infrastructure Services
    WorkflowUC --> FileSystem
    ExecutionDomain --> Monitoring
    
    classDef clientLayer fill:#e1f5fe
    classDef gatewayLayer fill:#f3e5f5
    classDef applicationLayer fill:#e8f5e8
    classDef domainLayer fill:#fff3e0
    classDef infraLayer fill:#fce4ec
    
    class UI,Mobile,API_Client clientLayer
    class Gateway,Auth,RateLimit,Validation gatewayLayer
    class WorkflowUC,NodeUC,UserUC,IntegrationUC applicationLayer
    class WorkflowDomain,NodeDomain,UserDomain,ExecutionDomain domainLayer
    class Database,Supabase,Redis,OpenAI,Gmail,Calendar,GitHub,FileSystem,Queue,Monitoring infraLayer
```

## Layered Architecture Detail

```mermaid
graph TB
    subgraph "Presentation Layer"
        subgraph "React Frontend"
            Pages[Pages & Routes]
            Components[UI Components]
            Contexts[State Management]
            Hooks[Custom Hooks]
        end
    end
    
    subgraph "API Layer (Controllers)"
        subgraph "FastAPI Routes"
            WorkflowRoutes[Workflow Routes]
            NodeRoutes[Node Routes]
            UserRoutes[User Routes]
            IntegrationRoutes[Integration Routes]
        end
        
        subgraph "Middleware"
            AuthMiddleware[Authentication]
            ValidationMiddleware[Validation]
            ErrorMiddleware[Error Handling]
            LoggingMiddleware[Logging]
        end
    end
    
    subgraph "Application Layer (Use Cases)"
        subgraph "Use Cases"
            CreateWorkflow[Create Workflow]
            ExecuteWorkflow[Execute Workflow]
            ManageNodes[Manage Nodes]
            HandleIntegrations[Handle Integrations]
        end
        
        subgraph "Application Services"
            WorkflowService[Workflow Service]
            NodeService[Node Service]
            ExecutionService[Execution Service]
            IntegrationService[Integration Service]
        end
    end
    
    subgraph "Domain Layer"
        subgraph "Domain Models"
            Workflow[Workflow Entity]
            Node[Node Entity]
            User[User Entity]
            Execution[Execution Entity]
        end
        
        subgraph "Domain Services"
            WorkflowRules[Workflow Rules]
            NodeValidation[Node Validation]
            ExecutionEngine[Execution Engine]
        end
        
        subgraph "Domain Events"
            WorkflowEvents[Workflow Events]
            ExecutionEvents[Execution Events]
        end
    end
    
    subgraph "Infrastructure Layer"
        subgraph "Repositories"
            WorkflowRepo[Workflow Repository]
            NodeRepo[Node Repository]
            UserRepo[User Repository]
        end
        
        subgraph "External Adapters"
            AIProviders[AI Provider Adapters]
            EmailAdapter[Email Adapter]
            CalendarAdapter[Calendar Adapter]
        end
        
        subgraph "Infrastructure Services"
            Database[Database Service]
            Cache[Cache Service]
            FileStorage[File Storage]
            Queue[Message Queue]
        end
    end
    
    %% Dependencies (outer depends on inner)
    Pages --> WorkflowRoutes
    Components --> NodeRoutes
    Contexts --> UserRoutes
    Hooks --> IntegrationRoutes
    
    WorkflowRoutes --> CreateWorkflow
    NodeRoutes --> ExecuteWorkflow
    UserRoutes --> ManageNodes
    IntegrationRoutes --> HandleIntegrations
    
    CreateWorkflow --> WorkflowService
    ExecuteWorkflow --> NodeService
    ManageNodes --> ExecutionService
    HandleIntegrations --> IntegrationService
    
    WorkflowService --> Workflow
    NodeService --> Node
    ExecutionService --> Execution
    IntegrationService --> User
    
    WorkflowService --> WorkflowRules
    NodeService --> NodeValidation
    ExecutionService --> ExecutionEngine
    
    WorkflowRules --> WorkflowEvents
    ExecutionEngine --> ExecutionEvents
    
    WorkflowService --> WorkflowRepo
    NodeService --> NodeRepo
    ExecutionService --> UserRepo
    
    IntegrationService --> AIProviders
    IntegrationService --> EmailAdapter
    IntegrationService --> CalendarAdapter
    
    WorkflowRepo --> Database
    NodeRepo --> Cache
    UserRepo --> FileStorage
    ExecutionService --> Queue
    
    classDef presentationLayer fill:#e3f2fd
    classDef apiLayer fill:#f1f8e9
    classDef applicationLayer fill:#fff3e0
    classDef domainLayer fill:#fce4ec
    classDef infraLayer fill:#f3e5f5
    
    class Pages,Components,Contexts,Hooks presentationLayer
    class WorkflowRoutes,NodeRoutes,UserRoutes,IntegrationRoutes,AuthMiddleware,ValidationMiddleware,ErrorMiddleware,LoggingMiddleware apiLayer
    class CreateWorkflow,ExecuteWorkflow,ManageNodes,HandleIntegrations,WorkflowService,NodeService,ExecutionService,IntegrationService applicationLayer
    class Workflow,Node,User,Execution,WorkflowRules,NodeValidation,ExecutionEngine,WorkflowEvents,ExecutionEvents domainLayer
    class WorkflowRepo,NodeRepo,UserRepo,AIProviders,EmailAdapter,CalendarAdapter,Database,Cache,FileStorage,Queue infraLayer
```

## Component Interaction Flow

```mermaid
sequenceDiagram
    participant UI as React UI
    participant API as FastAPI Controller
    participant UC as Use Case
    participant Domain as Domain Service
    participant Repo as Repository
    participant DB as Database
    participant External as External API
    
    UI->>API: HTTP Request
    API->>API: Validate Input
    API->>UC: Execute Use Case
    UC->>Domain: Apply Business Logic
    Domain->>Domain: Validate Business Rules
    Domain->>Repo: Persist Data
    Repo->>DB: Database Operation
    DB-->>Repo: Return Result
    Repo-->>Domain: Return Entity
    Domain->>External: Call External Service
    External-->>Domain: Return Response
    Domain-->>UC: Return Domain Result
    UC-->>API: Return Use Case Result
    API-->>UI: HTTP Response
```

## Dependency Injection Container

```mermaid
graph TB
    subgraph "DI Container"
        Container[Dependency Container]
        
        subgraph "Interface Registrations"
            IWorkflowRepo[IWorkflowRepository]
            INodeRepo[INodeRepository]
            IUserRepo[IUserRepository]
            IAIProvider[IAIProvider]
        end
        
        subgraph "Implementation Registrations"
            DatabaseWorkflowRepo[DatabaseWorkflowRepository]
            RedisNodeRepo[RedisNodeRepository]
            SupabaseUserRepo[SupabaseUserRepository]
            OpenAIProvider[OpenAIProvider]
        end
        
        subgraph "Service Registrations"
            WorkflowService[WorkflowService]
            NodeService[NodeService]
            ExecutionService[ExecutionService]
        end
    end
    
    Container --> IWorkflowRepo
    Container --> INodeRepo
    Container --> IUserRepo
    Container --> IAIProvider
    
    IWorkflowRepo --> DatabaseWorkflowRepo
    INodeRepo --> RedisNodeRepo
    IUserRepo --> SupabaseUserRepo
    IAIProvider --> OpenAIProvider
    
    WorkflowService --> IWorkflowRepo
    NodeService --> INodeRepo
    ExecutionService --> IAIProvider
    
    classDef interface fill:#e8f5e8
    classDef implementation fill:#fff3e0
    classDef service fill:#f3e5f5
    
    class IWorkflowRepo,INodeRepo,IUserRepo,IAIProvider interface
    class DatabaseWorkflowRepo,RedisNodeRepo,SupabaseUserRepo,OpenAIProvider implementation
    class WorkflowService,NodeService,ExecutionService service
```

## Plugin Architecture

```mermaid
graph TB
    subgraph "Core System"
        PluginRegistry[Plugin Registry]
        PluginLoader[Plugin Loader]
        NodeFactory[Node Factory]
    end
    
    subgraph "Plugin Interfaces"
        INodePlugin[INodePlugin]
        IExecutorPlugin[IExecutorPlugin]
        IValidatorPlugin[IValidatorPlugin]
    end
    
    subgraph "Built-in Plugins"
        AINodePlugin[AI Node Plugin]
        DocumentPlugin[Document Plugin]
        EmailPlugin[Email Plugin]
        CalendarPlugin[Calendar Plugin]
    end
    
    subgraph "Custom Plugins"
        CustomNode1[Custom Node 1]
        CustomNode2[Custom Node 2]
        ThirdPartyPlugin[Third Party Plugin]
    end
    
    PluginRegistry --> PluginLoader
    PluginLoader --> NodeFactory
    
    NodeFactory --> INodePlugin
    NodeFactory --> IExecutorPlugin
    NodeFactory --> IValidatorPlugin
    
    INodePlugin --> AINodePlugin
    INodePlugin --> DocumentPlugin
    INodePlugin --> EmailPlugin
    INodePlugin --> CalendarPlugin
    
    INodePlugin --> CustomNode1
    INodePlugin --> CustomNode2
    INodePlugin --> ThirdPartyPlugin
    
    classDef core fill:#e3f2fd
    classDef interface fill:#e8f5e8
    classDef builtin fill:#fff3e0
    classDef custom fill:#fce4ec
    
    class PluginRegistry,PluginLoader,NodeFactory core
    class INodePlugin,IExecutorPlugin,IValidatorPlugin interface
    class AINodePlugin,DocumentPlugin,EmailPlugin,CalendarPlugin builtin
    class CustomNode1,CustomNode2,ThirdPartyPlugin custom
```

## Event-Driven Architecture

```mermaid
graph TB
    subgraph "Event Publishers"
        WorkflowService[Workflow Service]
        ExecutionService[Execution Service]
        NodeService[Node Service]
    end
    
    subgraph "Event Bus"
        EventBus[Event Bus]
        EventStore[Event Store]
    end
    
    subgraph "Event Handlers"
        NotificationHandler[Notification Handler]
        MetricsHandler[Metrics Handler]
        AuditHandler[Audit Handler]
        CacheHandler[Cache Handler]
    end
    
    subgraph "External Integrations"
        EmailService[Email Service]
        SlackService[Slack Service]
        WebhookService[Webhook Service]
    end
    
    WorkflowService --> EventBus
    ExecutionService --> EventBus
    NodeService --> EventBus
    
    EventBus --> EventStore
    EventBus --> NotificationHandler
    EventBus --> MetricsHandler
    EventBus --> AuditHandler
    EventBus --> CacheHandler
    
    NotificationHandler --> EmailService
    NotificationHandler --> SlackService
    NotificationHandler --> WebhookService
    
    classDef publisher fill:#e3f2fd
    classDef eventBus fill:#e8f5e8
    classDef handler fill:#fff3e0
    classDef external fill:#fce4ec
    
    class WorkflowService,ExecutionService,NodeService publisher
    class EventBus,EventStore eventBus
    class NotificationHandler,MetricsHandler,AuditHandler,CacheHandler handler
    class EmailService,SlackService,WebhookService external
```

This architecture provides:
- **Clear separation of concerns** across layers
- **Dependency inversion** with interfaces
- **Plugin-based extensibility** for new node types
- **Event-driven communication** for loose coupling
- **Proper dependency injection** for testability
- **Scalable infrastructure** for growth