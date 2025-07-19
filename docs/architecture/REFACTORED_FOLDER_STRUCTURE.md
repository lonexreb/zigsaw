# Refactored Folder Structure

## Overview
This document outlines the new folder structure implementing layered architecture with proper separation of concerns, SOLID principles, and DRY patterns.

## Backend Structure (Python/FastAPI)

```
agent-ops/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                          # FastAPI app setup with DI container
│   │   ├── container.py                     # Dependency injection container
│   │   ├── settings.py                      # Application settings
│   │   │
│   │   ├── presentation/                    # API Layer (Controllers)
│   │   │   ├── __init__.py
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── v1/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── endpoints/
│   │   │   │   │   │   ├── __init__.py
│   │   │   │   │   │   ├── workflows.py     # Workflow API endpoints
│   │   │   │   │   │   ├── nodes.py         # Node management endpoints
│   │   │   │   │   │   ├── users.py         # User management endpoints
│   │   │   │   │   │   ├── auth.py          # Authentication endpoints
│   │   │   │   │   │   ├── integrations.py # External integrations
│   │   │   │   │   │   └── health.py        # Health check endpoints
│   │   │   │   │   ├── schemas/
│   │   │   │   │   │   ├── __init__.py
│   │   │   │   │   │   ├── requests/        # Request DTOs
│   │   │   │   │   │   │   ├── __init__.py
│   │   │   │   │   │   │   ├── workflow_requests.py
│   │   │   │   │   │   │   ├── node_requests.py
│   │   │   │   │   │   │   └── auth_requests.py
│   │   │   │   │   │   └── responses/       # Response DTOs
│   │   │   │   │   │       ├── __init__.py
│   │   │   │   │   │       ├── workflow_responses.py
│   │   │   │   │   │       ├── node_responses.py
│   │   │   │   │   │       └── auth_responses.py
│   │   │   │   │   └── dependencies.py     # Route dependencies
│   │   │   │   └── middleware/
│   │   │   │       ├── __init__.py
│   │   │   │       ├── auth_middleware.py
│   │   │   │       ├── cors_middleware.py
│   │   │   │       ├── error_middleware.py
│   │   │   │       └── logging_middleware.py
│   │   │   └── websockets/
│   │   │       ├── __init__.py
│   │   │       ├── connection_manager.py
│   │   │       └── workflow_events.py
│   │   │
│   │   ├── application/                     # Application Layer (Use Cases)
│   │   │   ├── __init__.py
│   │   │   ├── use_cases/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── workflow/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── create_workflow.py
│   │   │   │   │   ├── execute_workflow.py
│   │   │   │   │   ├── update_workflow.py
│   │   │   │   │   ├── delete_workflow.py
│   │   │   │   │   └── get_workflow.py
│   │   │   │   ├── node/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── configure_node.py
│   │   │   │   │   ├── execute_node.py
│   │   │   │   │   └── validate_node.py
│   │   │   │   ├── user/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── register_user.py
│   │   │   │   │   ├── authenticate_user.py
│   │   │   │   │   └── update_user_profile.py
│   │   │   │   └── integration/
│   │   │   │       ├── __init__.py
│   │   │   │       ├── connect_service.py
│   │   │   │       ├── sync_data.py
│   │   │   │       └── disconnect_service.py
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── workflow_service.py      # Application workflow service
│   │   │   │   ├── execution_service.py     # Workflow execution orchestration
│   │   │   │   ├── notification_service.py  # User notifications
│   │   │   │   ├── integration_service.py   # External service coordination
│   │   │   │   └── analytics_service.py     # Usage analytics
│   │   │   ├── commands/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── workflow_commands.py     # CQRS Commands
│   │   │   │   ├── node_commands.py
│   │   │   │   └── user_commands.py
│   │   │   ├── queries/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── workflow_queries.py      # CQRS Queries
│   │   │   │   ├── node_queries.py
│   │   │   │   └── user_queries.py
│   │   │   ├── events/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── handlers/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── workflow_handlers.py
│   │   │   │   │   ├── node_handlers.py
│   │   │   │   │   └── user_handlers.py
│   │   │   │   └── event_bus.py
│   │   │   └── interfaces/
│   │   │       ├── __init__.py
│   │   │       ├── services/
│   │   │       │   ├── __init__.py
│   │   │       │   ├── i_workflow_service.py
│   │   │       │   ├── i_execution_service.py
│   │   │       │   ├── i_notification_service.py
│   │   │       │   └── i_integration_service.py
│   │   │       └── use_cases/
│   │   │           ├── __init__.py
│   │   │           ├── i_workflow_use_cases.py
│   │   │           └── i_node_use_cases.py
│   │   │
│   │   ├── domain/                          # Domain Layer (Business Logic)
│   │   │   ├── __init__.py
│   │   │   ├── entities/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── workflow.py              # Workflow aggregate root
│   │   │   │   ├── node.py                  # Node entity
│   │   │   │   ├── edge.py                  # Edge entity
│   │   │   │   ├── user.py                  # User entity
│   │   │   │   ├── execution.py             # Execution entity
│   │   │   │   └── integration.py           # Integration entity
│   │   │   ├── value_objects/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── workflow_id.py
│   │   │   │   ├── node_id.py
│   │   │   │   ├── user_id.py
│   │   │   │   ├── email.py
│   │   │   │   ├── node_config.py
│   │   │   │   └── execution_result.py
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── workflow_validator.py    # Domain validation logic
│   │   │   │   ├── execution_engine.py      # Core execution logic
│   │   │   │   ├── node_factory.py          # Node creation logic
│   │   │   │   └── dependency_resolver.py   # Workflow dependency resolution
│   │   │   ├── events/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base_event.py
│   │   │   │   ├── workflow_events.py       # Domain events
│   │   │   │   ├── node_events.py
│   │   │   │   └── user_events.py
│   │   │   ├── exceptions/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── workflow_exceptions.py
│   │   │   │   ├── node_exceptions.py
│   │   │   │   └── validation_exceptions.py
│   │   │   ├── specifications/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── workflow_specifications.py
│   │   │   │   └── node_specifications.py
│   │   │   └── interfaces/
│   │   │       ├── __init__.py
│   │   │       ├── repositories/
│   │   │       │   ├── __init__.py
│   │   │       │   ├── i_workflow_repository.py
│   │   │       │   ├── i_node_repository.py
│   │   │       │   ├── i_user_repository.py
│   │   │       │   └── i_execution_repository.py
│   │   │       ├── services/
│   │   │       │   ├── __init__.py
│   │   │       │   ├── i_node_executor.py
│   │   │       │   ├── i_validator.py
│   │   │       │   └── i_event_publisher.py
│   │   │       └── external/
│   │   │           ├── __init__.py
│   │   │           ├── i_ai_provider.py
│   │   │           ├── i_oauth_provider.py
│   │   │           └── i_storage_provider.py
│   │   │
│   │   ├── infrastructure/                  # Infrastructure Layer
│   │   │   ├── __init__.py
│   │   │   ├── persistence/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── repositories/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── # Database repositories removed
│   │   │   │   │   ├── firebase_user_repository.py
│   │   │   │   │   └── in_memory_execution_repository.py
│   │   │   │   ├── mappers/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── workflow_mapper.py
│   │   │   │   │   ├── node_mapper.py
│   │   │   │   │   └── user_mapper.py
│   │   │   │   └── schemas/
│   │   │   │       ├── __init__.py
│   │   │   │       ├── workflow_schema.py
│   │   │   │       ├── node_schema.py
│   │   │   │       └── user_schema.py
│   │   │   ├── external/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── ai_providers/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── anthropic_adapter.py
│   │   │   │   │   ├── openai_adapter.py
│   │   │   │   │   ├── google_adapter.py
│   │   │   │   │   ├── groq_adapter.py
│   │   │   │   │   └── base_ai_adapter.py
│   │   │   │   ├── oauth_providers/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── google_oauth.py
│   │   │   │   │   ├── github_oauth.py
│   │   │   │   │   └── base_oauth_provider.py
│   │   │   │   ├── storage/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── file_storage.py
│   │   │   │   │   └── cloud_storage.py
│   │   │   │   └── messaging/
│   │   │   │       ├── __init__.py
│   │   │   │       ├── email_service.py
│   │   │   │       └── websocket_service.py
│   │   │   ├── config/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── database_config.py
│   │   │   │   ├── redis_config.py
│   │   │   │   ├── oauth_config.py
│   │   │   │   └── ai_provider_config.py
│   │   │   ├── logging/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── structured_logger.py
│   │   │   │   ├── metrics_collector.py
│   │   │   │   └── trace_context.py
│   │   │   ├── security/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── jwt_handler.py
│   │   │   │   ├── encryption_service.py
│   │   │   │   └── api_key_manager.py
│   │   │   └── node_executors/                # Node execution implementations
│   │   │       ├── __init__.py
│   │   │       ├── base_executor.py
│   │   │       ├── ai_executors/
│   │   │       │   ├── __init__.py
│   │   │       │   ├── claude_executor.py
│   │   │       │   ├── gpt_executor.py
│   │   │       │   ├── gemini_executor.py
│   │   │       │   └── groq_executor.py
│   │   │       ├── integration_executors/
│   │   │       │   ├── __init__.py
│   │   │       │   ├── github_executor.py
│   │   │       │   ├── calendar_executor.py
│   │   │       │   ├── gmail_executor.py
│   │   │       │   └── api_executor.py
│   │   │       ├── data_executors/
│   │   │       │   ├── __init__.py
│   │   │       │   ├── document_executor.py
│   │   │       │   ├── search_executor.py
│   │   │       │   ├── embedding_executor.py
│   │   │       │   └── graphrag_executor.py
│   │   │       └── media_executors/
│   │   │           ├── __init__.py
│   │   │           ├── image_executor.py
│   │   │           ├── video_executor.py
│   │   │           └── audio_executor.py
│   │   │
│   │   ├── shared/                          # Shared utilities
│   │   │   ├── __init__.py
│   │   │   ├── constants/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── node_types.py
│   │   │   │   ├── error_codes.py
│   │   │   │   └── api_constants.py
│   │   │   ├── utils/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── date_utils.py
│   │   │   │   ├── validation_utils.py
│   │   │   │   ├── serialization_utils.py
│   │   │   │   └── crypto_utils.py
│   │   │   ├── decorators/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── retry_decorator.py
│   │   │   │   ├── cache_decorator.py
│   │   │   │   └── metrics_decorator.py
│   │   │   └── patterns/
│   │   │       ├── __init__.py
│   │   │       ├── singleton.py
│   │   │       ├── observer.py
│   │   │       └── strategy.py
│   │   │
│   │   └── tests/                           # Test structure
│   │       ├── __init__.py
│   │       ├── unit/
│   │       │   ├── __init__.py
│   │       │   ├── domain/
│   │       │   │   ├── __init__.py
│   │       │   │   ├── test_workflow_entity.py
│   │       │   │   ├── test_node_entity.py
│   │       │   │   └── test_domain_services.py
│   │       │   ├── application/
│   │       │   │   ├── __init__.py
│   │       │   │   ├── test_use_cases.py
│   │       │   │   └── test_services.py
│   │       │   └── infrastructure/
│   │       │       ├── __init__.py
│   │       │       ├── test_repositories.py
│   │       │       └── test_external_adapters.py
│   │       ├── integration/
│   │       │   ├── __init__.py
│   │       │   ├── test_api_endpoints.py
│   │       │   ├── test_database_integration.py
│   │       │   └── test_external_services.py
│   │       ├── e2e/
│   │       │   ├── __init__.py
│   │       │   ├── test_workflow_execution.py
│   │       │   └── test_user_journeys.py
│   │       ├── fixtures/
│   │       │   ├── __init__.py
│   │       │   ├── workflow_fixtures.py
│   │       │   ├── node_fixtures.py
│   │       │   └── user_fixtures.py
│   │       └── conftest.py
│   │
│   ├── migrations/                          # Database migrations
│   │   ├── __init__.py
│   │   ├── versions/
│   │   └── alembic.ini
│   │
│   ├── scripts/                             # Utility scripts
│   │   ├── setup_database.py
│   │   ├── seed_data.py
│   │   └── migrate_existing_data.py
│   │
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── development.txt
│   │   ├── production.txt
│   │   └── testing.txt
│   │
│   ├── .env.example
│   ├── .env.development
│   ├── .env.production
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── pyproject.toml

## Frontend Structure (React/TypeScript)

```
agent-ops/
├── frontend/
│   ├── src/
│   │   ├── app/                             # Application setup
│   │   │   ├── App.tsx
│   │   │   ├── App.css
│   │   │   ├── main.tsx
│   │   │   └── router.tsx
│   │   │
│   │   ├── presentation/                    # Presentation Layer
│   │   │   ├── pages/                       # Route-based pages
│   │   │   │   ├── index.ts
│   │   │   │   ├── workflow/
│   │   │   │   │   ├── WorkflowListPage.tsx
│   │   │   │   │   ├── WorkflowEditorPage.tsx
│   │   │   │   │   ├── WorkflowExecutionPage.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginPage.tsx
│   │   │   │   │   ├── RegisterPage.tsx
│   │   │   │   │   ├── CallbackPage.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── DashboardPage.tsx
│   │   │   │   │   ├── AnalyticsPage.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   └── settings/
│   │   │   │       ├── SettingsPage.tsx
│   │   │   │       ├── IntegrationsPage.tsx
│   │   │   │       └── index.ts
│   │   │   ├── components/                  # Reusable UI components
│   │   │   │   ├── index.ts
│   │   │   │   ├── ui/                      # Base UI components
│   │   │   │   │   ├── Button/
│   │   │   │   │   │   ├── Button.tsx
│   │   │   │   │   │   ├── Button.module.css
│   │   │   │   │   │   ├── Button.test.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── Input/
│   │   │   │   │   ├── Modal/
│   │   │   │   │   ├── Card/
│   │   │   │   │   ├── Loading/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── layout/                  # Layout components
│   │   │   │   │   ├── Header/
│   │   │   │   │   │   ├── Header.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── Sidebar/
│   │   │   │   │   ├── Footer/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── workflow/                # Workflow-specific components
│   │   │   │   │   ├── WorkflowCanvas/
│   │   │   │   │   │   ├── WorkflowCanvas.tsx
│   │   │   │   │   │   ├── WorkflowCanvas.hooks.ts
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── NodePalette/
│   │   │   │   │   ├── NodeEditor/
│   │   │   │   │   ├── ExecutionPanel/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── nodes/                   # Node components
│   │   │   │   │   ├── base/
│   │   │   │   │   │   ├── BaseNode/
│   │   │   │   │   │   ├── NodeHandle/
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── ai/
│   │   │   │   │   │   ├── ClaudeNode/
│   │   │   │   │   │   ├── GPTNode/
│   │   │   │   │   │   ├── GeminiNode/
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── integration/
│   │   │   │   │   │   ├── GitHubNode/
│   │   │   │   │   │   ├── CalendarNode/
│   │   │   │   │   │   ├── GmailNode/
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   └── data/
│   │   │   │   │       ├── DocumentNode/
│   │   │   │   │       ├── SearchNode/
│   │   │   │   │       └── index.ts
│   │   │   │   └── forms/                   # Form components
│   │   │   │       ├── WorkflowForm/
│   │   │   │       ├── NodeConfigForm/
│   │   │   │       ├── IntegrationForm/
│   │   │   │       └── index.ts
│   │   │   └── hooks/                       # Custom React hooks
│   │   │       ├── index.ts
│   │   │       ├── workflow/
│   │   │       │   ├── useWorkflowEditor.ts
│   │   │       │   ├── useWorkflowExecution.ts
│   │   │       │   ├── useWorkflowValidation.ts
│   │   │       │   └── index.ts
│   │   │       ├── auth/
│   │   │       │   ├── useAuth.ts
│   │   │       │   ├── usePermissions.ts
│   │   │       │   └── index.ts
│   │   │       ├── api/
│   │   │       │   ├── useApi.ts
│   │   │       │   ├── useQuery.ts
│   │   │       │   ├── useMutation.ts
│   │   │       │   └── index.ts
│   │   │       └── ui/
│   │   │           ├── useModal.ts
│   │   │           ├── useToast.ts
│   │   │           ├── useTheme.ts
│   │   │           └── index.ts
│   │   │
│   │   ├── application/                     # Application Layer
│   │   │   ├── contexts/                    # React contexts
│   │   │   │   ├── index.ts
│   │   │   │   ├── AuthContext/
│   │   │   │   │   ├── AuthContext.tsx
│   │   │   │   │   ├── AuthProvider.tsx
│   │   │   │   │   ├── auth.types.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── WorkflowContext/
│   │   │   │   │   ├── WorkflowContext.tsx
│   │   │   │   │   ├── WorkflowProvider.tsx
│   │   │   │   │   ├── workflow.types.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── ThemeContext/
│   │   │   │   ├── NotificationContext/
│   │   │   │   └── ApiContext/
│   │   │   ├── store/                       # State management
│   │   │   │   ├── index.ts
│   │   │   │   ├── slices/
│   │   │   │   │   ├── authSlice.ts
│   │   │   │   │   ├── workflowSlice.ts
│   │   │   │   │   ├── uiSlice.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── persistMiddleware.ts
│   │   │   │   │   ├── loggerMiddleware.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── selectors/
│   │   │   │       ├── authSelectors.ts
│   │   │   │       ├── workflowSelectors.ts
│   │   │   │       └── index.ts
│   │   │   └── services/                    # Frontend services
│   │   │       ├── index.ts
│   │   │       ├── api/
│   │   │       │   ├── base/
│   │   │       │   │   ├── ApiClient.ts
│   │   │       │   │   ├── HttpClient.ts
│   │   │       │   │   ├── RequestBuilder.ts
│   │   │       │   │   └── index.ts
│   │   │       │   ├── workflow/
│   │   │       │   │   ├── WorkflowApiService.ts
│   │   │       │   │   ├── NodeApiService.ts
│   │   │       │   │   ├── ExecutionApiService.ts
│   │   │       │   │   └── index.ts
│   │   │       │   ├── auth/
│   │   │       │   │   ├── AuthApiService.ts
│   │   │       │   │   ├── TokenService.ts
│   │   │       │   │   └── index.ts
│   │   │       │   └── integration/
│   │   │       │       ├── GitHubApiService.ts
│   │   │       │       ├── CalendarApiService.ts
│   │   │       │       └── index.ts
│   │   │       ├── storage/
│   │   │       │   ├── LocalStorageService.ts
│   │   │       │   ├── SessionStorageService.ts
│   │   │       │   ├── IndexedDbService.ts
│   │   │       │   └── index.ts
│   │   │       ├── validation/
│   │   │       │   ├── WorkflowValidator.ts
│   │   │       │   ├── NodeValidator.ts
│   │   │       │   ├── FormValidator.ts
│   │   │       │   └── index.ts
│   │   │       └── notification/
│   │   │           ├── ToastService.ts
│   │   │           ├── WebSocketService.ts
│   │   │           └── index.ts
│   │   │
│   │   ├── domain/                          # Domain Layer (Frontend)
│   │   │   ├── models/                      # Domain models
│   │   │   │   ├── index.ts
│   │   │   │   ├── Workflow.ts
│   │   │   │   ├── Node.ts
│   │   │   │   ├── Edge.ts
│   │   │   │   ├── User.ts
│   │   │   │   ├── Execution.ts
│   │   │   │   └── Integration.ts
│   │   │   ├── interfaces/                  # Domain interfaces
│   │   │   │   ├── index.ts
│   │   │   │   ├── IWorkflowService.ts
│   │   │   │   ├── INodeService.ts
│   │   │   │   ├── IAuthService.ts
│   │   │   │   ├── IStorageService.ts
│   │   │   │   └── IValidationService.ts
│   │   │   ├── events/                      # Domain events
│   │   │   │   ├── index.ts
│   │   │   │   ├── WorkflowEvents.ts
│   │   │   │   ├── NodeEvents.ts
│   │   │   │   └── AuthEvents.ts
│   │   │   └── specifications/              # Business rules
│   │   │       ├── index.ts
│   │   │       ├── WorkflowSpecifications.ts
│   │   │       └── NodeSpecifications.ts
│   │   │
│   │   ├── infrastructure/                  # Infrastructure Layer
│   │   │   ├── config/
│   │   │   │   ├── index.ts
│   │   │   │   ├── api.config.ts
│   │   │   │   ├── theme.config.ts
│   │   │   │   └── environment.config.ts
│   │   │   ├── utils/
│   │   │   │   ├── index.ts
│   │   │   │   ├── dateUtils.ts
│   │   │   │   ├── formatUtils.ts
│   │   │   │   ├── validationUtils.ts
│   │   │   │   └── debugUtils.ts
│   │   │   ├── constants/
│   │   │   │   ├── index.ts
│   │   │   │   ├── api.constants.ts
│   │   │   │   ├── ui.constants.ts
│   │   │   │   └── route.constants.ts
│   │   │   └── adapters/
│   │   │       ├── index.ts
│   │   │       ├── LocalStorageAdapter.ts
│   │   │       ├── WebSocketAdapter.ts
│   │   │       └── FirebaseAdapter.ts
│   │   │
│   │   ├── shared/                          # Shared utilities
│   │   │   ├── types/
│   │   │   │   ├── index.ts
│   │   │   │   ├── api.types.ts
│   │   │   │   ├── workflow.types.ts
│   │   │   │   ├── node.types.ts
│   │   │   │   └── ui.types.ts
│   │   │   ├── enums/
│   │   │   │   ├── index.ts
│   │   │   │   ├── NodeTypes.ts
│   │   │   │   ├── ExecutionStatus.ts
│   │   │   │   └── UserRoles.ts
│   │   │   ├── guards/
│   │   │   │   ├── index.ts
│   │   │   │   ├── AuthGuard.tsx
│   │   │   │   ├── PermissionGuard.tsx
│   │   │   │   └── RouteGuard.tsx
│   │   │   └── decorators/
│   │   │       ├── index.ts
│   │   │       ├── withAuth.tsx
│   │   │       ├── withLoading.tsx
│   │   │       └── withErrorBoundary.tsx
│   │   │
│   │   └── assets/                          # Static assets
│   │       ├── images/
│   │       ├── icons/
│   │       ├── fonts/
│   │       └── styles/
│   │           ├── globals.css
│   │           ├── variables.css
│   │           └── themes/
│   │
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   │
│   ├── tests/                               # Frontend tests
│   │   ├── setup.ts
│   │   ├── unit/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   ├── integration/
│   │   │   ├── pages/
│   │   │   └── workflows/
│   │   ├── e2e/
│   │   │   ├── user-journeys/
│   │   │   └── workflow-execution/
│   │   └── fixtures/
│   │       ├── mockData.ts
│   │       └── testWorkflows.ts
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── eslint.config.js
│   └── .env.example

