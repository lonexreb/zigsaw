import Head from "next/head";
import { useState, useEffect } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import styles from "../src/styles/Home.module.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

// Matrix rain effect component
const MatrixRain = () => {
  const [matrixChars, setMatrixChars] = useState<string[]>([]);

  useEffect(() => {
    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
    const matrixArray = Array.from({ length: 50 }, () => 
      chars[Math.floor(Math.random() * chars.length)]
    );
    setMatrixChars(matrixArray);

    const interval = setInterval(() => {
      setMatrixChars(prev => 
        prev.map(() => chars[Math.floor(Math.random() * chars.length)])
      );
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.matrixRain}>
      {matrixChars.map((char, index) => (
        <span
          key={index}
          style={{
            animationDelay: `${index * 0.1}s`,
            left: `${(index % 10) * 10}%`,
            top: `${Math.floor(index / 10) * 20}%`,
          }}
        >
          {char}
        </span>
      ))}
    </div>
  );
};

// Real-time API Call Logger
const APICallLogger = () => {
  const [apiCalls, setApiCalls] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const fetchAPICalls = async () => {
      try {
        const response = await fetch('/api/logs', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          const data = await response.json();
          setApiCalls(data.logs || []);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Failed to fetch API calls:', error);
        setIsConnected(false);
      }
    };

    // Fetch every second for real-time updates
    const interval = setInterval(fetchAPICalls, 1000);
    fetchAPICalls(); // Initial fetch

    return () => clearInterval(interval);
  }, []);

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'var(--accent-blue)';
      case 'POST': return 'var(--matrix-green)';
      case 'PUT': return 'var(--accent-purple)';
      case 'DELETE': return '#ff4444';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className={styles.apiCallLogger}>
      <div className={styles.loggerHeader}>
        <h3>Real-time API Calls</h3>
        <div className={styles.connectionStatus}>
          <div className={`${styles.statusDot} ${isConnected ? styles.connected : styles.disconnected}`} />
          <span>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
        </div>
      </div>
      <div className={styles.logsContainer}>
        {apiCalls.length === 0 ? (
          <div className={styles.noLogs}>No API calls yet...</div>
        ) : (
          apiCalls.slice(-10).reverse().map((call, index) => (
            <div key={index} className={styles.logEntry}>
              <div className={styles.logHeader}>
                <span 
                  className={styles.logMethod}
                  style={{ color: getMethodColor(call.method) }}
                >
                  {call.method}
                </span>
                <span className={styles.logPath}>{call.path}</span>
                <span className={styles.logTime}>{new Date(call.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className={styles.logDetails}>
                <span>Status: {call.status}</span>
                <span>Duration: {call.duration}ms</span>
                {call.source && <span>Source: {call.source}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Test POST Button Component with Real Functionality
const TestPostButton = () => {
  const [isPressed, setIsPressed] = useState(false);
  const [lastPressed, setLastPressed] = useState<Date | null>(null);
  const [pressCount, setPressCount] = useState(0);
  const [frontendPresses, setFrontendPresses] = useState(0);
  const [lastFrontendPress, setLastFrontendPress] = useState<Date | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  // Poll for frontend test POST requests and API statistics
  useEffect(() => {
    const checkFrontendRequests = async () => {
      try {
        const response = await fetch('/api/workflow/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkFrontendRequests: true,
            timestamp: new Date().toISOString()
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.frontendRequests) {
            setFrontendPresses(data.frontendRequests.count);
            if (data.frontendRequests.lastRequest) {
              setLastFrontendPress(new Date(data.frontendRequests.lastRequest));
            }
          }
        }
      } catch (error) {
        console.error('Failed to check frontend requests:', error);
      }
    };

    // Check every 2 seconds
    const interval = setInterval(checkFrontendRequests, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleTestPost = async () => {
    setIsPressed(true);
    setLastPressed(new Date());
    setPressCount(prev => prev + 1);

    try {
      const startTime = Date.now();
      const response = await fetch('/api/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          source: 'backend-dashboard',
          testData: {
            nodes: [
              { id: 'test-node-1', type: 'universal_agent', data: { config: { model: 'claude-3-5-sonnet' } } },
              { id: 'test-node-2', type: 'groqllama', data: { config: { model: 'llama-3.1-8b-instant' } } }
            ],
            edges: [
              { id: 'test-edge-1', source: 'test-node-1', target: 'test-node-2' }
            ]
          }
        }),
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        setTestResults(prev => [...prev.slice(-4), {
          success: true,
          timestamp: new Date().toISOString(),
          duration,
          response: data
        }]);
        console.log('✅ Test POST successful from backend dashboard');
      } else {
        setTestResults(prev => [...prev.slice(-4), {
          success: false,
          timestamp: new Date().toISOString(),
          duration,
          error: `HTTP ${response.status}`
        }]);
      }
    } catch (error) {
      setTestResults(prev => [...prev.slice(-4), {
        success: false,
        timestamp: new Date().toISOString(),
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
      console.error('❌ Test POST failed:', error);
    }

    // Reset button state after 2 seconds
    setTimeout(() => setIsPressed(false), 2000);
  };

  return (
    <div className={styles.testPostSection}>
      <h3>Test POST Monitoring</h3>
      <div className={styles.testPostInfo}>
        <div className={styles.testPostStats}>
          <div className={styles.testPostStatGroup}>
            <h4>Backend Dashboard</h4>
            <span>Press Count: {pressCount}</span>
            {lastPressed && (
              <span>Last Pressed: {lastPressed.toLocaleTimeString()}</span>
            )}
          </div>
          <div className={styles.testPostStatGroup}>
            <h4>Frontend Requests</h4>
            <span>Press Count: {frontendPresses}</span>
            {lastFrontendPress && (
              <span>Last Pressed: {lastFrontendPress.toLocaleTimeString()}</span>
            )}
          </div>
        </div>
        <button 
          className={`${styles.testPostButton} ${isPressed ? styles.testPostButtonPressed : ''}`}
          onClick={handleTestPost}
          disabled={isPressed}
        >
          {isPressed ? 'POSTING...' : 'TEST POST'}
        </button>
      </div>
      
      {/* Test Results */}
      {testResults.length > 0 && (
        <div className={styles.testResults}>
          <h4>Recent Test Results</h4>
          <div className={styles.resultsList}>
            {testResults.map((result, index) => (
              <div key={index} className={`${styles.resultEntry} ${result.success ? styles.success : styles.error}`}>
                <div className={styles.resultHeader}>
                  <span>{result.success ? '✅' : '❌'}</span>
                  <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
                  <span>{result.duration}ms</span>
                </div>
                {result.error && <div className={styles.resultError}>{result.error}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Dashboard stats component with real data
const DashboardStats = () => {
  const [stats, setStats] = useState({
    requests: 0,
    users: 0,
    uptime: 0,
    performance: 0,
    workflows: 0,
    nodes: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    const interval = setInterval(fetchStats, 5000);
    fetchStats(); // Initial fetch

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <h3>Requests/min</h3>
        <div className={styles.statValue}>{stats.requests}</div>
        <div className={styles.statBar}>
          <div 
            className={styles.statBarFill} 
            style={{ width: `${(stats.requests / 1000) * 100}%` }}
          />
        </div>
      </div>
      <div className={styles.statCard}>
        <h3>Active Users</h3>
        <div className={styles.statValue}>{stats.users}</div>
        <div className={styles.statBar}>
          <div 
            className={styles.statBarFill} 
            style={{ width: `${(stats.users / 100) * 100}%` }}
          />
        </div>
      </div>
      <div className={styles.statCard}>
        <h3>Active Workflows</h3>
        <div className={styles.statValue}>{stats.workflows}</div>
        <div className={styles.statBar}>
          <div 
            className={styles.statBarFill} 
            style={{ width: `${(stats.workflows / 20) * 100}%` }}
          />
        </div>
      </div>
      <div className={styles.statCard}>
        <h3>Running Nodes</h3>
        <div className={styles.statValue}>{stats.nodes}</div>
        <div className={styles.statBar}>
          <div 
            className={styles.statBarFill} 
            style={{ width: `${(stats.nodes / 50) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Workflow Management Component
const WorkflowManager = () => {
  const [workflows, setWorkflows] = useState([
    { id: 1, name: "Data Processing Pipeline", status: "running", nodes: 8, progress: 75 },
    { id: 2, name: "AI Model Training", status: "completed", nodes: 12, progress: 100 },
    { id: 3, name: "User Analytics", status: "pending", nodes: 5, progress: 0 },
    { id: 4, name: "Content Generation", status: "running", nodes: 6, progress: 45 },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'var(--matrix-green)';
      case 'completed': return 'var(--accent-blue)';
      case 'pending': return 'var(--text-secondary)';
      case 'error': return '#ff4444';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className={styles.workflowManager}>
      <h3>Active Workflows</h3>
      <div className={styles.workflowList}>
        {workflows.map((workflow) => (
          <div key={workflow.id} className={styles.workflowItem}>
            <div className={styles.workflowHeader}>
              <div className={styles.workflowName}>{workflow.name}</div>
              <div 
                className={styles.workflowStatus}
                style={{ color: getStatusColor(workflow.status) }}
              >
                {workflow.status.toUpperCase()}
              </div>
            </div>
            <div className={styles.workflowDetails}>
              <span>Nodes: {workflow.nodes}</span>
              <div className={styles.workflowProgress}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ 
                      width: `${workflow.progress}%`,
                      backgroundColor: getStatusColor(workflow.status)
                    }}
                  />
                </div>
                <span>{workflow.progress}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Node Execution Monitor
const NodeExecutionMonitor = () => {
  const [nodes, setNodes] = useState([
    { id: 1, name: "Data Ingestion", type: "input", status: "active", load: 85 },
    { id: 2, name: "AI Processing", type: "compute", status: "active", load: 92 },
    { id: 3, name: "Result Aggregation", type: "output", status: "idle", load: 15 },
    { id: 4, name: "Model Inference", type: "compute", status: "active", load: 78 },
  ]);

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case 'input': return 'var(--accent-blue)';
      case 'compute': return 'var(--matrix-green)';
      case 'output': return 'var(--accent-purple)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className={styles.nodeMonitor}>
      <h3>Node Execution Monitor</h3>
      <div className={styles.nodeGrid}>
        {nodes.map((node) => (
          <div key={node.id} className={styles.nodeCard}>
            <div className={styles.nodeHeader}>
              <div className={styles.nodeName}>{node.name}</div>
              <div 
                className={styles.nodeType}
                style={{ color: getNodeTypeColor(node.type) }}
              >
                {node.type}
              </div>
            </div>
            <div className={styles.nodeStatus}>
              <span className={styles.nodeStatusText}>{node.status}</span>
              <div className={styles.nodeLoad}>
                <div className={styles.loadBar}>
                  <div 
                    className={styles.loadFill}
                    style={{ 
                      width: `${node.load}%`,
                      backgroundColor: node.load > 80 ? '#ff4444' : 'var(--matrix-green)'
                    }}
                  />
                </div>
                <span>{node.load}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// AI Configuration Manager
const AIConfigManager = () => {
  const [aiConfigs, setAiConfigs] = useState([
    { id: 1, name: "GPT-4 Config", model: "gpt-4", status: "active", tokens: 1250 },
    { id: 2, name: "Claude Config", model: "claude-3", status: "active", tokens: 890 },
    { id: 3, name: "Custom Model", model: "custom-llm", status: "inactive", tokens: 0 },
  ]);

  return (
    <div className={styles.aiConfigManager}>
      <h3>AI Configurations</h3>
      <div className={styles.aiConfigList}>
        {aiConfigs.map((config) => (
          <div key={config.id} className={styles.aiConfigItem}>
            <div className={styles.aiConfigHeader}>
              <div className={styles.aiConfigName}>{config.name}</div>
              <div className={styles.aiConfigStatus}>
                <div 
                  className={styles.statusIndicator}
                  style={{ 
                    backgroundColor: config.status === 'active' ? 'var(--matrix-green)' : 'var(--text-secondary)'
                  }}
                />
                {config.status}
              </div>
            </div>
            <div className={styles.aiConfigDetails}>
              <span>Model: {config.model}</span>
              <span>Tokens: {config.tokens.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Saved Configurations
const SavedConfigs = () => {
  const [savedConfigs, setSavedConfigs] = useState([
    { id: 1, name: "Production Setup", type: "workflow", lastUsed: "2 hours ago", size: "2.3MB" },
    { id: 2, name: "Development Config", type: "ai", lastUsed: "1 day ago", size: "1.1MB" },
    { id: 3, name: "Testing Pipeline", type: "workflow", lastUsed: "3 days ago", size: "890KB" },
    { id: 4, name: "Analytics Config", type: "ai", lastUsed: "1 week ago", size: "1.5MB" },
  ]);

  const getConfigTypeColor = (type: string) => {
    return type === 'workflow' ? 'var(--accent-blue)' : 'var(--accent-purple)';
  };

  return (
    <div className={styles.savedConfigs}>
      <h3>Saved Configurations</h3>
      <div className={styles.configList}>
        {savedConfigs.map((config) => (
          <div key={config.id} className={styles.configItem}>
            <div className={styles.configInfo}>
              <div className={styles.configName}>{config.name}</div>
              <div 
                className={styles.configType}
                style={{ color: getConfigTypeColor(config.type) }}
              >
                {config.type}
              </div>
            </div>
            <div className={styles.configMeta}>
              <span>{config.lastUsed}</span>
              <span>{config.size}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// API endpoints display
const APIEndpoints = () => {
  const endpoints = [
    { path: "/api/hello", method: "GET", status: "active", latency: "12ms" },
    { path: "/api/workflow", method: "POST", status: "active", latency: "45ms" },
    { path: "/api/nodes", method: "GET", status: "active", latency: "23ms" },
    { path: "/api/ai-config", method: "PUT", status: "active", latency: "67ms" },
    { path: "/api/saved-configs", method: "GET", status: "active", latency: "34ms" },
  ];

  return (
    <div className={styles.apiEndpoints}>
      <h3>API Endpoints</h3>
      <div className={styles.endpointsList}>
        {endpoints.map((endpoint, index) => (
          <div key={index} className={styles.endpointItem}>
            <div className={styles.endpointMethod}>{endpoint.method}</div>
            <div className={styles.endpointPath}>{endpoint.path}</div>
            <div className={styles.endpointStatus}>{endpoint.status}</div>
            <div className={styles.endpointLatency}>{endpoint.latency}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <>
      <Head>
        <title>Zigsaw Backend Dashboard</title>
        <meta name="description" content="Zigsaw Backend API Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={`${styles.page} ${inter.variable} ${jetbrainsMono.variable}`}>
        <MatrixRain />
        
        <main className={styles.main}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              <span className={styles.titleGlow}>ZIGSAW</span>
              <span className={styles.titleSub}>BACKEND DASHBOARD</span>
            </h1>
            <div className={styles.statusIndicator}>
              <div className={styles.statusDot} />
              <span>SYSTEM ONLINE</span>
            </div>
          </div>

          <DashboardStats />

          <div className={styles.dashboardGrid}>
            <WorkflowManager />
            <NodeExecutionMonitor />
          </div>

          <div className={styles.secondaryGrid}>
            <AIConfigManager />
            <SavedConfigs />
          </div>

          <div className={styles.tertiaryGrid}>
            <APIEndpoints />
            <div className={styles.dashboardCard}>
              <h3>System Health</h3>
              <div className={styles.healthGrid}>
                <div className={styles.healthItem}>
                  <span>CPU</span>
                  <div className={styles.healthBar}>
                    <div className={styles.healthBarFill} style={{ width: "65%" }} />
                  </div>
                </div>
                <div className={styles.healthItem}>
                  <span>Memory</span>
                  <div className={styles.healthBar}>
                    <div className={styles.healthBarFill} style={{ width: "42%" }} />
                  </div>
                </div>
                <div className={styles.healthItem}>
                  <span>Network</span>
                  <div className={styles.healthBar}>
                    <div className={styles.healthBarFill} style={{ width: "78%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.testPostGrid}>
            <TestPostButton />
          </div>

          <div className={styles.loggerGrid}>
            <APICallLogger />
          </div>

          <div className={styles.actions}>
            <button className={styles.actionButton}>
              <span>DEPLOY WORKFLOW</span>
            </button>
            <button className={styles.actionButton}>
              <span>MANAGE NODES</span>
            </button>
            <button className={styles.actionButton}>
              <span>AI CONFIGS</span>
            </button>
            <button className={styles.actionButton}>
              <span>SAVE CONFIG</span>
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
