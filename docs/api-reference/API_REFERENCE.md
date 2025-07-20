# 📚 Zigsaw API Reference - Comprehensive Documentation

## Overview
The Zigsaw API provides programmatic access to all platform functionality including workflow creation, execution, monitoring, and management. All endpoints use REST principles with JSON payloads and standard HTTP status codes.

## 🔗 Base URLs

| Environment | Base URL | Purpose |
|-------------|----------|---------|
| **Development** | `http://localhost:3001` | Local development |
| **Staging** | `https://api-staging.zigsaw.dev` | Testing and QA |
| **Production** | `https://api.zigsaw.dev` | Live production API |

## 🔐 Authentication

### Firebase JWT Authentication
All protected endpoints require a valid Firebase JWT token in the Authorization header.

```http
Authorization: Bearer <firebase_jwt_token>
```

### API Key Authentication (Enterprise)
Enterprise users can use API keys for server-to-server communication.

```http
X-API-Key: <your_api_key>
```

### Getting Auth Token
```javascript
// Frontend (Firebase SDK)
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;
const token = await user.getIdToken();

// Use token in API calls
const response = await fetch('/api/workflows', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 🌐 Core API Endpoints

### Workflows

#### Create Workflow
Create a new workflow using visual builder or natural language.

```http
POST /api/v1/workflows
```

**Request Body:**
```json
{
  "name": "GitHub Analysis Workflow",
  "description": "Analyze GitHub repositories with AI",
  "creation_method": "chat|visual",
  "chat_prompt": "Analyze GitHub repos with Claude",
  "nodes": [
    {
      "id": "node_1",
      "type": "github",
      "position": { "x": 100, "y": 100 },
      "data": {
        "action": "get_repository",
        "config": {
          "repository_url": "{{input.repo_url}}"
        }
      }
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workflow_id": "wf_1234567890",
    "name": "GitHub Analysis Workflow",
    "status": "draft",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "nodes": [...],
    "edges": [...]
  }
}
```

#### List Workflows
Retrieve all workflows for the authenticated user.

```http
GET /api/v1/workflows
```

**Query Parameters:**
- `status` (optional): Filter by status (`draft`, `active`, `archived`)
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset
- `search` (optional): Search by name or description

**Response:**
```json
{
  "success": true,
  "data": {
    "workflows": [
      {
        "workflow_id": "wf_1234567890",
        "name": "GitHub Analysis Workflow",
        "description": "Analyze GitHub repositories with AI",
        "status": "active",
        "created_at": "2024-01-15T10:30:00Z",
        "last_executed": "2024-01-15T14:20:00Z",
        "execution_count": 15,
        "success_rate": 0.93
      }
    ],
    "pagination": {
      "total": 42,
      "limit": 50,
      "offset": 0,
      "has_more": false
    }
  }
}
```

#### Get Workflow
Retrieve a specific workflow by ID.

```http
GET /api/v1/workflows/{workflow_id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workflow_id": "wf_1234567890",
    "name": "GitHub Analysis Workflow",
    "description": "Analyze GitHub repositories with AI",
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "nodes": [
      {
        "id": "node_1",
        "type": "github",
        "position": { "x": 100, "y": 100 },
        "data": {
          "label": "GitHub Repository",
          "action": "get_repository",
          "config": {
            "repository_url": "{{input.repo_url}}",
            "include_readme": true,
            "include_issues": false
          }
        }
      },
      {
        "id": "node_2", 
        "type": "claude",
        "position": { "x": 300, "y": 100 },
        "data": {
          "label": "Claude Analysis",
          "model": "claude-3-5-sonnet-20241022",
          "config": {
            "system_prompt": "You are a code analyst...",
            "user_prompt": "Analyze this repository: {{node_1.output}}",
            "temperature": 0.7,
            "max_tokens": 1000
          }
        }
      }
    ],
    "edges": [
      {
        "id": "edge_1",
        "source": "node_1", 
        "target": "node_2"
      }
    ],
    "metadata": {
      "execution_count": 15,
      "success_rate": 0.93,
      "avg_execution_time": 12.5,
      "last_executed": "2024-01-15T14:20:00Z"
    }
  }
}
```

#### Update Workflow
Update an existing workflow.

```http
PUT /api/v1/workflows/{workflow_id}
```

**Request Body:**
```json
{
  "name": "Updated Workflow Name",
  "description": "Updated description",
  "nodes": [...],
  "edges": [...]
}
```

#### Delete Workflow
Delete a workflow permanently.

```http
DELETE /api/v1/workflows/{workflow_id}
```

**Response:**
```json
{
  "success": true,
  "message": "Workflow deleted successfully"
}
```

### Workflow Execution

#### Execute Workflow
Execute a workflow with provided inputs.

```http
POST /api/v1/workflows/{workflow_id}/execute
```

**Request Body:**
```json
{
  "inputs": {
    "repo_url": "https://github.com/microsoft/vscode",
    "email_recipient": "user@example.com"
  },
  "execution_options": {
    "timeout_seconds": 300,
    "retry_failed_nodes": true,
    "save_intermediate_results": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "execution_id": "exec_1234567890",
    "workflow_id": "wf_1234567890", 
    "status": "running",
    "started_at": "2024-01-15T14:20:00Z",
    "inputs": {
      "repo_url": "https://github.com/microsoft/vscode",
      "email_recipient": "user@example.com"
    },
    "progress": {
      "total_nodes": 3,
      "completed_nodes": 1,
      "current_node": "node_2",
      "progress_percentage": 33.33
    }
  }
}
```

#### Get Execution Status
Check the status of a running execution.

```http
GET /api/v1/executions/{execution_id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "execution_id": "exec_1234567890",
    "workflow_id": "wf_1234567890",
    "status": "completed",
    "started_at": "2024-01-15T14:20:00Z",
    "completed_at": "2024-01-15T14:20:45Z",
    "execution_time_ms": 45000,
    "node_results": {
      "node_1": {
        "status": "completed",
        "output": {
          "repository_name": "vscode",
          "description": "Visual Studio Code",
          "readme_content": "# Visual Studio Code..."
        },
        "execution_time_ms": 2000
      },
      "node_2": {
        "status": "completed", 
        "output": {
          "analysis": "This repository contains the Visual Studio Code...",
          "key_features": ["IntelliSense", "Debugging", "Extensions"]
        },
        "execution_time_ms": 15000
      }
    },
    "final_output": {
      "analysis": "This repository contains the Visual Studio Code...",
      "summary": "VSCode is a powerful, extensible code editor..."
    },
    "metadata": {
      "total_tokens_used": 1250,
      "total_cost_usd": 0.025,
      "ai_provider_usage": {
        "anthropic": {
          "tokens": 1250,
          "cost": 0.025
        }
      }
    }
  }
}
```

#### List Executions
Get execution history for a workflow.

```http
GET /api/v1/workflows/{workflow_id}/executions
```

**Query Parameters:**
- `status` (optional): Filter by status (`running`, `completed`, `failed`)
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "executions": [
      {
        "execution_id": "exec_1234567890",
        "status": "completed",
        "started_at": "2024-01-15T14:20:00Z",
        "completed_at": "2024-01-15T14:20:45Z",
        "execution_time_ms": 45000,
        "success": true,
        "cost_usd": 0.025
      }
    ],
    "pagination": {
      "total": 15,
      "limit": 20,
      "offset": 0,
      "has_more": false
    }
  }
}
```

