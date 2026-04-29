"""
Configuration settings for AgentOps Flow Forge Backend
"""
from pydantic_settings import BaseSettings
from typing import Optional, List
import secrets
import os


class Settings(BaseSettings):
    # API Settings
    app_name: str = "AgentOps Flow Forge API"
    version: str = "1.0.0"
    description: str = "Backend API for AgentOps Flow Forge - GraphRAG and AI Workflow Management"
    
    # Server Settings
    host: str = "0.0.0.0"
    port: int = int(os.getenv("PORT", "8000"))  # Use PORT env var or default to 8000
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    reload: bool = os.getenv("RELOAD", "false").lower() == "true"
    
    # CORS Settings
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:8082",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:8082",
        "https://zigsaw.dev",
        "https://zigsaw-backend-jet.vercel.app",
        "https://*.vercel.app"
    ]
    
    # Database Settings (placeholder - Neo4j removed)
    # default_database_uri: Optional[str] = None
    
    # Connection Pool Settings
    max_connection_pool_size: int = 50
    connection_acquisition_timeout: int = 10000

    # AI Provider Settings
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    replicate_api_key: Optional[str] = None

    # GitHub Integration
    github_pat: Optional[str] = None
    github_owner: Optional[str] = None
    github_repo: Optional[str] = None

    # Firecrawl Integration
    firecrawl_api_key: Optional[str] = "fc-7578a68f054f419dbc1eee9ea570fe39"

    # Google OAuth Settings
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_redirect_uri: Optional[str] = None

    # Mastra Settings
    mastra_debug: bool = False
    mastra_log_level: str = "INFO"              
    mastra_port: int = 3001

    # Agent Configuration
    agent_name: str = "GitHub_Automator"
    agent_model: str = "claude-3-5-sonnet-20241022"
    agent_max_tokens: int = 4096
    agent_temperature: float = 0.1

    # Workflow Settings
    workflow_timeout: int = 300
    max_retries: int = 3
    retry_delay: int = 2

    # Testing Settings
    test_mode: bool = False
    dry_run: bool = False
    
    # Security Settings
    secret_key: str = secrets.token_urlsafe(32)  # Generate a random secret key if not provided
    jwt_secret: Optional[str] = None
    enable_https: bool = False
    session_cookie_secure: bool = False  # Set to True in production
    session_cookie_httponly: bool = True
    session_cookie_samesite: str = "lax"
    session_max_age: int = 3600  # 1 hour
    
    # CORS Security Settings
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    cors_allow_headers: List[str] = [
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRF-Token"
    ]
    cors_expose_headers: List[str] = ["X-Total-Count"]
    cors_max_age: int = 86400  # 24 hours
    
    # Rate Limiting
    rate_limit_requests_per_minute: int = 300  # Increased for dashboard polling
    rate_limit_burst: int = 50
    
    # API Key Management
    enable_file_storage: bool = False
    data_dir: str = "./data"
    encryption_key: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # This will ignore any unknown environment variables


# Global settings instance
settings = Settings() 