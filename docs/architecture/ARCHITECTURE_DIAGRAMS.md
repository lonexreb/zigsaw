# AgentOps Flow Forge - Architecture Diagrams

## System Architecture Diagrams

### 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Application]
        MOBILE[Mobile App]
        API_CLIENT[API Clients]
    end
    
    subgraph "API Gateway"
        GATEWAY[Load Balancer/API Gateway]
        RATE_LIMITER[Rate Limiter]
        AUTH_MIDDLEWARE[Auth Middleware]
    end
    
    subgraph "Application Layer"
        FASTAPI[FastAPI Application]
        MIDDLEWARE[Middleware Stack]
        ROUTES[API Routes]
    end
    
    subgraph "Business Logic Layer"
        COMMANDS[Commands]
        QUERIES[Queries]
        HANDLERS[Handlers]
        SERVICES[Domain Services]
    end
    
    subgraph "Domain Layer"
        AI_DOMAIN[AI Nodes Domain]
        WORKFLOW_DOMAIN[Workflow Domain]
        USER_DOMAIN[User Domain]
        INTEGRATION_DOMAIN[Integration Domain]
    end
    
    subgraph "Infrastructure Layer"
        DATABASE[(Firebase/Database)]
        CACHE[(Redis Cache)]
        EXTERNAL_APIs[External AI APIs]
        FILE_STORAGE[File Storage]
        MESSAGE_QUEUE[Message Queue]
    end
    
    subgraph "External Services"
        ANTHROPIC[Anthropic Claude]
        OPENAI[OpenAI]
        GOOGLE[Google APIs]
        GITHUB[GitHub]
        STRIPE[Stripe]
    end
    
    WEB --> GATEWAY
    MOBILE --> GATEWAY
    API_CLIENT --> GATEWAY
    
    GATEWAY --> RATE_LIMITER
    RATE_LIMITER --> AUTH_MIDDLEWARE
    AUTH_MIDDLEWARE --> FASTAPI
    
    FASTAPI --> MIDDLEWARE
    MIDDLEWARE --> ROUTES
    ROUTES --> COMMANDS
    ROUTES --> QUERIES
    
    COMMANDS --> HANDLERS
    QUERIES --> HANDLERS
    HANDLERS --> SERVICES
    
    SERVICES --> AI_DOMAIN
    SERVICES --> WORKFLOW_DOMAIN
    SERVICES --> USER_DOMAIN
    SERVICES --> INTEGRATION_DOMAIN
    
    AI_DOMAIN --> DATABASE
    WORKFLOW_DOMAIN --> DATABASE
    USER_DOMAIN --> DATABASE
    INTEGRATION_DOMAIN --> DATABASE
    
    SERVICES --> CACHE
    SERVICES --> EXTERNAL_APIs
    SERVICES --> FILE_STORAGE
    SERVICES --> MESSAGE_QUEUE
    
    EXTERNAL_APIs --> ANTHROPIC
    EXTERNAL_APIs --> OPENAI
    EXTERNAL_APIs --> GOOGLE
    EXTERNAL_APIs --> GITHUB
    EXTERNAL_APIs --> STRIPE
