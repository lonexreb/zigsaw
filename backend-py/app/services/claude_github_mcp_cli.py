#!/usr/bin/env python3
import subprocess
import sys
import json
import asyncio
import anthropic
from mcp.server import Server
from mcp.types import Tool, TextContent
import mcp.server.stdio
from claude_code_sdk import query, ClaudeCodeOptions
from pathlib import Path
import os
import requests
from datetime import datetime

# Configuration — secrets must come from environment, never hardcoded.
# (Two leaked keys from the source repo were redacted at port time and have
# been rotated. See commit history for details.)
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
GITHUB_PAT = os.environ.get("GITHUB_PAT", "")
if not ANTHROPIC_API_KEY:
    raise RuntimeError("ANTHROPIC_API_KEY is required.")
if not GITHUB_PAT:
    raise RuntimeError("GITHUB_PAT is required.")
GITHUB_API_BASE = "https://api.github.com"
REPOSITORY_NAME = os.environ.get("GITHUB_REPOSITORY_NAME", "")
CLONE_DIRECTORY = os.environ.get("GITHUB_CLONE_DIRECTORY", "./temp")
GITHUB_USERNAME = os.environ.get("GITHUB_USERNAME", "")
DEFAULT_REPO_URL = f"https://github.com/{GITHUB_USERNAME}/{REPOSITORY_NAME}.git"

# MCP Server
server = Server("github-mcp")

def run_git_command(command, cwd=None):
    """Helper function to run git commands with default cwd"""
    if cwd is None:
        cwd = CLONE_DIRECTORY
    try:
        result = subprocess.run(command, capture_output=True, text=True, cwd=cwd, shell=True)
        return result.stdout, result.stderr, result.returncode
    except Exception as e:
        return "", str(e), 1