### Node Management

#### Get Available Node Types
List all available node types and their configurations.

```http
GET /api/v1/nodes/types
```

**Response:**
```json
{
  "success": true,
  "data": {
    "node_types": [
      {
        "type": "claude",
        "name": "Claude AI",
        "category": "ai",
        "description": "Anthropic Claude AI models",
        "icon": "brain",
        "inputs": [
          {
            "name": "prompt",
            "type": "string",
            "required": true,
            "description": "Input prompt for the AI"
          }
        ],
        "outputs": [
          {
            "name": "response",
            "type": "string", 
            "description": "AI generated response"
          }
        ],
        "config_schema": {
          "model": {
            "type": "select",
            "options": ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229"],
            "default": "claude-3-5-sonnet-20241022"
          },
          "temperature": {
            "type": "number",
            "min": 0,
            "max": 1,
            "default": 0.7
          },
          "max_tokens": {
            "type": "number",
            "min": 1,
            "max": 4096,
            "default": 1000
          }
        }
      }
    ]
  }
}
```

#### Get Node Configuration
Get configuration details for a specific node type.

```http
GET /api/v1/nodes/types/{node_type}
```

### AI Chat Integration

#### Chat with AI (Workflow Creation)
Use natural language to create workflows.

```http
POST /api/v1/chat/create-workflow
```