```

### 2. Layered Architecture Detailed View

```mermaid
graph TD
    subgraph "Presentation Layer"
        API_V1[API v1 Endpoints]
        SCHEMAS[Request/Response Schemas]
        MIDDLEWARE_P[Middleware]
        DEPENDENCIES[FastAPI Dependencies]
    end
    
    subgraph "Application Layer"
        COMMANDS_A[Commands]
        QUERIES_A[Queries]
        HANDLERS_A[Command/Query Handlers]
        DTOS[Data Transfer Objects]
        EVENTS[Event Handlers]
    end
    
    subgraph "Domain Layer"
        ENTITIES[Domain Entities]
        AGGREGATES[Domain Aggregates]
        SERVICES_D[Domain Services]
        REPOSITORIES_I[Repository Interfaces]
        EVENTS_D[Domain Events]
    end
    
    subgraph "Infrastructure Layer"
        REPOSITORIES_IMPL[Repository Implementations]
        EXTERNAL_CLIENTS[External API Clients]
        CACHE_IMPL[Cache Implementations]
        DATABASE_IMPL[Database Implementations]
        MESSAGE_IMPL[Message Queue Implementations]
    end
    
    API_V1 --> COMMANDS_A
    API_V1 --> QUERIES_A
    SCHEMAS --> DTOS
    MIDDLEWARE_P --> DEPENDENCIES
    
    COMMANDS_A --> HANDLERS_A
    QUERIES_A --> HANDLERS_A
    HANDLERS_A --> SERVICES_D
    HANDLERS_A --> EVENTS
    
    SERVICES_D --> ENTITIES
    SERVICES_D --> AGGREGATES
    SERVICES_D --> REPOSITORIES_I
    ENTITIES --> EVENTS_D
    
    REPOSITORIES_I --> REPOSITORIES_IMPL
    SERVICES_D --> EXTERNAL_CLIENTS
    HANDLERS_A --> CACHE_IMPL
    REPOSITORIES_IMPL --> DATABASE_IMPL
    EVENTS --> MESSAGE_IMPL
```

### 3. Domain-Driven Design Structure

```mermaid
graph TB
    subgraph "Core Domain"
        INTERFACES[Core Interfaces]
        ENTITIES_C[Base Entities]
        EXCEPTIONS[Custom Exceptions]
        SECURITY[Security Components]
        VALIDATION[Validation Framework]
    end
    
    subgraph "AI Nodes Domain"
        AI_ENTITIES[AI Node Entities]
        AI_SERVICES[AI Node Services]
        AI_REPOSITORIES[AI Node Repositories]
        AI_COMMANDS[AI Node Commands]
        AI_EVENTS[AI Node Events]
    end
    
    subgraph "Workflow Domain"
        WF_ENTITIES[Workflow Entities]
        WF_SERVICES[Workflow Services]
        WF_REPOSITORIES[Workflow Repositories]
        WF_COMMANDS[Workflow Commands]
        WF_EVENTS[Workflow Events]
        EXECUTION_ENGINE[Execution Engine]
    end
    
    subgraph "User Domain"
        USER_ENTITIES[User Entities]
        USER_SERVICES[User Services]
        USER_REPOSITORIES[User Repositories]
        USER_COMMANDS[User Commands]
        SUBSCRIPTION[Subscription Service]
    end
    
    subgraph "Integration Domain"
        PROVIDERS[AI Providers]
        EXTERNAL_SERVICES[External Services]
        PROVIDER_REGISTRY[Provider Registry]
        CLIENT_FACTORIES[Client Factories]
    end
    
    AI_ENTITIES --> INTERFACES
    AI_SERVICES --> INTERFACES
    AI_REPOSITORIES --> INTERFACES
    
    WF_ENTITIES --> INTERFACES
    WF_SERVICES --> INTERFACES
    WF_REPOSITORIES --> INTERFACES
    EXECUTION_ENGINE --> AI_SERVICES
    
    USER_ENTITIES --> INTERFACES
    USER_SERVICES --> INTERFACES
    USER_REPOSITORIES --> INTERFACES
    
    PROVIDERS --> INTERFACES
    EXTERNAL_SERVICES --> INTERFACES
    PROVIDER_REGISTRY --> PROVIDERS
    
    WF_SERVICES --> AI_SERVICES
    WF_SERVICES --> INTEGRATION_DOMAIN
    AI_SERVICES --> INTEGRATION_DOMAIN
