# 🚀 Zigsaw Quick Start Guide - Get Running in 10 Minutes

## Overview
Zigsaw is the first platform where you can **chat your way to automation**. Create powerful AI-driven workflows using natural language or visual drag-and-drop interface. This guide will have you building your first workflow in under 10 minutes.

## ⚡ Prerequisites (2 minutes)

### System Requirements
- **Node.js 18+** and npm
- **Python 3.12+** (for backend)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)
- **Internet connection** for AI providers

### Account Setup
1. **Firebase Project**: Create at [console.firebase.google.com](https://console.firebase.google.com)
2. **AI Provider Keys** (choose at least one):
   - [Anthropic Claude](https://console.anthropic.com/) - Recommended
   - [OpenAI GPT](https://platform.openai.com/)
   - [Google Gemini](https://makersuite.google.com/)
   - [Groq](https://console.groq.com/)

## 🛠️ Installation (3 minutes)

### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/your-org/zigsaw.git
cd zigsaw

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../api-backend
npm install
```

### 2. Environment Configuration
```bash
# Frontend environment
cd frontend
cp .env.example .env

# Edit frontend/.env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_API_BASE_URL=http://localhost:3001

# Optional: Add AI provider keys for client-side usage
VITE_ANTHROPIC_API_KEY=your_claude_key
VITE_OPENAI_API_KEY=your_openai_key
```

```bash
# Backend environment  
cd ../api-backend
cp .env.example .env

# Edit api-backend/.env
# AI Provider Keys
ANTHROPIC_API_KEY=your_claude_key
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_key
GROQ_API_KEY=your_groq_key

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/firebase-admin-key.json

# Optional: External services
GITHUB_TOKEN=your_github_token
FIRECRAWL_API_KEY=your_firecrawl_key
```

## 🎬 First Workflow - Chat Creation (2 minutes)

### Method 1: Natural Language Creation (Easiest)

1. **Start the Platform**
```bash
# Terminal 1 - Backend
cd api-backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

2. **Open Zigsaw**
   - Navigate to `http://localhost:3000`
   - Sign up/Login with your email

3. **Create Your First Workflow**
   - Click **"Chat with AI"** button
   - Type your automation request:
   ```
   "Create a workflow that takes a GitHub repository URL, 
   uses Claude to analyze the README file, and sends me 
   an email summary of what the project does"
   ```

4. **Review & Deploy**
   - AI generates the workflow with 3 nodes:
     - GitHub Repository Reader
     - Claude Analysis Node  
     - Email Sender Node
   - Review the connections
   - Click **"Deploy Workflow"**

### Method 2: Visual Builder (More Control)

1. **Open Workflow Editor**
   - Click **"Create New Workflow"**
   - Choose **"Visual Builder"**

2. **Add Nodes** (Drag from sidebar):
   - **GitHub Node**: For repository operations
   - **Claude Node**: For AI analysis
   - **Email Node**: For notifications

3. **Connect Nodes**:
   - Drag from GitHub output → Claude input
   - Drag from Claude output → Email input

4. **Configure Each Node**:
   - **GitHub**: Set repository URL
   - **Claude**: Add analysis prompt
   - **Email**: Set recipient and template

## 🧪 Test Your Workflow (2 minutes)

### Quick Test
1. **Click "Test Workflow"**
2. **Provide Test Input**:
   ```json
   {
     "repository_url": "https://github.com/microsoft/vscode",
     "email_recipient": "your-email@example.com"
   }
   ```

3. **Monitor Execution**:
   - Watch real-time progress
   - See output from each node
   - Check your email for results

### Debug Common Issues
- **API Key Errors**: Verify keys in .env files
- **Network Errors**: Check internet connection
- **Auth Errors**: Confirm Firebase configuration
- **Node Failures**: Check node configuration

## 🌟 Next Steps (1 minute)

### Explore Pre-built Templates
```bash
# Available workflow templates:
- GitHub PR Automation
- Content Generation Pipeline  
- Customer Support Automation
- Data Processing Workflows
- Social Media Management
```

### Add More Integrations
- **Slack**: Team notifications
- **Google Calendar**: Event automation
- **Salesforce**: CRM integration
- **Notion**: Knowledge management

### Deploy as API
```bash
# Turn any workflow into a REST API
POST /api/workflows/deploy
{
  "workflow_id": "your_workflow_id",
  "deployment_name": "github-analyzer",
  "public": false
}

# Access via generated endpoint
POST /api/deployed/github-analyzer/execute
```

## 🎯 Common Use Cases (Bonus)

### Business Automation
```
📧 Email → AI Classification → CRM Update → Team Notification
📋 Form Submission → AI Processing → Database Save → Confirmation
📊 Data Export → AI Analysis → Report Generation → Distribution
```

### Developer Workflows  
```
🔄 GitHub PR → Code Review (AI) → Auto-merge → Deployment
🐛 Issue → AI Categorization → Team Assignment → Progress Tracking
📈 Performance Data → AI Analysis → Alert → Dashboard Update
```

### Content & Marketing
```
📰 RSS Feed → AI Summarization → Multi-platform Publishing
🎯 Lead Capture → AI Qualification → CRM → Follow-up Sequence
📱 Social Mention → Sentiment Analysis → Response → Engagement
```

## 🆘 Need Help?

### Quick Solutions
- **Stuck on setup?** Check our [Troubleshooting Guide](./TROUBLESHOOTING.md)
- **Want examples?** Browse [Workflow Templates](../workflow-examples/)
- **API questions?** See [API Reference](../api-reference/)
- **Best practices?** Read [Optimization Guide](../best-practices/)

### Support Channels
- 📚 **Documentation**: [docs.zigsaw.dev](https://docs.zigsaw.dev)
- 💬 **Community Forum**: [community.zigsaw.dev](https://community.zigsaw.dev)
- 🐙 **GitHub Issues**: Report bugs and feature requests
- 📧 **Email Support**: support@zigsaw.dev

## ✅ Success Checklist

- [ ] Platform installed and running
- [ ] First workflow created (chat or visual)
- [ ] Test execution completed successfully
- [ ] Received email with analysis results
- [ ] Explored at least one workflow template
- [ ] Workflow deployed as API (optional)

**Congratulations! 🎉** You've successfully created your first AI-powered workflow with Zigsaw. You're now ready to automate complex tasks using natural language or visual builders.

---

**What's Next?**
- Explore [50+ Workflow Examples](../workflow-examples/)
- Learn [Advanced Configurations](../best-practices/)
- Join our [Community](https://community.zigsaw.dev) to share your workflows

*Built with ❤️ for the automation community*