**Request Body:**
```json
{
  "message": "Create a workflow that monitors GitHub issues and sends Slack notifications",
  "context": {
    "existing_workflows": [],
    "user_preferences": {
      "default_ai_provider": "anthropic",
      "notification_email": "user@example.com"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workflow_suggestion": {
      "name": "GitHub Issue Monitor",
      "description": "Monitor GitHub issues and send Slack notifications",
      "nodes": [...],
      "edges": [...],
      "reasoning": "I've created a workflow with 3 nodes: GitHub webhook trigger, issue analyzer, and Slack notifier."
    },
    "clarifying_questions": [
      "Which GitHub repository should be monitored?",
      "What types of issues should trigger notifications?",
      "Which Slack channel should receive the notifications?"
    ],
    "conversation_id": "chat_1234567890"
  }
}
```

#### Continue Chat Conversation
Continue the workflow creation conversation.

```http
POST /api/v1/chat/{conversation_id}/continue
```

**Request Body:**
```json
{
  "message": "Monitor the 'bugs' and 'enhancement' labels in the microsoft/vscode repository",
  "answers": {
    "repository": "microsoft/vscode",
    "labels": ["bugs", "enhancement"],
    "slack_channel": "#dev-notifications"
  }
}
```

### Tools and Integrations

#### List Available Tools
Get all available tools for workflow nodes.

```http
GET /api/v1/tools
```

**Query Parameters:**
- `category` (optional): Filter by category (`scraping`, `ai`, `communication`)
- `provider` (optional): Filter by provider (`system`, `community`)

**Response:**
```json
{
  "success": true,
  "data": {
    "tools": [
      {
        "id": "firecrawl_scraper",
        "name": "Firecrawl Web Scraper",
        "description": "Scrape and extract content from web pages",
        "category": "scraping",
        "provider": "system",
        "version": "1.0.0",
        "rating": 4.8,
        "parameters": [
          {
            "name": "url",
            "type": "string",
            "required": true,
            "description": "URL to scrape"
          }
        ],
        "cost": 0.02,
        "documentation": "https://docs.firecrawl.dev"
      }
    ]
  }
}
```

#### Get Tool Details
Get detailed information about a specific tool.

```http
GET /api/v1/tools/{tool_id}
```

### Deployment and APIs

#### Deploy Workflow as API
Convert a workflow into a publicly accessible API endpoint.

```http
POST /api/v1/workflows/{workflow_id}/deploy
```

**Request Body:**
```json
{
  "deployment_name": "github-analyzer",
  "description": "API to analyze GitHub repositories",
  "public": false,
  "rate_limit": {
    "requests_per_minute": 60,
    "requests_per_hour": 1000
  },
  "authentication": {
    "required": true,
    "api_key_required": false
  },
  "custom_domain": "api.mycompany.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deployment_id": "deploy_1234567890",
    "workflow_id": "wf_1234567890",
    "endpoint_url": "https://api.zigsaw.dev/deployed/github-analyzer",
    "api_documentation": "https://api.zigsaw.dev/deployed/github-analyzer/docs",
    "created_at": "2024-01-15T15:00:00Z",
    "status": "active"
  }
}
```

#### List Deployments
Get all API deployments for the user.

```http
GET /api/v1/deployments
```

#### Execute Deployed Workflow
Execute a deployed workflow via its public API.

```http
POST /api/deployed/{deployment_name}/execute
```

**Headers:**
```http
Authorization: Bearer <api_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "repo_url": "https://github.com/microsoft/vscode",
  "analysis_type": "comprehensive"
}
```

## 📊 Analytics and Monitoring

### Workflow Analytics

#### Get Workflow Statistics
Get performance statistics for a workflow.

```http
GET /api/v1/workflows/{workflow_id}/analytics
```

**Query Parameters:**
- `start_date`: Start date for statistics (ISO 8601)
- `end_date`: End date for statistics (ISO 8601)
- `granularity`: Data granularity (`hour`, `day`, `week`, `month`)

**Response:**
```json
{
  "success": true,
  "data": {
    "execution_count": 150,
    "success_rate": 0.94,
    "avg_execution_time_ms": 12500,
    "total_cost_usd": 3.75,
    "error_distribution": {
      "timeout": 5,
      "api_error": 3,
      "configuration_error": 1
    },
    "performance_over_time": [
      {
        "date": "2024-01-15",
        "executions": 25,
        "avg_time_ms": 11000,
        "success_rate": 0.96
      }
    ]
  }
}
```

### User Analytics

#### Get User Statistics
Get overall usage statistics for the authenticated user.