```

## Workflow Execution Diagrams

### 4. Workflow Execution Sequence Diagram

```mermaid
sequenceDiagram
    participant Client
    participant API_Gateway
    participant Workflow_Controller
    participant Command_Handler
    participant Workflow_Service
    participant Execution_Engine
    participant AI_Provider
    participant Database
    participant Event_Bus
    
    Client->>API_Gateway: POST /api/workflows/execute
    API_Gateway->>API_Gateway: Rate Limiting
    API_Gateway->>API_Gateway: Authentication
    API_Gateway->>Workflow_Controller: Execute Workflow Request
    
    Workflow_Controller->>Workflow_Controller: Input Validation
    Workflow_Controller->>Command_Handler: ExecuteWorkflowCommand
    
    Command_Handler->>Workflow_Service: Execute(workflowId, input)
    Workflow_Service->>Database: Get Workflow Definition
    Database-->>Workflow_Service: Workflow Definition
    
    Workflow_Service->>Workflow_Service: Validate Workflow
    Workflow_Service->>Execution_Engine: Execute Workflow
    
    Execution_Engine->>Execution_Engine: Topological Sort
    Execution_Engine->>Event_Bus: Publish WorkflowStarted Event
    
    loop For each node in execution order
        Execution_Engine->>AI_Provider: Execute Node
        AI_Provider-->>Execution_Engine: Node Result
        Execution_Engine->>Database: Save Node Result
        Execution_Engine->>Event_Bus: Publish NodeCompleted Event
    end
    
    Execution_Engine->>Event_Bus: Publish WorkflowCompleted Event
    Execution_Engine-->>Workflow_Service: Execution Result
    
    Workflow_Service->>Database: Save Execution Result
    Workflow_Service-->>Command_Handler: Execution Result
    Command_Handler-->>Workflow_Controller: Execution Result
    Workflow_Controller-->>API_Gateway: HTTP Response
    API_Gateway-->>Client: Execution Result
```

### 5. AI Node Execution Flow

```mermaid
sequenceDiagram
    participant Execution_Engine
    participant Executor_Factory
    participant AI_Node_Executor
    participant Provider_Registry
    participant AI_Provider
    participant Cache
    participant External_API
    
    Execution_Engine->>Executor_Factory: Create Executor(nodeType)
    Executor_Factory-->>Execution_Engine: AI_Node_Executor
    
    Execution_Engine->>AI_Node_Executor: Execute(node, context)
    AI_Node_Executor->>AI_Node_Executor: Validate Configuration
    
    AI_Node_Executor->>Cache: Get Cached Result
    Cache-->>AI_Node_Executor: Cache Miss
    
    AI_Node_Executor->>Provider_Registry: Get Provider(providerName)
    Provider_Registry-->>AI_Node_Executor: AI_Provider
    
    AI_Node_Executor->>AI_Provider: Get Completion(request)
    AI_Provider->>External_API: HTTP Request
    External_API-->>AI_Provider: AI Response
    AI_Provider-->>AI_Node_Executor: Processed Response
    
    AI_Node_Executor->>Cache: Store Result
    AI_Node_Executor-->>Execution_Engine: Execution Result
```

### 6. Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant Client
    participant API_Gateway
    participant Auth_Middleware
    participant Firebase_Auth
    participant User_Service
    participant Database
    participant JWT_Service
    
    Client->>API_Gateway: Request with JWT Token
    API_Gateway->>Auth_Middleware: Validate Request
    
    Auth_Middleware->>Auth_Middleware: Extract JWT Token
    Auth_Middleware->>JWT_Service: Verify Token
    JWT_Service-->>Auth_Middleware: Token Valid
    
    Auth_Middleware->>Firebase_Auth: Verify Firebase Token
    Firebase_Auth-->>Auth_Middleware: User ID
    
    Auth_Middleware->>User_Service: Get User Context
    User_Service->>Database: Get User Details
    Database-->>User_Service: User Data
    User_Service-->>Auth_Middleware: User Context
    
    Auth_Middleware->>Auth_Middleware: Check Permissions
    Auth_Middleware-->>API_Gateway: Authenticated Request
    API_Gateway->>API_Gateway: Continue to Route Handler
```

### 7. Caching Strategy Flow

```mermaid
sequenceDiagram
    participant Service
    participant Cache_Manager
    participant Memory_Cache
    participant Redis_Cache
    participant Database
    
    Service->>Cache_Manager: Get Data(key)
    
    Cache_Manager->>Memory_Cache: Get(key)
    alt Memory Cache Hit
        Memory_Cache-->>Cache_Manager: Data
        Cache_Manager-->>Service: Cached Data
    else Memory Cache Miss
        Memory_Cache-->>Cache_Manager: Miss
        
        Cache_Manager->>Redis_Cache: Get(key)
        alt Redis Cache Hit
            Redis_Cache-->>Cache_Manager: Data
            Cache_Manager->>Memory_Cache: Set(key, data)
            Cache_Manager-->>Service: Cached Data
        else Redis Cache Miss
            Redis_Cache-->>Cache_Manager: Miss
            
            Cache_Manager->>Database: Get Data
            Database-->>Cache_Manager: Data
            
            Cache_Manager->>Memory_Cache: Set(key, data)
            Cache_Manager->>Redis_Cache: Set(key, data)
            Cache_Manager-->>Service: Fresh Data
        end
    end
```

