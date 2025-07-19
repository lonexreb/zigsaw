import React from 'react';
import { ClaudeGitHubPipelineNode } from './nodes/ClaudeGitHubPipelineNode';

export function TestClaudeGitHubPipelinePage() {
  const mockNodeData = {
    query: "analyze code quality in repo pobycoin-metadata"
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Claude GitHub Pipeline Test
          </h1>
          <p className="text-gray-600 mb-6">
            Test the 3-step pipeline integration: NLP Parsing → GitHub MCP → AI Analysis
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Instructions:</h3>
            <ol className="list-decimal list-inside text-blue-800 space-y-1">
              <li>Click "API Credentials" and enter your Anthropic API key and GitHub PAT</li>
              <li>Enter a GitHub query (e.g., "analyze code quality in repo username/repository-name")</li>
              <li>Click "Analyze" to run the complete 3-step pipeline</li>
              <li>Watch the progress and view results in the chat or details tabs</li>
            </ol>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Prerequisites:</h3>
            <ul className="list-disc list-inside text-yellow-800 space-y-1">
              <li>Backend server running on <code className="bg-yellow-100 px-1 rounded">http://localhost:8000</code></li>
              <li>Valid Anthropic API key (sk-ant-...)</li>
              <li>GitHub Personal Access Token (ghp_...)</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="relative">
            <ClaudeGitHubPipelineNode
              id="test-node"
              data={mockNodeData}
              selected={false}
            />
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">🎯 Example Queries</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded p-3">
              <code className="text-sm text-gray-700">
                analyze code quality in repo username/repository-name
              </code>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <code className="text-sm text-gray-700">
                check security vulnerabilities in my React project
              </code>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <code className="text-sm text-gray-700">
                review recent commits for best practices
              </code>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <code className="text-sm text-gray-700">
                suggest improvements for repository structure
              </code>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">🔗 API Endpoints</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">POST</span>
              <code className="text-gray-700">/api/pipeline/full</code>
              <span className="text-gray-500">- Complete 3-step pipeline</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">POST</span>
              <code className="text-gray-700">/api/pipeline/step1</code>
              <span className="text-gray-500">- NLP parsing only</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-mono">POST</span>
              <code className="text-gray-700">/api/pipeline/step2</code>
              <span className="text-gray-500">- GitHub MCP execution</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-mono">POST</span>
              <code className="text-gray-700">/api/pipeline/step3</code>
              <span className="text-gray-500">- AI analysis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 