```http
GET /api/v1/analytics/user
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_workflows": 12,
    "total_executions": 450,
    "total_cost_usd": 15.75,
    "monthly_usage": {
      "executions": 150,
      "cost_usd": 3.75,
      "api_calls": 1200
    },
    "most_used_nodes": [
      {"type": "claude", "count": 8},
      {"type": "github", "count": 6},
      {"type": "email", "count": 5}
    ],
    "success_rate": 0.93
  }
}
```

## 🔧 Administration (Enterprise)

### User Management

#### List Users (Admin Only)
```http
GET /api/v1/admin/users
```

#### Get User Details (Admin Only)
```http
GET /api/v1/admin/users/{user_id}
```

### System Health

#### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T16:00:00Z",
  "services": {
    "database": "healthy",
    "ai_providers": {
      "anthropic": "healthy",
      "openai": "healthy",
      "google": "degraded"
    },
    "external_services": {
      "github": "healthy",
      "gmail": "healthy"
    }
  },
  "version": "2.0.0"
}
```

## 📝 Webhook Integration

### Workflow Webhooks
Set up webhooks to trigger workflows from external events.

#### Create Webhook
```http
POST /api/v1/webhooks
```

**Request Body:**
```json
{
  "workflow_id": "wf_1234567890",
  "name": "GitHub PR Webhook",
  "events": ["pull_request.opened", "pull_request.synchronize"],
  "source": "github",
  "config": {
    "secret": "webhook_secret_key",
    "repository": "microsoft/vscode"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "webhook_id": "hook_1234567890",
    "webhook_url": "https://api.zigsaw.dev/webhooks/hook_1234567890",
    "secret": "webhook_secret_key",
    "created_at": "2024-01-15T16:30:00Z"
  }
}
```

## 🚨 Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid auth token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid workflow configuration",
    "details": {
      "field": "nodes[0].config.model",
      "reason": "Invalid model specified"
    },
    "request_id": "req_1234567890"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Request validation failed
- `AUTHENTICATION_ERROR` - Invalid or expired auth token
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `WORKFLOW_EXECUTION_ERROR` - Workflow execution failed
- `AI_PROVIDER_ERROR` - AI service unavailable or error
- `EXTERNAL_SERVICE_ERROR` - External service integration error

## 🔄 Rate Limits

### Standard Limits
- **API Requests**: 1000 per hour per user
- **Workflow Executions**: 100 per hour per user
- **Chat Messages**: 50 per hour per user
- **Webhooks**: 500 per hour per webhook

### Enterprise Limits
- **API Requests**: 10,000 per hour per user
- **Workflow Executions**: 1,000 per hour per user
- **Chat Messages**: 500 per hour per user
- **Custom Rate Limits**: Available on request

## 🔌 SDKs and Client Libraries

### JavaScript/TypeScript SDK
```bash
npm install @zigsaw/sdk
```

```javascript
import { ZigsawClient } from '@zigsaw/sdk';

const client = new ZigsawClient({
  apiKey: 'your_api_key',
  baseURL: 'https://api.zigsaw.dev'
});

// Create workflow
const workflow = await client.workflows.create({
  name: 'My Workflow',
  nodes: [...],
  edges: [...]
});

// Execute workflow
const execution = await client.workflows.execute(workflow.id, {
  inputs: { key: 'value' }
});
```

### Python SDK
```bash
pip install zigsaw-python
```

```python
from zigsaw import ZigsawClient

client = ZigsawClient(
    api_key="your_api_key",
    base_url="https://api.zigsaw.dev"
)

# Create workflow
workflow = client.workflows.create({
    "name": "My Workflow",
    "nodes": [...],
    "edges": [...]
})

# Execute workflow
execution = client.workflows.execute(
    workflow["workflow_id"],
    inputs={"key": "value"}
)
```

## 📖 Additional Resources

- **Interactive API Explorer**: [api.zigsaw.dev/docs](https://api.zigsaw.dev/docs)
- **Postman Collection**: [Download Collection](https://zigsaw.dev/postman)
- **OpenAPI Specification**: [api.zigsaw.dev/openapi.json](https://api.zigsaw.dev/openapi.json)
- **Status Page**: [status.zigsaw.dev](https://status.zigsaw.dev)

---

This API reference covers all available endpoints and their usage. For real-time testing, visit our [Interactive API Explorer](https://api.zigsaw.dev/docs) or download our [Postman Collection](https://zigsaw.dev/postman).

*Need help? Contact us at [api-support@zigsaw.dev](mailto:api-support@zigsaw.dev)*
