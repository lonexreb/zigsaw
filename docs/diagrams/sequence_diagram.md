# Sequence Diagrams

## 1. Workflow Creation and Execution Flow

```mermaid
sequenceDiagram
    participant User as User
    participant UI as React Frontend
    participant Gateway as API Gateway
    participant Auth as Auth Service
    participant WorkflowUC as Workflow Use Case
    participant WorkflowDomain as Workflow Domain
    participant NodeDomain as Node Domain
    participant ExecutionService as Execution Service
    participant AIProvider as AI Provider
    participant Database as Database
    participant EventBus as Event Bus
    participant NotificationService as Notification Service
    
    %% User Authentication
    User->>UI: Login
    UI->>Gateway: POST /auth/login
    Gateway->>Auth: Validate credentials
    Auth-->>Gateway: JWT Token
    Gateway-->>UI: Authentication response
    UI-->>User: Redirect to dashboard
    
    %% Workflow Creation
    User->>UI: Create workflow
    UI->>Gateway: POST /workflows
    Gateway->>Auth: Validate JWT
    Auth-->>Gateway: User authorized
    Gateway->>WorkflowUC: Create workflow
    WorkflowUC->>WorkflowDomain: Validate workflow
    WorkflowDomain->>NodeDomain: Validate nodes
    NodeDomain-->>WorkflowDomain: Nodes valid
    WorkflowDomain-->>WorkflowUC: Workflow valid
    WorkflowUC->>Database: Save workflow
    Database-->>WorkflowUC: Workflow saved
    WorkflowUC->>EventBus: Publish WorkflowCreated event
    EventBus->>NotificationService: Handle notification
    WorkflowUC-->>Gateway: Workflow created
    Gateway-->>UI: Success response
    UI-->>User: Workflow created confirmation
    
    %% Workflow Execution
    User->>UI: Execute workflow
    UI->>Gateway: POST /workflows/{id}/execute
    Gateway->>Auth: Validate JWT
    Auth-->>Gateway: User authorized
    Gateway->>ExecutionService: Execute workflow
    ExecutionService->>Database: Load workflow
    Database-->>ExecutionService: Workflow data
    ExecutionService->>WorkflowDomain: Create execution context
    WorkflowDomain-->>ExecutionService: Execution context
    ExecutionService->>EventBus: Publish ExecutionStarted event
    
    %% Node Execution Loop
    loop For each node in workflow
        ExecutionService->>NodeDomain: Execute node
        NodeDomain->>AIProvider: Call AI service
        AIProvider-->>NodeDomain: AI response
        NodeDomain->>Database: Save node result
        Database-->>NodeDomain: Result saved
        NodeDomain->>EventBus: Publish NodeExecuted event
        NodeDomain-->>ExecutionService: Node result
    end
    
    ExecutionService->>EventBus: Publish ExecutionCompleted event
    EventBus->>NotificationService: Handle notification
    ExecutionService-->>Gateway: Execution results
    Gateway-->>UI: Results response
    UI-->>User: Execution complete
```

## 2. Node Configuration and Testing Flow

```mermaid
sequenceDiagram
    participant User as User
    participant UI as React Frontend
    participant Gateway as API Gateway
    participant NodeUC as Node Use Case
    parameter NodeDomain as Node Domain
    participant ConfigService as Config Service
    participant ValidationService as Validation Service
    participant AIProvider as AI Provider
    participant Database as Database
    participant EventBus as Event Bus
    
    %% Node Configuration
    User->>UI: Configure AI node
    UI->>Gateway: POST /nodes/{id}/config
    Gateway->>NodeUC: Configure node
    NodeUC->>NodeDomain: Validate configuration
    NodeDomain->>ValidationService: Validate AI settings
    ValidationService-->>NodeDomain: Validation result
    NodeDomain->>ConfigService: Save configuration
    ConfigService->>Database: Persist config
    Database-->>ConfigService: Config saved
    ConfigService-->>NodeDomain: Configuration stored
    NodeDomain->>EventBus: Publish NodeConfigured event
    NodeDomain-->>NodeUC: Configuration complete
    NodeUC-->>Gateway: Success response
    Gateway-->>UI: Config saved
    UI-->>User: Configuration saved
    
    %% Node Testing
    User->>UI: Test node configuration
    UI->>Gateway: POST /nodes/{id}/test
    Gateway->>NodeUC: Test node
    NodeUC->>NodeDomain: Create test context
    NodeDomain->>ConfigService: Load configuration
    ConfigService-->>NodeDomain: Node config
    NodeDomain->>AIProvider: Test API call
    AIProvider-->>NodeDomain: Test response
    NodeDomain->>EventBus: Publish NodeTested event
    NodeDomain-->>NodeUC: Test results
    NodeUC-->>Gateway: Test response
    Gateway-->>UI: Test results
    UI-->>User: Test complete
```

## 3. User Authentication and Authorization Flow