## Security Architecture Diagrams

### 8. Security Architecture Overview

```mermaid
graph TB
    subgraph "External Threats"
        DDOS[DDoS Attacks]
        INJECTION[Injection Attacks]
        XSS[XSS Attempts]
        CSRF[CSRF Attacks]
    end
    
    subgraph "Security Perimeter"
        WAF[Web Application Firewall]
        RATE_LIMIT[Rate Limiting]
        CORS_POLICY[CORS Policy]
        INPUT_VALIDATION[Input Validation]
    end
    
    subgraph "Authentication Layer"
        JWT[JWT Tokens]
        FIREBASE[Firebase Auth]
        MFA[Multi-Factor Auth]
        SESSION[Session Management]
    end
    
    subgraph "Authorization Layer"
        RBAC[Role-Based Access Control]
        PERMISSIONS[Permission System]
        API_KEYS[API Key Management]
        RESOURCE_ACCESS[Resource Access Control]
    end
    
    subgraph "Data Protection"
        ENCRYPTION[Data Encryption]
        SECRETS[Secret Management]
        AUDIT_LOG[Audit Logging]
        DATA_MASKING[Data Masking]
    end
    
    subgraph "Application Security"
        SECURE_HEADERS[Security Headers]
        HTTPS_ONLY[HTTPS Only]
        SECURE_COOKIES[Secure Cookies]
        CONTENT_SECURITY[Content Security Policy]
    end
    
    DDOS --> WAF
    INJECTION --> INPUT_VALIDATION
    XSS --> CORS_POLICY
    CSRF --> SECURE_HEADERS
    
    WAF --> JWT
    RATE_LIMIT --> FIREBASE
    INPUT_VALIDATION --> MFA
    CORS_POLICY --> SESSION
    
    JWT --> RBAC
    FIREBASE --> PERMISSIONS
    MFA --> API_KEYS
    SESSION --> RESOURCE_ACCESS
    
    RBAC --> ENCRYPTION
    PERMISSIONS --> SECRETS
    API_KEYS --> AUDIT_LOG
    RESOURCE_ACCESS --> DATA_MASKING
    
    ENCRYPTION --> SECURE_HEADERS
    SECRETS --> HTTPS_ONLY
    AUDIT_LOG --> SECURE_COOKIES
    DATA_MASKING --> CONTENT_SECURITY
```

### 9. Secret Management Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        DEV_ENV[.env Files]
        DEV_CONFIG[Development Config]
    end
    
    subgraph "Staging Environment"
        STAGING_VAULT[Staging Key Vault]
        STAGING_CONFIG[Staging Config]
    end
    
    subgraph "Production Environment"
        PROD_VAULT[Production Key Vault]
        PROD_CONFIG[Production Config]
        HSM[Hardware Security Module]
    end
    
    subgraph "Secret Management Service"
        SECRET_MANAGER[Secret Manager]
        ENCRYPTION_SERVICE[Encryption Service]
        KEY_ROTATION[Key Rotation Service]
        AUDIT_SERVICE[Audit Service]
    end
    
    subgraph "Application Runtime"
        APP_INSTANCE[Application Instance]
        SECRET_CACHE[Secret Cache]
        SECURE_TRANSPORT[Secure Transport]
    end
    
    DEV_ENV --> SECRET_MANAGER
    DEV_CONFIG --> SECRET_MANAGER
    
    STAGING_VAULT --> SECRET_MANAGER
    STAGING_CONFIG --> SECRET_MANAGER
    
    PROD_VAULT --> SECRET_MANAGER
    PROD_CONFIG --> SECRET_MANAGER
    HSM --> SECRET_MANAGER
    
    SECRET_MANAGER --> ENCRYPTION_SERVICE
    SECRET_MANAGER --> KEY_ROTATION
    SECRET_MANAGER --> AUDIT_SERVICE
    
    SECRET_MANAGER --> APP_INSTANCE
    APP_INSTANCE --> SECRET_CACHE
    SECRET_CACHE --> SECURE_TRANSPORT
