"""
GitHub models for the workflow system
"""
from pydantic import BaseModel
from typing import Dict, List, Any, Optional


class GitHubConfig(BaseModel):
    """Configuration for GitHub operations"""
    token: Optional[str] = None
    repository: Optional[str] = None
    owner: Optional[str] = None
    branch: Optional[str] = None


class GitHubExecutionResult(BaseModel):
    """Result from GitHub operation execution"""
    success: bool
    operation: str
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None