"""
GitHub service for handling GitHub API operations
"""
import httpx
import json
import base64
from typing import Dict, List, Any, Optional, Union
import asyncio
from datetime import datetime

from ..models.github_models import (
    GitHubCredentials, GitHubAuthType, GitHubOperation,
    GitHubConnectionResponse, GitHubOperationResponse,
    GitHubStats, CreatePullRequestData, CreateIssueData,
    CreateReviewData, TriggerWorkflowData, FileOperationData
)


class GitHubService:
    """Service for GitHub API operations"""
    
    def __init__(self):
        self.connections: Dict[str, Dict[str, Any]] = {}
        self.rate_limits: Dict[str, Dict[str, Any]] = {}
    
    async def connect(self, node_id: str, credentials: GitHubCredentials) -> GitHubConnectionResponse:
        """Connect to GitHub API and validate credentials"""
        try:
            headers = await self._get_auth_headers(credentials)
            
            async with httpx.AsyncClient() as client:
                # Test connection by getting user info
                response = await client.get(
                    f"{credentials.base_url}/user",
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    user_info = response.json()
                    rate_limit = self._extract_rate_limit(response.headers)
                    
                    # Store connection
                    self.connections[node_id] = {
                        "credentials": credentials,
                        "headers": headers,
                        "user_info": user_info,
                        "connected_at": datetime.now().isoformat()
                    }
                    self.rate_limits[node_id] = rate_limit
                    
                    return GitHubConnectionResponse(
                        success=True,
                        message=f"Successfully connected to GitHub as {user_info.get('login', 'Unknown')}",
                        node_id=node_id,
                        user_info=user_info,
                        rate_limit=rate_limit
                    )
                else:
                    error_detail = response.text
                    return GitHubConnectionResponse(
                        success=False,
                        message=f"Failed to connect to GitHub: {response.status_code} - {error_detail}",
                        node_id=node_id
                    )
                    
        except Exception as e:
            return GitHubConnectionResponse(
                success=False,
                message=f"Failed to connect to GitHub: {str(e)}",
                node_id=node_id
            )
    
    async def disconnect(self, node_id: str) -> bool:
        """Disconnect from GitHub API"""
        if node_id in self.connections:
            del self.connections[node_id]
        if node_id in self.rate_limits:
            del self.rate_limits[node_id]
        return True
    
    def is_connected(self, node_id: str) -> bool:
        """Check if node is connected to GitHub"""
        return node_id in self.connections
    
    async def get_stats(self, node_id: str) -> Optional[GitHubStats]:
        """Get GitHub statistics for connected user"""
        if not self.is_connected(node_id):
            return None
        
        try:
            connection = self.connections[node_id]
            headers = connection["headers"]
            base_url = connection["credentials"].base_url
            
            async with httpx.AsyncClient() as client:
                # Get repositories
                repos_response = await client.get(
                    f"{base_url}/user/repos?per_page=100",
                    headers=headers,
                    timeout=30.0
                )
                
                repos = repos_response.json() if repos_response.status_code == 200 else []
                
                # Calculate stats
                total_stars = sum(repo.get('stargazers_count', 0) for repo in repos)
                total_forks = sum(repo.get('forks_count', 0) for repo in repos)
                
                # Get issues and PRs (simplified - you might want to paginate for accuracy)
                issues_response = await client.get(
                    f"{base_url}/issues?state=open&per_page=100",
                    headers=headers,
                    timeout=30.0
                )
                
                issues = issues_response.json() if issues_response.status_code == 200 else []
                open_issues = len([issue for issue in issues if not issue.get('pull_request')])
                open_prs = len([issue for issue in issues if issue.get('pull_request')])
                
                return GitHubStats(
                    repositories_count=len(repos),
                    total_stars=total_stars,
                    total_forks=total_forks,
                    open_issues=open_issues,
                    open_pull_requests=open_prs,
                    workflow_runs_count=0  # Would need additional API calls
                )
                
        except Exception as e:
            print(f"Error getting GitHub stats: {str(e)}")
            return None
    
    async def execute_operation(self, node_id: str, operation: GitHubOperation, 
                              parameters: Dict[str, Any], repository: Optional[str] = None) -> GitHubOperationResponse:
        """Execute a GitHub operation"""
        if not self.is_connected(node_id):
            return GitHubOperationResponse(
                success=False,
                message="Not connected to GitHub",
                operation=operation
            )
        
        try:
            connection = self.connections[node_id]
            headers = connection["headers"]
            base_url = connection["credentials"].base_url
            
            # Route to appropriate operation handler
            result = await self._handle_operation(operation, parameters, repository, headers, base_url)
            
            return GitHubOperationResponse(
                success=True,
                message=f"Successfully executed {operation}",
                operation=operation,
                data=result.get("data"),
                metadata=result.get("metadata"),
                rate_limit=self.rate_limits.get(node_id)
            )
            
        except Exception as e:
            return GitHubOperationResponse(
                success=False,
                message=f"Failed to execute {operation}: {str(e)}",
                operation=operation
            )
    
    async def _handle_operation(self, operation: GitHubOperation, parameters: Dict[str, Any], 
                               repository: Optional[str], headers: Dict[str, str], base_url: str) -> Dict[str, Any]:
        """Handle specific GitHub operations"""
        
        async with httpx.AsyncClient() as client:
            
            # Repository operations
            if operation == GitHubOperation.LIST_REPOSITORIES:
                response = await client.get(f"{base_url}/user/repos", headers=headers)
                return {"data": response.json()}
            
            elif operation == GitHubOperation.GET_REPOSITORY:
                if not repository:
                    raise ValueError("Repository parameter is required")
                response = await client.get(f"{base_url}/repos/{repository}", headers=headers)
                return {"data": response.json()}
            
            elif operation == GitHubOperation.GET_REPOSITORY_CONTENT:
                if not repository:
                    raise ValueError("Repository parameter is required")
                path = parameters.get("path", "")
                response = await client.get(f"{base_url}/repos/{repository}/contents/{path}", headers=headers)
                return {"data": response.json()}
            
            # Branch operations
            elif operation == GitHubOperation.LIST_BRANCHES:
                if not repository:
                    raise ValueError("Repository parameter is required")
                response = await client.get(f"{base_url}/repos/{repository}/branches", headers=headers)
                return {"data": response.json()}
            
            elif operation == GitHubOperation.CREATE_BRANCH:
                if not repository:
                    raise ValueError("Repository parameter is required")
                branch_name = parameters.get("name")
                source_branch = parameters.get("source", "main")
                
                # Get source branch SHA
                source_response = await client.get(f"{base_url}/repos/{repository}/git/refs/heads/{source_branch}", headers=headers)
                source_sha = source_response.json()["object"]["sha"]
                
                # Create new branch
                response = await client.post(
                    f"{base_url}/repos/{repository}/git/refs",
                    headers=headers,
                    json={
                        "ref": f"refs/heads/{branch_name}",
                        "sha": source_sha
                    }
                )
                return {"data": response.json()}
            
            # Pull Request operations
            elif operation == GitHubOperation.LIST_PULL_REQUESTS:
                if not repository:
                    raise ValueError("Repository parameter is required")
                state = parameters.get("state", "open")
                response = await client.get(f"{base_url}/repos/{repository}/pulls?state={state}", headers=headers)
                return {"data": response.json()}
            
            elif operation == GitHubOperation.CREATE_PULL_REQUEST:
                if not repository:
                    raise ValueError("Repository parameter is required")
                pr_data = CreatePullRequestData(**parameters)
                response = await client.post(
                    f"{base_url}/repos/{repository}/pulls",
                    headers=headers,
                    json=pr_data.dict()
                )
                return {"data": response.json()}
            
            elif operation == GitHubOperation.MERGE_PULL_REQUEST:
                if not repository:
                    raise ValueError("Repository parameter is required")
                pr_number = parameters.get("pull_number")
                merge_method = parameters.get("merge_method", "merge")
                response = await client.put(
                    f"{base_url}/repos/{repository}/pulls/{pr_number}/merge",
                    headers=headers,
                    json={"merge_method": merge_method}
                )
                return {"data": response.json()}
            
            # Issue operations
            elif operation == GitHubOperation.LIST_ISSUES:
                if not repository:
                    raise ValueError("Repository parameter is required")
                state = parameters.get("state", "open")
                response = await client.get(f"{base_url}/repos/{repository}/issues?state={state}", headers=headers)
                return {"data": response.json()}
            
            elif operation == GitHubOperation.CREATE_ISSUE:
                if not repository:
                    raise ValueError("Repository parameter is required")
                issue_data = CreateIssueData(**parameters)
                response = await client.post(
                    f"{base_url}/repos/{repository}/issues",
                    headers=headers,
                    json=issue_data.dict()
                )
                return {"data": response.json()}
            
            # Review operations
            elif operation == GitHubOperation.CREATE_REVIEW:
                if not repository:
                    raise ValueError("Repository parameter is required")
                review_data = CreateReviewData(**parameters)
                response = await client.post(
                    f"{base_url}/repos/{repository}/pulls/{review_data.pull_number}/reviews",
                    headers=headers,
                    json=review_data.dict(exclude={"pull_number"})
                )
                return {"data": response.json()}
            
            # Workflow operations
            elif operation == GitHubOperation.LIST_WORKFLOWS:
                if not repository:
                    raise ValueError("Repository parameter is required")
                response = await client.get(f"{base_url}/repos/{repository}/actions/workflows", headers=headers)
                return {"data": response.json()}
            
            elif operation == GitHubOperation.TRIGGER_WORKFLOW:
                if not repository:
                    raise ValueError("Repository parameter is required")
                workflow_data = TriggerWorkflowData(**parameters)
                response = await client.post(
                    f"{base_url}/repos/{repository}/actions/workflows/{workflow_data.workflow_id}/dispatches",
                    headers=headers,
                    json={
                        "ref": workflow_data.ref,
                        "inputs": workflow_data.inputs
                    }
                )
                return {"data": {"message": "Workflow triggered successfully"}}
            
            elif operation == GitHubOperation.GET_WORKFLOW_RUNS:
                if not repository:
                    raise ValueError("Repository parameter is required")
                response = await client.get(f"{base_url}/repos/{repository}/actions/runs", headers=headers)
                return {"data": response.json()}
            
            # File operations
            elif operation == GitHubOperation.CREATE_FILE:
                if not repository:
                    raise ValueError("Repository parameter is required")
                file_data = FileOperationData(**parameters)
                content_encoded = base64.b64encode(file_data.content.encode()).decode()
                response = await client.put(
                    f"{base_url}/repos/{repository}/contents/{file_data.path}",
                    headers=headers,
                    json={
                        "message": file_data.message,
                        "content": content_encoded,
                        "branch": file_data.branch
                    }
                )
                return {"data": response.json()}
            
            elif operation == GitHubOperation.UPDATE_FILE:
                if not repository:
                    raise ValueError("Repository parameter is required")
                file_data = FileOperationData(**parameters)
                content_encoded = base64.b64encode(file_data.content.encode()).decode()
                response = await client.put(
                    f"{base_url}/repos/{repository}/contents/{file_data.path}",
                    headers=headers,
                    json={
                        "message": file_data.message,
                        "content": content_encoded,
                        "sha": file_data.sha,
                        "branch": file_data.branch
                    }
                )
                return {"data": response.json()}
            
            elif operation == GitHubOperation.GET_FILE:
                if not repository:
                    raise ValueError("Repository parameter is required")
                path = parameters.get("path")
                response = await client.get(f"{base_url}/repos/{repository}/contents/{path}", headers=headers)
                return {"data": response.json()}
            
            else:
                raise ValueError(f"Unsupported operation: {operation}")
    
    async def _get_auth_headers(self, credentials: GitHubCredentials) -> Dict[str, str]:
        """Get authentication headers based on credentials type"""
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AgentOps-Flow-Forge"
        }
        
        if credentials.auth_type == GitHubAuthType.PERSONAL_ACCESS_TOKEN:
            headers["Authorization"] = f"token {credentials.token}"
        elif credentials.auth_type == GitHubAuthType.GITHUB_APP:
            # For GitHub Apps, you'd need to generate a JWT and get an installation token
            # This is simplified - in production you'd implement proper GitHub App auth
            headers["Authorization"] = f"Bearer {credentials.token}"
        elif credentials.auth_type == GitHubAuthType.OAUTH:
            headers["Authorization"] = f"token {credentials.token}"
        
        return headers
    
    def _extract_rate_limit(self, headers: Dict[str, str]) -> Dict[str, Any]:
        """Extract rate limit information from response headers"""
        return {
            "limit": int(headers.get("X-RateLimit-Limit", 0)),
            "remaining": int(headers.get("X-RateLimit-Remaining", 0)),
            "reset": int(headers.get("X-RateLimit-Reset", 0)),
            "used": int(headers.get("X-RateLimit-Used", 0))
        }


# Global service instance
github_service = GitHubService() 