```

## Performance Architecture Diagrams

### 10. Performance Optimization Architecture

```mermaid
graph TB
    subgraph "Client Side"
        BROWSER[Browser]
        CDN[Content Delivery Network]
        STATIC_ASSETS[Static Assets]
    end
    
    subgraph "Load Balancing"
        LOAD_BALANCER[Load Balancer]
        HEALTH_CHECK[Health Checks]
        CIRCUIT_BREAKER[Circuit Breaker]
    end
    
    subgraph "Application Tier"
        APP_SERVER_1[App Server 1]
        APP_SERVER_2[App Server 2]
        APP_SERVER_N[App Server N]
    end
    
    subgraph "Caching Layer"
        REDIS_CLUSTER[Redis Cluster]
        MEMORY_CACHE[In-Memory Cache]
        CACHE_INVALIDATION[Cache Invalidation]
    end
    
    subgraph "Database Layer"
        PRIMARY_DB[(Primary Database)]
        REPLICA_DB[(Read Replica)]
        CONNECTION_POOL[Connection Pool]
    end
    
    subgraph "External Services"
        AI_PROVIDERS[AI Providers]
        EXTERNAL_APIS[External APIs]
        WEBHOOK_HANDLERS[Webhook Handlers]
    end
    
    subgraph "Monitoring"
        METRICS[Metrics Collection]
        ALERTING[Alerting System]
        LOGGING[Centralized Logging]
    end
    
    BROWSER --> CDN
    CDN --> STATIC_ASSETS
    BROWSER --> LOAD_BALANCER
    
    LOAD_BALANCER --> HEALTH_CHECK
    LOAD_BALANCER --> CIRCUIT_BREAKER
    HEALTH_CHECK --> APP_SERVER_1
    HEALTH_CHECK --> APP_SERVER_2
    HEALTH_CHECK --> APP_SERVER_N
    
    APP_SERVER_1 --> REDIS_CLUSTER
    APP_SERVER_2 --> REDIS_CLUSTER
    APP_SERVER_N --> REDIS_CLUSTER
    
    APP_SERVER_1 --> MEMORY_CACHE
    APP_SERVER_2 --> MEMORY_CACHE
    APP_SERVER_N --> MEMORY_CACHE
    
    REDIS_CLUSTER --> CACHE_INVALIDATION
    
    APP_SERVER_1 --> CONNECTION_POOL
    APP_SERVER_2 --> CONNECTION_POOL
    APP_SERVER_N --> CONNECTION_POOL
    
    CONNECTION_POOL --> PRIMARY_DB
    CONNECTION_POOL --> REPLICA_DB
    
    APP_SERVER_1 --> AI_PROVIDERS
    APP_SERVER_2 --> EXTERNAL_APIS
    APP_SERVER_N --> WEBHOOK_HANDLERS
    
    APP_SERVER_1 --> METRICS
    APP_SERVER_2 --> METRICS
    APP_SERVER_N --> METRICS
    
    METRICS --> ALERTING
    METRICS --> LOGGING