def github_api_request(endpoint, method="GET", data=None):
    """Helper function for GitHub API requests"""
    headers = {
        "Authorization": f"token {GITHUB_PAT}",
        "Accept": "application/vnd.github.v3+json"
    }
    url = f"{GITHUB_API_BASE}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        
        return response.json() if response.content else {}, response.status_code
    except Exception as e:
        return {"error": str(e)}, 500

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="clone_repo",
            description="Clone the default GitHub repository to ./temp (or specify custom repo)",
            inputSchema={
                "type": "object",
                "properties": {
                    "repo_url": {"type": "string", "default": DEFAULT_REPO_URL, "description": "Repository URL (defaults to hardcoded repo)"},
                    "clone_dir": {"type": "string", "default": CLONE_DIRECTORY, "description": "Directory to clone to (defaults to ./temp)"}
                }
            }
        ),
        Tool(
            name="push_repo",
            description="Push local changes from ./temp to GitHub repository",
            inputSchema={
                "type": "object",
                "properties": {
                    "commit_message": {"type": "string", "description": "Commit message"},
                    "branch": {"type": "string", "default": "main", "description": "Branch to push to"}
                },
                "required": ["commit_message"]
            }
        ),
        Tool(
            name="create_repo",
            description="Create a new GitHub repository under the configured username",
            inputSchema={
                "type": "object",
                "properties": {
                    "repo_name": {"type": "string", "description": "Repository name"},
                    "description": {"type": "string", "default": "", "description": "Repository description"},
                    "private": {"type": "boolean", "default": False, "description": "Make repository private"},
                    "initialize": {"type": "boolean", "default": True, "description": "Initialize with README"}
                },
                "required": ["repo_name"]
            }
        ),
        Tool(
            name="list_repos",
            description="List repositories for the configured GitHub user",
            inputSchema={
                "type": "object",
                "properties": {
                    "type": {"type": "string", "enum": ["all", "owner", "public", "private"], "default": "owner"},
                    "sort": {"type": "string", "enum": ["created", "updated", "pushed", "full_name"], "default": "updated"},
                    "per_page": {"type": "integer", "default": 30, "maximum": 100}
                }
            }
        ),
        Tool(
            name="create_branch",
            description="Create a new branch in ./temp repository",
            inputSchema={
                "type": "object",
                "properties": {
                    "branch_name": {"type": "string", "description": "Name of the new branch"},
                    "from_branch": {"type": "string", "default": "main", "description": "Branch to create from"}
                },
                "required": ["branch_name"]
            }
        ),
        Tool(
            name="switch_branch",
            description="Switch to a different branch in ./temp repository",
            inputSchema={
                "type": "object",
                "properties": {
                    "branch_name": {"type": "string", "description": "Branch name to switch to"}
                },
                "required": ["branch_name"]
            }
        ),
        Tool(
            name="git_status",
            description="Check git status of ./temp repository",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="create_pull_request",
            description="Create a pull request on the configured GitHub repository",
            inputSchema={
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Pull request title"},
                    "body": {"type": "string", "default": "", "description": "Pull request body"},
                    "head": {"type": "string", "description": "Branch to merge from"},
                    "base": {"type": "string", "default": "main", "description": "Branch to merge into"}
                },
                "required": ["title", "head"]
            }
        ),
        Tool(
            name="list_issues",
            description="List issues from the configured GitHub repository",
            inputSchema={
                "type": "object",
                "properties": {
                    "state": {"type": "string", "enum": ["open", "closed", "all"], "default": "open"},
                    "per_page": {"type": "integer", "default": 30, "maximum": 100}
                }
            }
        ),
        Tool(
            name="create_issue",
            description="Create a new issue on the configured GitHub repository",
            inputSchema={
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Issue title"},
                    "body": {"type": "string", "default": "", "description": "Issue body"},
                    "labels": {"type": "array", "items": {"type": "string"}, "default": [], "description": "Issue labels"}
                },
                "required": ["title"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "clone_repo":
        repo_url = arguments.get("repo_url", DEFAULT_REPO_URL)
        clone_dir = arguments.get("clone_dir", CLONE_DIRECTORY)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(os.path.abspath(clone_dir)), exist_ok=True)
        
        auth_url = repo_url.replace("https://", f"https://{GITHUB_PAT}@")
        stdout, stderr, returncode = run_git_command(f"git clone {auth_url} {clone_dir}")
        
        status = "Success" if returncode == 0 else "Failed"
        return [TextContent(type="text", text=f"{status}: Cloned {repo_url} to {clone_dir}\n{stdout}{stderr}")]

    elif name == "push_repo":
        commit_message = arguments["commit_message"]
        branch = arguments.get("branch", "main")
        repo_dir = CLONE_DIRECTORY
        
        # Ensure we're in the right directory and it exists
        if not os.path.exists(repo_dir):
            return [TextContent(type="text", text=f"Failed: Directory {repo_dir} does not exist. Clone repository first.")]
        
        # Add all changes
        stdout1, stderr1, code1 = run_git_command("git add .", cwd=repo_dir)
        
        # Commit changes
        stdout2, stderr2, code2 = run_git_command(f'git commit -m "{commit_message}"', cwd=repo_dir)
        
        # Push to remote
        stdout3, stderr3, code3 = run_git_command(f"git push origin {branch}", cwd=repo_dir)
        
        result = f"Add: {stdout1}{stderr1}\nCommit: {stdout2}{stderr2}\nPush: {stdout3}{stderr3}"
        status = "Success" if code3 == 0 else "Failed"
        return [TextContent(type="text", text=f"{status}: Pushed changes to {branch}\n{result}")]

    elif name == "create_repo":
        repo_name = arguments["repo_name"]
        description = arguments.get("description", "")
        private = arguments.get("private", False)
        initialize = arguments.get("initialize", True)
        
        data = {
            "name": repo_name,
            "description": description,
            "private": private,
            "auto_init": initialize
        }
        
        response, status_code = github_api_request("/user/repos", "POST", data)
        
        if status_code == 201:
            return [TextContent(type="text", text=f"Success: Created repository {repo_name}\nURL: {response.get('html_url', 'N/A')}")]
        else:
            return [TextContent(type="text", text=f"Failed: {response.get('message', 'Unknown error')}")]

    elif name == "list_repos":
        repo_type = arguments.get("type", "owner")
        sort = arguments.get("sort", "updated")
        per_page = arguments.get("per_page", 30)
        
        endpoint = f"/user/repos?type={repo_type}&sort={sort}&per_page={per_page}"
        response, status_code = github_api_request(endpoint)
        
        if status_code == 200:
            repos = [f"- {repo['name']} ({repo['html_url']}) - {repo.get('description', 'No description')}" 
                    for repo in response]
            return [TextContent(type="text", text=f"Repositories for {GITHUB_USERNAME}:\n" + "\n".join(repos))]
        else:
            return [TextContent(type="text", text=f"Failed: {response.get('message', 'Unknown error')}")]

    elif name == "create_branch":
        branch_name = arguments["branch_name"]
        from_branch = arguments.get("from_branch", "main")
        repo_dir = CLONE_DIRECTORY
        
        if not os.path.exists(repo_dir):
            return [TextContent(type="text", text=f"Failed: Directory {repo_dir} does not exist. Clone repository first.")]
        
        # Switch to base branch first
        stdout1, stderr1, code1 = run_git_command(f"git checkout {from_branch}", cwd=repo_dir)
        
        # Create and switch to new branch
        stdout2, stderr2, code2 = run_git_command(f"git checkout -b {branch_name}", cwd=repo_dir)
        
        result = f"Switch to {from_branch}: {stdout1}{stderr1}\nCreate branch: {stdout2}{stderr2}"
        status = "Success" if code2 == 0 else "Failed"
        return [TextContent(type="text", text=f"{status}: Created branch {branch_name} in {repo_dir}\n{result}")]

    elif name == "switch_branch":
        branch_name = arguments["branch_name"]
        repo_dir = CLONE_DIRECTORY
        
        if not os.path.exists(repo_dir):
            return [TextContent(type="text", text=f"Failed: Directory {repo_dir} does not exist. Clone repository first.")]
        
        stdout, stderr, returncode = run_git_command(f"git checkout {branch_name}", cwd=repo_dir)
        
        status = "Success" if returncode == 0 else "Failed"
        return [TextContent(type="text", text=f"{status}: Switched to branch {branch_name} in {repo_dir}\n{stdout}{stderr}")]

    elif name == "git_status":
        repo_dir = CLONE_DIRECTORY
        
        if not os.path.exists(repo_dir):
            return [TextContent(type="text", text=f"Failed: Directory {repo_dir} does not exist. Clone repository first.")]
        
        stdout, stderr, returncode = run_git_command("git status", cwd=repo_dir)
        
        return [TextContent(type="text", text=f"Git Status for {repo_dir}:\n{stdout}{stderr}")]

    elif name == "create_pull_request":
        title = arguments["title"]
        body = arguments.get("body", "")
        head = arguments["head"]
        base = arguments.get("base", "main")
        
        data = {
            "title": title,
            "body": body,
            "head": head,
            "base": base
        }
        
        endpoint = f"/repos/{GITHUB_USERNAME}/{REPOSITORY_NAME}/pulls"
        response, status_code = github_api_request(endpoint, "POST", data)
        
        if status_code == 201:
            return [TextContent(type="text", text=f"Success: Created pull request #{response['number']} in {GITHUB_USERNAME}/{REPOSITORY_NAME}\nURL: {response['html_url']}")]
        else:
            return [TextContent(type="text", text=f"Failed: {response.get('message', 'Unknown error')}")]

    elif name == "list_issues":
        state = arguments.get("state", "open")
        per_page = arguments.get("per_page", 30)
        
        endpoint = f"/repos/{GITHUB_USERNAME}/{REPOSITORY_NAME}/issues?state={state}&per_page={per_page}"
        response, status_code = github_api_request(endpoint)
        
        if status_code == 200:
            issues = [f"#{issue['number']}: {issue['title']} ({issue['state']})" for issue in response]
            return [TextContent(type="text", text=f"Issues for {GITHUB_USERNAME}/{REPOSITORY_NAME}:\n" + "\n".join(issues))]
        else:
            return [TextContent(type="text", text=f"Failed: {response.get('message', 'Unknown error')}")]

    elif name == "create_issue":
        title = arguments["title"]
        body = arguments.get("body", "")
        labels = arguments.get("labels", [])
        
        data = {
            "title": title,
            "body": body,
            "labels": labels
        }
        
        endpoint = f"/repos/{GITHUB_USERNAME}/{REPOSITORY_NAME}/issues"
        response, status_code = github_api_request(endpoint, "POST", data)
        
        if status_code == 201:
            return [TextContent(type="text", text=f"Success: Created issue #{response['number']} in {GITHUB_USERNAME}/{REPOSITORY_NAME}\nURL: {response['html_url']}")]
        else:
            return [TextContent(type="text", text=f"Failed: {response.get('message', 'Unknown error')}")]

# Claude API Controller with updated tools
def ask_claude(user_request):
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    
    prompt = f"""
    User request: {user_request}
    
    You have access to GitHub tools that work with the default repository ({GITHUB_USERNAME}/{REPOSITORY_NAME}) 
    and local directory (./temp). All operations are pre-configured with these defaults.
    
    Available tools:
    - clone_repo() - Clone default repo to ./temp (or specify custom)
    - push_repo(commit_message, branch="main") - Push changes from ./temp
    - create_repo(repo_name, description="", private=False) - Create new repository
    - list_repos() - List user's repositories
    - create_branch(branch_name, from_branch="main") - Create branch in ./temp
    - switch_branch(branch_name) - Switch branch in ./temp
    - git_status() - Check status of ./temp repository
    - create_pull_request(title, head, body="", base="main") - Create PR
    - list_issues(state="open") - List issues from default repo
    - create_issue(title, body="", labels=[]) - Create issue in default repo
    
    Extract the appropriate parameters and use the relevant tool(s).
    """
    
    tools = [
        {
            "name": "clone_repo",
            "description": "Clone repository (defaults to configured repo and ./temp)",
            "input_schema": {
                "type": "object",
                "properties": {
                    "repo_url": {"type": "string"},
                    "clone_dir": {"type": "string"}
                }
            }
        },
        {
            "name": "push_repo",
            "description": "Push changes from ./temp to GitHub",
            "input_schema": {
                "type": "object",
                "properties": {
                    "commit_message": {"type": "string"},
                    "branch": {"type": "string"}
                },
                "required": ["commit_message"]
            }
        },
        {
            "name": "create_repo",
            "description": "Create new GitHub repository",
            "input_schema": {
                "type": "object",
                "properties": {
                    "repo_name": {"type": "string"},
                    "description": {"type": "string"},
                    "private": {"type": "boolean"}
                },
                "required": ["repo_name"]
            }
        },
        {
            "name": "list_repos",
            "description": "List user's repositories",
            "input_schema": {
                "type": "object",
                "properties": {
                    "type": {"type": "string"},
                    "sort": {"type": "string"}
                }
            }
        },
        {
            "name": "git_status",
            "description": "Check git status of ./temp",
            "input_schema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "create_branch",
            "description": "Create branch in ./temp",
            "input_schema": {
                "type": "object",
                "properties": {
                    "branch_name": {"type": "string"},
                    "from_branch": {"type": "string"}
                },
                "required": ["branch_name"]
            }
        }
    ]
    
    message = client.messages.create(
        model="claude-4-sonnet-20250514",
        max_tokens=1000,
        tools=tools,
        messages=[{"role": "user", "content": prompt}]
    )
    
    # Execute tool calls with simplified logic
    for content in message.content:
        if content.type == "tool_use":
            tool_name = content.name
            tool_input = content.input
            
            if tool_name == "clone_repo":
                repo_url = tool_input.get("repo_url", DEFAULT_REPO_URL)
                clone_dir = tool_input.get("clone_dir", CLONE_DIRECTORY)
                
                # Ensure directory exists
                os.makedirs(os.path.dirname(os.path.abspath(clone_dir)), exist_ok=True)
                
                auth_url = repo_url.replace("https://", f"https://{GITHUB_PAT}@")
                result = subprocess.run(["git", "clone", auth_url, clone_dir], capture_output=True, text=True)
                print(f"✅ Cloned {repo_url} to {clone_dir}")
                if result.stderr:
                    print(f"⚠️ Warning: {result.stderr}")
            
            elif tool_name == "push_repo":
                commit_message = tool_input["commit_message"]
                branch = tool_input.get("branch", "main")
                
                # Execute the enhanced push logic using the existing function
                def run_command(command, check=True, capture_output=False, cwd=None):
                    try:
                        if capture_output:
                            result = subprocess.run(command, shell=True, capture_output=True, text=True, cwd=cwd)
                            return result.stdout.strip() if result.returncode == 0 else None
                        else:
                            result = subprocess.run(command, shell=True, check=check, cwd=cwd)
                            return result.returncode == 0
                    except subprocess.CalledProcessError:
                        return False
                
                print("🚀 Starting GitHub push process...")
                target_dir = os.path.abspath(CLONE_DIRECTORY)
                
                if not os.path.exists(target_dir):
                    print(f"❌ Error: Directory '{target_dir}' does not exist. Clone repository first.")
                    continue
                
                print(f"📁 Working in directory: {target_dir}")

                if not os.path.exists(os.path.join(target_dir, '.git')):
                    print("❌ Error: Not a git repository.")
                    continue
                
                # Enhanced push logic here (similar to original but using target_dir)
                print("📝 Adding all changes to staging...")
                if not run_command("git add .", cwd=target_dir):
                    print("❌ Failed to add changes to staging")
                    continue
                
                has_changes = run_command("git diff --staged --quiet", check=False, cwd=target_dir)
                if has_changes:
                    print("ℹ️  No changes to commit.")
                else:
                    print("💾 Committing changes...")
                    if not run_command(f'git commit -m "{commit_message}"', cwd=target_dir):
                        print("❌ Failed to commit changes")
                        continue
                
                # Push logic
                current_branch = run_command("git branch --show-current", capture_output=True, cwd=target_dir)
                if not current_branch:
                    current_branch = branch
                
                print(f"📤 Pushing to branch: {current_branch}")
                
                if run_command(f"git push -u origin {current_branch}", check=False, cwd=target_dir):
                    print("✅ Successfully pushed to GitHub!")
                else:
                    print("❌ Push failed - check branch protection or permissions")
            
            # Add other simplified tool implementations
            elif tool_name == "create_repo":
                repo_name = tool_input["repo_name"]
                description = tool_input.get("description", "")
                private = tool_input.get("private", False)
                
                data = {
                    "name": repo_name,
                    "description": description,
                    "private": private,
                    "auto_init": True
                }
                
                response, status_code = github_api_request("/user/repos", "POST", data)
                
                if status_code == 201:
                    print(f"✅ Created repository {repo_name}")
                    print(f"🌐 URL: {response.get('html_url', 'N/A')}")
                else:
                    print(f"❌ Error creating repository: {response.get('message', 'Unknown error')}")
            
            elif tool_name == "list_repos":
                endpoint = "/user/repos?type=owner&sort=updated&per_page=30"
                response, status_code = github_api_request(endpoint)
                
                if status_code == 200:
                    print(f"📚 Repositories for {GITHUB_USERNAME}:")
                    for repo in response:
                        print(f"  - {repo['name']} - {repo.get('description', 'No description')}")
                else:
                    print(f"❌ Error listing repositories: {response.get('message', 'Unknown error')}")
            
            elif tool_name == "git_status":
                result = subprocess.run(["git", "status"], capture_output=True, text=True, cwd=CLONE_DIRECTORY)
                print(f"📊 Git Status for {CLONE_DIRECTORY}:")
                print(result.stdout)
                if result.stderr:
                    print(f"⚠️ Warning: {result.stderr}")
            
            elif tool_name == "create_branch":
                branch_name = tool_input["branch_name"]
                from_branch = tool_input.get("from_branch", "main")
                
                # Switch to base branch first
                subprocess.run(["git", "checkout", from_branch], cwd=CLONE_DIRECTORY)
                
                # Create and switch to new branch
                result = subprocess.run(["git", "checkout", "-b", branch_name], capture_output=True, text=True, cwd=CLONE_DIRECTORY)
                print(f"🌿 Created branch {branch_name} from {from_branch}")
                if result.stderr:
                    print(f"⚠️ Warning: {result.stderr}")

async def ask_claude_code(user_input):
    mcp_servers_config = {
        "github": {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-github"],
            "env": {
                "GITHUB_PERSONAL_ACCESS_TOKEN": GITHUB_PAT
            }
        }
    }
    options = ClaudeCodeOptions(
        max_turns=3,
        system_prompt=f"You are a helpful assistant with GitHub access. Default working directory is {CLONE_DIRECTORY}. Default repository is {GITHUB_USERNAME}/{REPOSITORY_NAME}. Always use these defaults unless specifically told otherwise.",
        cwd=Path(CLONE_DIRECTORY),
        allowed_tools=["Read", "Write", "Bash", "mcp__permissions__approve", "mcp__github"],
        mcp_servers=mcp_servers_config,
        permission_mode="bypassPermissions"
    )
    MAX_OUTPUT_SIZE = 10000
    
    try:
        async for message in query(prompt=user_input, options=options):
            try:
                msg_str = str(message)
                if len(msg_str) > MAX_OUTPUT_SIZE:
                    truncated = msg_str[:MAX_OUTPUT_SIZE]
                    print(f"{truncated}... [TRUNCATED - Original size: {len(msg_str)} chars]")
                else:
                    print(msg_str)
            except:
                print("[Large message could not be displayed]")
    except Exception as e:
        print(f"Query failed: {str(e)}")
        
def main_chat_loop():
    print(f"🤖 GitHub Assistant Ready!")
    print(f"📁 Default directory: {CLONE_DIRECTORY}")
    print(f"📦 Default repository: {GITHUB_USERNAME}/{REPOSITORY_NAME}")
    print(f"💬 Commands starting with '/' use Claude API, others use Claude Code")
    print(f"🚪 Type 'quit', 'exit', or 'q' to exit\n")
    
    while True:
        try:
            user_input = input("You: ").strip()
            
            if not user_input:
                continue
             
            if user_input.lower() in ['quit', 'exit', 'q']:
                print(f"🤖: Goodbye! Have a great day!")
                break
            
            elif user_input[0] == "/":
                print(f"🔍 Asking Claude: {user_input[1:]}")
                ask_claude(user_input[1:])
            
            else:
                print(f"⚡ Asking Claude Code: {user_input}")
                asyncio.run(ask_claude_code(user_input))
            
        except KeyboardInterrupt:
            print(f"\n🤖: Goodbye!")
            break
        except EOFError:
            print(f"\n🤖: Goodbye!")
            break

def main():
    if len(sys.argv) == 1:
        print("Starting Enhanced GitHub MCP Server...")
        asyncio.run(run_server())
    elif sys.argv[1] == "cli":
        # Auto-setup: Clone the repository if it doesn't exist
        if not os.path.exists(CLONE_DIRECTORY):
            print(f"🔄 Setting up default repository...")
            os.makedirs(os.path.dirname(os.path.abspath(CLONE_DIRECTORY)), exist_ok=True)
            auth_url = DEFAULT_REPO_URL.replace("https://", f"https://{GITHUB_PAT}@")
            result = subprocess.run(["git", "clone", auth_url, CLONE_DIRECTORY], capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ Cloned {REPOSITORY_NAME} to {CLONE_DIRECTORY}")
            else:
                print(f"⚠️ Could not clone repository: {result.stderr}")
        
        main_chat_loop()

async def run_server():
    async with mcp.server.stdio.stdio_server() as streams:
        await server.run(streams[0], streams[1], server.create_initialization_options())

if __name__ == "__main__":
    main()