```mermaid
sequenceDiagram
    participant User as User
    participant UI as React Frontend
    participant Gateway as API Gateway
    participant Auth as Auth Service
    participant UserUC as User Use Case
    participant UserDomain as User Domain
    participant Supabase as Supabase
    participant RateLimit as Rate Limit Service
    participant EventBus as Event Bus
    
    %% User Registration
    User->>UI: Register account
    UI->>Gateway: POST /auth/register
    Gateway->>Auth: Validate input
    Auth->>UserUC: Create user
    UserUC->>UserDomain: Validate user data
    UserDomain->>Supabase: Create user account
    Supabase-->>UserDomain: User created
    UserDomain->>RateLimit: Initialize rate limits
    RateLimit-->>UserDomain: Limits set
    UserDomain->>EventBus: Publish UserRegistered event
    UserDomain-->>UserUC: User created
    UserUC-->>Auth: Registration complete
    Auth-->>Gateway: Success response
    Gateway-->>UI: Registration success
    UI-->>User: Account created
    
    %% User Login
    User->>UI: Login
    UI->>Gateway: POST /auth/login
    Gateway->>Auth: Authenticate user
    Auth->>Supabase: Validate credentials
    Supabase-->>Auth: User authenticated
    Auth->>UserDomain: Load user profile
    UserDomain-->>Auth: User data
    Auth->>RateLimit: Check rate limits
    RateLimit-->>Auth: Limits OK
    Auth->>EventBus: Publish UserLoggedIn event
    Auth-->>Gateway: JWT token
    Gateway-->>UI: Authentication success
    UI-->>User: Redirect to dashboard
    
    %% Protected Resource Access
    User->>UI: Access protected resource
    UI->>Gateway: GET /protected-resource (with JWT)
    Gateway->>Auth: Validate JWT
    Auth-->>Gateway: Token valid
    Gateway->>RateLimit: Check rate limits
    RateLimit-->>Gateway: Within limits
    Gateway->>UserUC: Process request
    UserUC-->>Gateway: Response data
    Gateway-->>UI: Protected data
    UI-->>User: Display data
```

## 4. Integration Service Flow (Gmail/Calendar)

```mermaid
sequenceDiagram
    participant User as User
    participant UI as React Frontend
    participant Gateway as API Gateway
    participant IntegrationUC as Integration Use Case
    participant OAuth as OAuth Service
    participant GmailAdapter as Gmail Adapter
    participant CalendarAdapter as Calendar Adapter
    participant Database as Database
    participant EventBus as Event Bus
    participant ExecutionService as Execution Service
    
    %% OAuth Setup
    User->>UI: Connect Gmail
    UI->>Gateway: POST /integrations/gmail/connect
    Gateway->>IntegrationUC: Initiate OAuth
    IntegrationUC->>OAuth: Generate OAuth URL
    OAuth-->>IntegrationUC: OAuth URL
    IntegrationUC-->>Gateway: OAuth URL
    Gateway-->>UI: Redirect URL
    UI-->>User: Redirect to Google OAuth
    
    %% OAuth Callback
    User->>UI: OAuth callback
    UI->>Gateway: GET /integrations/gmail/callback
    Gateway->>IntegrationUC: Handle callback
    IntegrationUC->>OAuth: Exchange code for token
    OAuth-->>IntegrationUC: Access token
    IntegrationUC->>Database: Save token
    Database-->>IntegrationUC: Token saved
    IntegrationUC->>EventBus: Publish IntegrationConnected event
    IntegrationUC-->>Gateway: Connection success
    Gateway-->>UI: Integration complete
    UI-->>User: Gmail connected
    
    %% Workflow with Gmail Integration
    User->>UI: Execute workflow with Gmail
    UI->>Gateway: POST /workflows/{id}/execute
    Gateway->>ExecutionService: Execute workflow
    ExecutionService->>IntegrationUC: Execute Gmail node
    IntegrationUC->>Database: Load Gmail token
    Database-->>IntegrationUC: Access token
    IntegrationUC->>GmailAdapter: Send email
    GmailAdapter-->>IntegrationUC: Email sent
    IntegrationUC->>EventBus: Publish EmailSent event
    IntegrationUC-->>ExecutionService: Node complete
    ExecutionService-->>Gateway: Execution result
    Gateway-->>UI: Success response
    UI-->>User: Workflow complete
```

## 5. Error Handling and Recovery Flow