```

### 11. Event-Driven Architecture

```mermaid
graph TB
    subgraph "Event Producers"
        WORKFLOW_SERVICE[Workflow Service]
        AI_NODE_SERVICE[AI Node Service]
        USER_SERVICE[User Service]
        INTEGRATION_SERVICE[Integration Service]
    end
    
    subgraph "Event Bus"
        EVENT_ROUTER[Event Router]
        EVENT_STORE[Event Store]
        EVENT_REPLAY[Event Replay]
    end
    
    subgraph "Event Handlers"
        NOTIFICATION_HANDLER[Notification Handler]
        ANALYTICS_HANDLER[Analytics Handler]
        AUDIT_HANDLER[Audit Handler]
        WEBHOOK_HANDLER[Webhook Handler]
    end
    
    subgraph "Event Consumers"
        EMAIL_SERVICE[Email Service]
        SLACK_SERVICE[Slack Service]
        ANALYTICS_SERVICE[Analytics Service]
        AUDIT_SERVICE[Audit Service]
        EXTERNAL_WEBHOOKS[External Webhooks]
    end
    
    subgraph "Event Types"
        WORKFLOW_EVENTS[Workflow Events]
        NODE_EVENTS[Node Events]
        USER_EVENTS[User Events]
        SYSTEM_EVENTS[System Events]
    end
    
    WORKFLOW_SERVICE --> EVENT_ROUTER
    AI_NODE_SERVICE --> EVENT_ROUTER
    USER_SERVICE --> EVENT_ROUTER
    INTEGRATION_SERVICE --> EVENT_ROUTER
    
    EVENT_ROUTER --> EVENT_STORE
    EVENT_ROUTER --> EVENT_REPLAY
    
    EVENT_ROUTER --> NOTIFICATION_HANDLER
    EVENT_ROUTER --> ANALYTICS_HANDLER
    EVENT_ROUTER --> AUDIT_HANDLER
    EVENT_ROUTER --> WEBHOOK_HANDLER
    
    NOTIFICATION_HANDLER --> EMAIL_SERVICE
    NOTIFICATION_HANDLER --> SLACK_SERVICE
    ANALYTICS_HANDLER --> ANALYTICS_SERVICE
    AUDIT_HANDLER --> AUDIT_SERVICE
    WEBHOOK_HANDLER --> EXTERNAL_WEBHOOKS
    
    EVENT_STORE --> WORKFLOW_EVENTS
    EVENT_STORE --> NODE_EVENTS
    EVENT_STORE --> USER_EVENTS
    EVENT_STORE --> SYSTEM_EVENTS
```

## Deployment Architecture

### 12. Deployment Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        DEV_REPO[Git Repository]
        DEV_CI[CI Pipeline]
        DEV_TESTS[Automated Tests]
        DEV_DEPLOY[Dev Deployment]
    end
    
    subgraph "Staging Environment"
        STAGING_DEPLOY[Staging Deployment]
        STAGING_TESTS[Integration Tests]
        STAGING_DB[(Staging Database)]
    end
    
    subgraph "Production Environment"
        PROD_DEPLOY[Production Deployment]
        PROD_LB[Load Balancer]
        PROD_SERVERS[Application Servers]
        PROD_DB[(Production Database)]
        PROD_CACHE[Production Cache]
    end
    
    subgraph "Monitoring & Observability"
        MONITORING[Monitoring Stack]
        LOGGING[Logging Stack]
        ALERTING[Alerting System]
        METRICS[Metrics Collection]
    end
    
    subgraph "Security & Compliance"
        SECURITY_SCAN[Security Scanning]
        COMPLIANCE_CHECK[Compliance Checks]
        VULNERABILITY_SCAN[Vulnerability Scanning]
    end
    
    DEV_REPO --> DEV_CI
    DEV_CI --> DEV_TESTS
    DEV_TESTS --> DEV_DEPLOY
    DEV_DEPLOY --> STAGING_DEPLOY
    
    STAGING_DEPLOY --> STAGING_TESTS
    STAGING_TESTS --> STAGING_DB
    STAGING_TESTS --> PROD_DEPLOY
    
    PROD_DEPLOY --> PROD_LB
    PROD_LB --> PROD_SERVERS
    PROD_SERVERS --> PROD_DB
    PROD_SERVERS --> PROD_CACHE
    
    PROD_SERVERS --> MONITORING
    PROD_SERVERS --> LOGGING
    MONITORING --> ALERTING
    LOGGING --> METRICS
    
    DEV_CI --> SECURITY_SCAN
    STAGING_DEPLOY --> COMPLIANCE_CHECK
    PROD_DEPLOY --> VULNERABILITY_SCAN
```

These diagrams provide a comprehensive view of the refactored architecture, showing how different components interact and the flow of data and control through the system. The diagrams cover all major aspects including system architecture, security, performance, and deployment strategies.