## Root Level Files

```
Zigsaw/
├── docs/
│   ├── architecture/
│   │   ├── LAYERED_ARCHITECTURE.md          # This document
│   │   ├── REFACTORED_FOLDER_STRUCTURE.md   # This file
│   │   ├── DOMAIN_DRIVEN_DESIGN.md
│   │   ├── API_DESIGN.md
│   │   └── TESTING_STRATEGY.md
│   ├── guides/
│   │   ├── DEVELOPMENT_SETUP.md
│   │   ├── DEPLOYMENT_GUIDE.md
│   │   ├── CONTRIBUTING.md
│   │   └── MIGRATION_GUIDE.md
│   └── api/
│       ├── openapi.yaml
│       └── postman_collection.json
├── scripts/
│   ├── setup/
│   │   ├── setup-development.sh
│   │   ├── setup-database.sh
│   │   └── setup-environment.sh
│   ├── deployment/
│   │   ├── deploy-staging.sh
│   │   ├── deploy-production.sh
│   │   └── rollback.sh
│   └── maintenance/
│       ├── backup-database.sh
│       ├── cleanup-logs.sh
│       └── health-check.sh
├── docker/
│   ├── backend/
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev
│   │   └── docker-compose.yml
│   ├── frontend/
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev
│   │   └── nginx.conf
│   └── infrastructure/
│       ├── # Database folder removed
│       ├── redis/
│       └── monitoring/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── cd.yml
│   │   ├── security-scan.yml
│   │   └── dependency-update.yml
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── README.md
├── LICENSE
├── .gitignore
├── .env.example
└── docker-compose.yml

## Migration Strategy

### Phase 1: Foundation Setup
1. Create the new folder structure
2. Move existing files to appropriate locations
3. Set up dependency injection container
4. Create base interfaces and abstractions

### Phase 2: Domain Layer Extraction
1. Extract domain entities from existing models
2. Create value objects
3. Define repository interfaces
4. Implement domain services

### Phase 3: Application Layer Refactoring
1. Create use cases from existing route handlers
2. Implement CQRS pattern
3. Set up event handling
4. Refactor existing services

### Phase 4: Infrastructure Implementation
1. Implement repository concrete classes
2. Create external service adapters
3. Set up proper configuration management
4. Add comprehensive logging

### Phase 5: API Layer Modernization
1. Refactor routes to use dependency injection
2. Implement proper validation
3. Add authentication middleware
4. Update error handling

### Phase 6: Frontend Restructuring
1. Organize components by feature
2. Implement custom hooks
3. Create proper service abstractions
4. Add comprehensive state management

## Benefits of This Structure

1. **Clear Separation of Concerns**: Each layer has a specific responsibility
2. **Dependency Inversion**: Dependencies flow inward toward the domain
3. **Testability**: Each layer can be tested independently
4. **Maintainability**: Changes in one layer don't affect others
5. **Scalability**: Components can be scaled independently
6. **Extensibility**: New features can be added without modifying existing code

This structure follows industry best practices and will make the codebase much more maintainable, testable, and scalable. 