```mermaid
sequenceDiagram
    participant User as User
    participant UI as React Frontend
    participant Gateway as API Gateway
    participant ErrorHandler as Error Handler
    participant Service as Application Service
    participant Domain as Domain Service
    participant External as External API
    participant Database as Database
    participant EventBus as Event Bus
    participant NotificationService as Notification Service
    participant RetryService as Retry Service
    
    %% Normal Flow with Error
    User->>UI: Execute action
    UI->>Gateway: API Request
    Gateway->>Service: Process request
    Service->>Domain: Business logic
    Domain->>External: External API call
    External-->>Domain: API Error (500)
    Domain->>EventBus: Publish Error event
    Domain-->>Service: Throw domain exception
    Service-->>Gateway: Propagate exception
    Gateway->>ErrorHandler: Handle error
    
    %% Error Processing
    ErrorHandler->>Database: Log error
    Database-->>ErrorHandler: Error logged
    ErrorHandler->>EventBus: Publish ErrorOccurred event
    EventBus->>NotificationService: Handle error notification
    EventBus->>RetryService: Handle retry logic
    
    %% Retry Logic
    RetryService->>Service: Retry operation
    Service->>Domain: Retry business logic
    Domain->>External: Retry API call
    External-->>Domain: Success response
    Domain->>EventBus: Publish RetrySucceeded event
    Domain-->>Service: Return result
    Service-->>Gateway: Success response
    Gateway-->>UI: Success response
    UI-->>User: Operation complete
    
    %% Error Response (if retry fails)
    alt Retry fails
        RetryService->>EventBus: Publish RetryFailed event
        EventBus->>NotificationService: Handle failure notification
        RetryService-->>Gateway: Final error
        Gateway->>ErrorHandler: Format error response
        ErrorHandler-->>Gateway: User-friendly error
        Gateway-->>UI: Error response
        UI-->>User: Display error message
    end
```

## 6. Real-time Updates and WebSocket Flow

```mermaid
sequenceDiagram
    participant User as User
    participant UI as React Frontend
    participant WebSocket as WebSocket Server
    participant ExecutionService as Execution Service
    participant EventBus as Event Bus
    participant Database as Database
    participant NotificationService as Notification Service
    
    %% WebSocket Connection
    User->>UI: Open workflow execution page
    UI->>WebSocket: Connect WebSocket
    WebSocket-->>UI: Connection established
    UI->>WebSocket: Subscribe to workflow updates
    WebSocket-->>UI: Subscription confirmed
    
    %% Workflow Execution with Real-time Updates
    User->>UI: Execute workflow
    UI->>ExecutionService: Start execution
    ExecutionService->>EventBus: Publish ExecutionStarted event
    EventBus->>WebSocket: Handle execution event
    WebSocket-->>UI: Execution started notification
    UI-->>User: Show execution started
    
    %% Node Execution Updates
    loop For each node execution
        ExecutionService->>EventBus: Publish NodeExecuting event
        EventBus->>WebSocket: Handle node event
        WebSocket-->>UI: Node execution update
        UI-->>User: Update node status
        
        ExecutionService->>Database: Save node result
        Database-->>ExecutionService: Result saved
        ExecutionService->>EventBus: Publish NodeCompleted event
        EventBus->>WebSocket: Handle completion event
        WebSocket-->>UI: Node completion update
        UI-->>User: Update node result
    end
    
    %% Execution Completion
    ExecutionService->>EventBus: Publish ExecutionCompleted event
    EventBus->>WebSocket: Handle completion event
    EventBus->>NotificationService: Handle notification
    WebSocket-->>UI: Execution complete notification
    UI-->>User: Show final results
    
    %% Connection Cleanup
    User->>UI: Leave page
    UI->>WebSocket: Disconnect
    WebSocket-->>UI: Connection closed
```

## 7. Plugin System Flow

```mermaid
sequenceDiagram
    participant Developer as Plugin Developer
    participant PluginRegistry as Plugin Registry
    participant PluginLoader as Plugin Loader
    participant NodeFactory as Node Factory
    participant ValidationService as Validation Service
    participant ExecutionService as Execution Service
    participant Database as Database
    participant EventBus as Event Bus
    
    %% Plugin Registration
    Developer->>PluginRegistry: Register plugin
    PluginRegistry->>ValidationService: Validate plugin
    ValidationService-->>PluginRegistry: Plugin valid
    PluginRegistry->>Database: Store plugin metadata
    Database-->>PluginRegistry: Metadata stored
    PluginRegistry->>EventBus: Publish PluginRegistered event
    PluginRegistry-->>Developer: Plugin registered
    
    %% Plugin Loading
    ExecutionService->>PluginLoader: Load plugin
    PluginLoader->>PluginRegistry: Get plugin metadata
    PluginRegistry-->>PluginLoader: Plugin info
    PluginLoader->>NodeFactory: Create plugin instance
    NodeFactory-->>PluginLoader: Plugin instance
    PluginLoader->>ValidationService: Validate plugin instance
    ValidationService-->>PluginLoader: Instance valid
    PluginLoader-->>ExecutionService: Plugin ready
    
    %% Plugin Execution
    ExecutionService->>NodeFactory: Execute plugin node
    NodeFactory->>ValidationService: Validate input
    ValidationService-->>NodeFactory: Input valid
    NodeFactory->>Database: Execute plugin logic
    Database-->>NodeFactory: Plugin result
    NodeFactory->>EventBus: Publish PluginExecuted event
    NodeFactory-->>ExecutionService: Execution complete
```

These sequence diagrams show the complete flow of operations across the layered architecture, demonstrating:

1. **Proper separation of concerns** across layers
2. **Event-driven communication** for loose coupling
3. **Error handling and recovery** mechanisms
4. **Real-time updates** for better user experience
5. **Plugin extensibility** for custom functionality
6. **Security and authorization** throughout the system
7. **Integration patterns** for external services

The diagrams illustrate how the refactored architecture maintains clean boundaries while enabling complex workflows and integrations.