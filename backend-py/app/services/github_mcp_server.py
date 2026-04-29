"""
GitHub MCP Server Implementation
Exposes GitHub operations as MCP tools and resources for Claude Code integration
"""
import json
import asyncio
import base64
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import httpx

from ..models.github_models import (
    GitHubCredentials, GitHubOperation, GitHubAuthType,
    CreatePullRequestData, CreateReviewData, FileOperationData
)


class GitHubMCPServer:
    """MCP Server for GitHub operations"""
    
    def __init__(self):
        self.connections: Dict[str, Dict[str, Any]] = {}
        self.tools: Dict[str, Dict[str, Any]] = {}
        self.resources: Dict[str, Dict[str, Any]] = {}
        self._initialize_mcp_tools()
        self._initialize_mcp_resources()
    
    def _initialize_mcp_tools(self):
        """Initialize MCP tool definitions for GitHub operations"""
        self.tools = {
            "github_list_repositories": {
                "name": "github_list_repositories",
                "description": "List repositories accessible to the authenticated user",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "type": {"type": "string", "enum": ["all", "owner", "member"], "default": "all"},
                        "sort": {"type": "string", "enum": ["created", "updated", "pushed", "full_name"], "default": "updated"},
                        "per_page": {"type": "integer", "minimum": 1, "maximum": 100, "default": 30}
                    }
                }
            },
            "github_get_repository": {
                "name": "github_get_repository",
                "description": "Get detailed information about a specific repository",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "owner": {"type": "string", "description": "Repository owner username"},
                        "repo": {"type": "string", "description": "Repository name"}
                    },
                    "required": ["owner", "repo"]
                }
            },
            "github_create_pull_request": {
                "name": "github_create_pull_request",
                "description": "Create a new pull request",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "owner": {"type": "string", "description": "Repository owner"},
                        "repo": {"type": "string", "description": "Repository name"},
                        "title": {"type": "string", "description": "PR title"},
                        "body": {"type": "string", "description": "PR description"},
                        "head": {"type": "string", "description": "Source branch"},
                        "base": {"type": "string", "description": "Target branch", "default": "main"},
                        "draft": {"type": "boolean", "description": "Create as draft PR", "default": False}
                    },
                    "required": ["owner", "repo", "title", "head"]
                }
            },
            "github_list_pull_requests": {
                "name": "github_list_pull_requests",
                "description": "List pull requests for a repository",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "owner": {"type": "string", "description": "Repository owner"},
                        "repo": {"type": "string", "description": "Repository name"},
                        "state": {"type": "string", "enum": ["open", "closed", "all"], "default": "open"},
                        "sort": {"type": "string", "enum": ["created", "updated", "popularity"], "default": "created"},
                        "direction": {"type": "string", "enum": ["asc", "desc"], "default": "desc"}
                    },
                    "required": ["owner", "repo"]
                }
            },
            "github_create_review": {
                "name": "github_create_review",
                "description": "Create a review for a pull request",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "owner": {"type": "string", "description": "Repository owner"},
                        "repo": {"type": "string", "description": "Repository name"},
                        "pull_number": {"type": "integer", "description": "PR number"},
                        "body": {"type": "string", "description": "Review comment"},
                        "event": {"type": "string", "enum": ["APPROVE", "REQUEST_CHANGES", "COMMENT"], "default": "COMMENT"},
                        "comments": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "path": {"type": "string"},
                                    "line": {"type": "integer"},
                                    "body": {"type": "string"}
                                },
                                "required": ["path", "line", "body"]
                            }
                        }
                    },
                    "required": ["owner", "repo", "pull_number"]
                }
            },
            "github_get_file_content": {
                "name": "github_get_file_content",
                "description": "Get the content of a file from a repository",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "owner": {"type": "string", "description": "Repository owner"},
                        "repo": {"type": "string", "description": "Repository name"},
                        "path": {"type": "string", "description": "File path"},
                        "ref": {"type": "string", "description": "Branch, tag, or commit SHA", "default": "main"}
                    },
                    "required": ["owner", "repo", "path"]
                }
            },
            "github_create_or_update_file": {
                "name": "github_create_or_update_file",
                "description": "Create or update a file in a repository",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "owner": {"type": "string", "description": "Repository owner"},
                        "repo": {"type": "string", "description": "Repository name"},
                        "path": {"type": "string", "description": "File path"},
                        "content": {"type": "string", "description": "File content"},
                        "message": {"type": "string", "description": "Commit message"},
                        "branch": {"type": "string", "description": "Branch name", "default": "main"},
                        "sha": {"type": "string", "description": "File SHA (required for updates)"}
                    },
                    "required": ["owner", "repo", "path", "content", "message"]
                }
            },
            "github_create_branch": {
                "name": "github_create_branch",
                "description": "Create a new branch from an existing branch",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "owner": {"type": "string", "description": "Repository owner"},
                        "repo": {"type": "string", "description": "Repository name"},
                        "branch_name": {"type": "string", "description": "New branch name"},
                        "source_branch": {"type": "string", "description": "Source branch", "default": "main"}
                    },
                    "required": ["owner", "repo", "branch_name"]
                }
            },
            "github_list_issues": {
                "name": "github_list_issues",
                "description": "List issues for a repository",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "owner": {"type": "string", "description": "Repository owner"},
                        "repo": {"type": "string", "description": "Repository name"},
                        "state": {"type": "string", "enum": ["open", "closed", "all"], "default": "open"},
                        "labels": {"type": "string", "description": "Comma-separated list of labels"},
                        "assignee": {"type": "string", "description": "Filter by assignee"}
                    },
                    "required": ["owner", "repo"]
                }
            },
            "github_get_repository_structure": {
                "name": "github_get_repository_structure",
                "description": "Get the directory structure of a repository",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "owner": {"type": "string", "description": "Repository owner"},
                        "repo": {"type": "string", "description": "Repository name"},
                        "path": {"type": "string", "description": "Directory path", "default": ""},
                        "ref": {"type": "string", "description": "Branch, tag, or commit SHA", "default": "main"}
                    },
                    "required": ["owner", "repo"]
                }
            }
        }
    
    def _initialize_mcp_resources(self):
        """Initialize MCP resource definitions for GitHub data"""
        self.resources = {
            "github_repository": {
                "name": "github_repository",
                "description": "Access to repository information and metadata",
                "mimeType": "application/json"
            },
            "github_pull_requests": {
                "name": "github_pull_requests",
                "description": "Collection of pull requests for a repository",
                "mimeType": "application/json"
            },
            "github_issues": {
                "name": "github_issues",
                "description": "Collection of issues for a repository",
                "mimeType": "application/json"
            },
            "github_file_content": {
                "name": "github_file_content",
                "description": "Content of files in a repository",
                "mimeType": "text/plain"
            },
            "github_repository_structure": {
                "name": "github_repository_structure",
                "description": "Directory structure and file tree of a repository",
                "mimeType": "application/json"
            }
        }
    
    async def connect(self, node_id: str, credentials: GitHubCredentials) -> Dict[str, Any]:
        """Connect to GitHub API with provided credentials"""
        try:
            headers = self._build_headers(credentials)
            
            async with httpx.AsyncClient() as client:
                # Test connection by getting user info
                response = await client.get(
                    f"{credentials.base_url}/user",
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    user_info = response.json()
                    
                    # Store connection
                    self.connections[node_id] = {
                        "credentials": credentials,
                        "headers": headers,
                        "user_info": user_info,
                        "connected_at": datetime.utcnow().isoformat(),
                        "rate_limit": self._extract_rate_limit(response.headers)
                    }
                    
                    return {
                        "success": True,
                        "message": f"Connected to GitHub as {user_info.get('login')}",
                        "user_info": user_info,
                        "tools_available": len(self.tools),
                        "resources_available": len(self.resources)
                    }
                else:
                    return {
                        "success": False,
                        "message": f"Authentication failed: {response.status_code}",
                        "error": response.text
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "message": f"Connection failed: {str(e)}",
                "error": str(e)
            }
    
    async def execute_tool(self, node_id: str, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a GitHub MCP tool"""
        if node_id not in self.connections:
            return {
                "success": False,
                "error": "Not connected to GitHub. Please connect first."
            }
        
        if tool_name not in self.tools:
            return {
                "success": False,
                "error": f"Unknown tool: {tool_name}"
            }
        
        connection = self.connections[node_id]
        headers = connection["headers"]
        base_url = connection["credentials"].base_url
        
        try:
            if tool_name == "github_list_repositories":
                return await self._list_repositories(headers, base_url, arguments)
            elif tool_name == "github_get_repository":
                return await self._get_repository(headers, base_url, arguments)
            elif tool_name == "github_create_pull_request":
                return await self._create_pull_request(headers, base_url, arguments)
            elif tool_name == "github_list_pull_requests":
                return await self._list_pull_requests(headers, base_url, arguments)
            elif tool_name == "github_create_review":
                return await self._create_review(headers, base_url, arguments)
            elif tool_name == "github_get_file_content":
                return await self._get_file_content(headers, base_url, arguments)
            elif tool_name == "github_create_or_update_file":
                return await self._create_or_update_file(headers, base_url, arguments)
            elif tool_name == "github_create_branch":
                return await self._create_branch(headers, base_url, arguments)
            elif tool_name == "github_list_issues":
                return await self._list_issues(headers, base_url, arguments)
            elif tool_name == "github_get_repository_structure":
                return await self._get_repository_structure(headers, base_url, arguments)
            else:
                return {
                    "success": False,
                    "error": f"Tool {tool_name} not implemented"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Tool execution failed: {str(e)}",
                "tool": tool_name,
                "arguments": arguments
            }
    
    async def get_resource(self, node_id: str, resource_uri: str) -> Dict[str, Any]:
        """Get a GitHub MCP resource"""
        if node_id not in self.connections:
            return {
                "success": False,
                "error": "Not connected to GitHub"
            }
        
        # Parse resource URI (e.g., "github_repository://owner/repo")
        try:
            if resource_uri.startswith("github_repository://"):
                repo_path = resource_uri.replace("github_repository://", "")
                owner, repo = repo_path.split("/", 1)
                return await self.execute_tool(node_id, "github_get_repository", {"owner": owner, "repo": repo})
            
            elif resource_uri.startswith("github_file_content://"):
                file_path = resource_uri.replace("github_file_content://", "")
                parts = file_path.split("/", 2)
                if len(parts) >= 3:
                    owner, repo, path = parts[0], parts[1], parts[2]
                    return await self.execute_tool(node_id, "github_get_file_content", {"owner": owner, "repo": repo, "path": path})
            
            # Add more resource handlers as needed
            
            return {
                "success": False,
                "error": f"Unknown resource URI: {resource_uri}"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Resource access failed: {str(e)}"
            }
    
    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        """Get all available MCP tool definitions"""
        return list(self.tools.values())
    
    def get_resource_definitions(self) -> List[Dict[str, Any]]:
        """Get all available MCP resource definitions"""
        return list(self.resources.values())
    
    def is_connected(self, node_id: str) -> bool:
        """Check if node is connected to GitHub"""
        return node_id in self.connections
    
    def disconnect(self, node_id: str) -> bool:
        """Disconnect from GitHub"""
        if node_id in self.connections:
            del self.connections[node_id]
            return True
        return False
    
    # Private helper methods for tool implementations
    
    def _build_headers(self, credentials: GitHubCredentials) -> Dict[str, str]:
        """Build HTTP headers for GitHub API requests"""
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "AgentOps-GitHub-MCP/1.0"
        }
        
        if credentials.auth_type == GitHubAuthType.PERSONAL_ACCESS_TOKEN:
            headers["Authorization"] = f"Bearer {credentials.token}"
        # Add other auth types as needed
        
        return headers
    
    def _extract_rate_limit(self, headers: Dict[str, str]) -> Dict[str, Any]:
        """Extract rate limit information from response headers"""
        return {
            "limit": headers.get("X-RateLimit-Limit"),
            "remaining": headers.get("X-RateLimit-Remaining"),
            "reset": headers.get("X-RateLimit-Reset"),
            "used": headers.get("X-RateLimit-Used")
        }
    
    async def _list_repositories(self, headers: Dict[str, str], base_url: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """List repositories"""
        params = {
            "type": args.get("type", "all"),
            "sort": args.get("sort", "updated"),
            "per_page": args.get("per_page", 30)
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/user/repos", headers=headers, params=params, timeout=30.0)
            
            if response.status_code == 200:
                repositories = response.json()
                return {
                    "success": True,
                    "data": repositories,
                    "count": len(repositories),
                    "rate_limit": self._extract_rate_limit(response.headers)
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to list repositories: {response.status_code}",
                    "message": response.text
                }
    
    async def _get_repository(self, headers: Dict[str, str], base_url: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Get repository details"""
        owner = args["owner"]
        repo = args["repo"]
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/repos/{owner}/{repo}", headers=headers, timeout=30.0)
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "data": response.json(),
                    "rate_limit": self._extract_rate_limit(response.headers)
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to get repository: {response.status_code}",
                    "message": response.text
                }
    
    async def _create_pull_request(self, headers: Dict[str, str], base_url: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Create a pull request"""
        owner = args["owner"]
        repo = args["repo"]
        
        pr_data = {
            "title": args["title"],
            "body": args.get("body", ""),
            "head": args["head"],
            "base": args.get("base", "main"),
            "draft": args.get("draft", False)
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}/repos/{owner}/{repo}/pulls",
                headers=headers,
                json=pr_data,
                timeout=30.0
            )
            
            if response.status_code == 201:
                return {
                    "success": True,
                    "data": response.json(),
                    "pr_number": response.json().get("number"),
                    "pr_url": response.json().get("html_url"),
                    "rate_limit": self._extract_rate_limit(response.headers)
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to create PR: {response.status_code}",
                    "message": response.text
                }
    
    async def _list_pull_requests(self, headers: Dict[str, str], base_url: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """List pull requests"""
        owner = args["owner"]
        repo = args["repo"]
        
        params = {
            "state": args.get("state", "open"),
            "sort": args.get("sort", "created"),
            "direction": args.get("direction", "desc")
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{base_url}/repos/{owner}/{repo}/pulls",
                headers=headers,
                params=params,
                timeout=30.0
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "data": response.json(),
                    "count": len(response.json()),
                    "rate_limit": self._extract_rate_limit(response.headers)
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to list PRs: {response.status_code}",
                    "message": response.text
                }
    
    async def _create_review(self, headers: Dict[str, str], base_url: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Create a pull request review"""
        owner = args["owner"]
        repo = args["repo"]
        pull_number = args["pull_number"]
        
        review_data = {
            "body": args.get("body", ""),
            "event": args.get("event", "COMMENT"),
            "comments": args.get("comments", [])
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}/repos/{owner}/{repo}/pulls/{pull_number}/reviews",
                headers=headers,
                json=review_data,
                timeout=30.0
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "data": response.json(),
                    "review_id": response.json().get("id"),
                    "rate_limit": self._extract_rate_limit(response.headers)
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to create review: {response.status_code}",
                    "message": response.text
                }
    
    async def _get_file_content(self, headers: Dict[str, str], base_url: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Get file content from repository"""
        owner = args["owner"]
        repo = args["repo"]
        path = args["path"]
        ref = args.get("ref", "main")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{base_url}/repos/{owner}/{repo}/contents/{path}?ref={ref}",
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code == 200:
                file_data = response.json()
                if file_data.get("encoding") == "base64":
                    content = base64.b64decode(file_data["content"]).decode("utf-8")
                else:
                    content = file_data.get("content", "")
                
                return {
                    "success": True,
                    "data": {
                        "content": content,
                        "sha": file_data.get("sha"),
                        "size": file_data.get("size"),
                        "path": file_data.get("path"),
                        "type": file_data.get("type")
                    },
                    "rate_limit": self._extract_rate_limit(response.headers)
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to get file: {response.status_code}",
                    "message": response.text
                }
    
    async def _create_or_update_file(self, headers: Dict[str, str], base_url: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update a file in repository"""
        owner = args["owner"]
        repo = args["repo"]
        path = args["path"]
        
        content_encoded = base64.b64encode(args["content"].encode()).decode()
        
        file_data = {
            "message": args["message"],
            "content": content_encoded,
            "branch": args.get("branch", "main")
        }
        
        if "sha" in args:
            file_data["sha"] = args["sha"]
        
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{base_url}/repos/{owner}/{repo}/contents/{path}",
                headers=headers,
                json=file_data,
                timeout=30.0
            )
            
            if response.status_code in [200, 201]:
                return {
                    "success": True,
                    "data": response.json(),
                    "commit_sha": response.json().get("commit", {}).get("sha"),
                    "rate_limit": self._extract_rate_limit(response.headers)
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to create/update file: {response.status_code}",
                    "message": response.text
                }
    
    async def _create_branch(self, headers: Dict[str, str], base_url: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new branch"""
        owner = args["owner"]
        repo = args["repo"]
        branch_name = args["branch_name"]
        source_branch = args.get("source_branch", "main")
        
        # Get source branch SHA
        async with httpx.AsyncClient() as client:
            source_response = await client.get(
                f"{base_url}/repos/{owner}/{repo}/git/refs/heads/{source_branch}",
                headers=headers,
                timeout=30.0
            )
            
            if source_response.status_code != 200:
                return {
                    "success": False,
                    "error": f"Failed to get source branch: {source_response.status_code}",
                    "message": source_response.text
                }
            
            source_sha = source_response.json()["object"]["sha"]
            
            # Create new branch
            branch_data = {
                "ref": f"refs/heads/{branch_name}",
                "sha": source_sha
            }
            
            response = await client.post(
                f"{base_url}/repos/{owner}/{repo}/git/refs",
                headers=headers,
                json=branch_data,
                timeout=30.0
            )
            
            if response.status_code == 201:
                return {
                    "success": True,
                    "data": response.json(),
                    "branch_name": branch_name,
                    "sha": source_sha,
                    "rate_limit": self._extract_rate_limit(response.headers)
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to create branch: {response.status_code}",
                    "message": response.text
                }
    
    async def _list_issues(self, headers: Dict[str, str], base_url: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """List issues for a repository"""
        owner = args["owner"]
        repo = args["repo"]
        
        params = {
            "state": args.get("state", "open")
        }
        
        if "labels" in args:
            params["labels"] = args["labels"]
        if "assignee" in args:
            params["assignee"] = args["assignee"]
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{base_url}/repos/{owner}/{repo}/issues",
                headers=headers,
                params=params,
                timeout=30.0
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "data": response.json(),
                    "count": len(response.json()),
                    "rate_limit": self._extract_rate_limit(response.headers)
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to list issues: {response.status_code}",
                    "message": response.text
                }
    
    async def _get_repository_structure(self, headers: Dict[str, str], base_url: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Get repository directory structure"""
        owner = args["owner"]
        repo = args["repo"]
        path = args.get("path", "")
        ref = args.get("ref", "main")
        
        params = {"ref": ref}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{base_url}/repos/{owner}/{repo}/contents/{path}",
                headers=headers,
                params=params,
                timeout=30.0
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "data": response.json(),
                    "path": path,
                    "ref": ref,
                    "rate_limit": self._extract_rate_limit(response.headers)
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to get repository structure: {response.status_code}",
                    "message": response.text
                }


# Global instance
github_mcp_server = GitHubMCPServer() 