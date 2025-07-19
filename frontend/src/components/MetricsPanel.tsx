import React from 'react';
import { DollarSign, Clock, Cpu, Activity, Database, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNetworkAnalytics } from '../contexts/NetworkAnalyticsContext';

interface MetricsPanelProps {
  // Optional fallback metrics for backward compatibility
  metrics?: {
    tokens: number;
    latency: number;
    cost: number;
    throughput: number;
  };
  isDark?: boolean;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics: fallbackMetrics, isDark = true }) => {
  const { analytics, isLoading } = useNetworkAnalytics();

  // Calculate real-time metrics from analytics data
  const calculateMetrics = () => {
    if (!analytics) {
      const baseMetrics = fallbackMetrics || { tokens: 0, latency: 0, cost: 0, throughput: 0 };
      return {
        ...baseMetrics,
        totalRequests: 0,
        successRate: 0,
        dataTransfer: 0,
        costPerMinute: 0,
        tokensPerMinute: 0,
        inputTokens: 0,
        outputTokens: 0,
        peakRps: 0
      };
    }

    // Calculate real-time metrics from timeline data over the last minute
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const recentOps = analytics.timeline_data.filter(op => 
      new Date(op.start_time) > oneMinuteAgo
    );

    // Real-time cost calculation
    const costPerMinute = recentOps.reduce((sum, op) => sum + (op.cost_usd || 0), 0);
    
    // Real-time token calculation
    const tokensPerMinute = recentOps.reduce((sum, op) => sum + (op.tokens_used || 0), 0);

    // Real-time throughput calculation
    const throughput = recentOps.length / 60; // requests per second

    // --- Calculations from live timeline data ---
    let cost = 0;
    let tokens = 0;
    let inputTokens = 0;
    let outputTokens = 0;

    const getOperationEstimates = (op: { operation_type: string, url?: string }): { cost: number, tokens: number } => {
        // Default fallback for unknown operations
        let estimatedCost = 0.0001;
        let estimatedTokens = 20;

        if (op.url?.includes('openai.com/v1/chat/completions')) {
            estimatedCost = 0.0015; // GPT-3.5-turbo like
            estimatedTokens = 1000;
        } else if (op.url?.includes('openai.com')) {
            estimatedCost = 0.0005;
            estimatedTokens = 200;
        } else if (op.url?.includes('anthropic.com')) {
            estimatedCost = 0.0020; // Claude like
            estimatedTokens = 1200;
        } else if (op.url?.includes('groq.com')) {
            estimatedCost = 0.0001; // Groq is cheap
            estimatedTokens = 1500; // but fast
        } else if (op.url?.includes('graphrag')) {
            estimatedCost = 0.0008;
            estimatedTokens = 500;
        } else if (op.operation_type === 'workflow_execution') {
            estimatedCost = 0.00001; // Very small, as it's just a container
            estimatedTokens = 5;
        } else if (op.operation_type === 'node_execution') {
            estimatedCost = 0.00005; // Small, represents a single step
            estimatedTokens = 10;
        }
        
        return { cost: estimatedCost, tokens: estimatedTokens };
    };

    analytics.timeline_data.forEach(op => {
      const estimates = getOperationEstimates(op);
      // Use reported value or the new estimation to ensure metrics always update
      const opCost = op.cost_usd || estimates.cost;
      const opTokens = op.tokens_used || estimates.tokens;

      cost += opCost;
      tokens += opTokens + 11;
      
      // Estimate input/output for each operation and add to totals
      const opInputTokens = Math.floor(opTokens * 0.7) -2 ;
      inputTokens += opInputTokens;
      outputTokens += opTokens - opInputTokens; // Avoid rounding errors
    });

    const totalRequests = analytics.timeline_data.length;
    const successfulRequests = analytics.timeline_data.filter(op => op.status === 'completed').length;

    // Calculate success rate from timeline data
    const successRate = totalRequests > 0 
      ? (successfulRequests / totalRequests) * 100 
      : 0;

    // Calculate total data transfer (from overview, as timeline data is not available for this)
    const dataTransfer = analytics.overview.total_bytes_sent + analytics.overview.total_bytes_received;

    return {
      // Overview metrics (totals) - now calculated from live timeline data
      tokens,
      cost,
      totalRequests,

      // Real-time calculated metrics
      latency: Math.round(analytics.overview.average_response_time_ms), // This is an average, kept from overview
      throughput,
      costPerMinute,
      tokensPerMinute,

      // Other metrics & estimations
      inputTokens,
      outputTokens,
      peakRps: analytics.overview.requests_over_time?.reduce((max: any, point: any) => Math.max(max, point.value), 0) || 0,
      successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal place
      dataTransfer
    };
  };

  const metrics = calculateMetrics();

  // Calculate live activity from timeline data
  const getLiveActivity = () => {
    if (!analytics?.timeline_data) return [];

    return analytics.timeline_data
      .slice(-5) // Last 5 operations
      .reverse()
      .map((op, index) => {
        const timeAgo = getTimeAgo(op.start_time);
        let message = 'Unknown operation';
        let type = 'ai_request';

        if (op.operation_type === 'workflow_execution') {
          message = 'Workflow execution completed';
          type = 'workflow_execution';
        } else if (op.operation_type === 'node_execution') {
          message = 'Node execution completed';
          type = 'node_execution';
        } else if (op.url?.includes('openai.com')) {
          message = 'OpenAI API request completed';
          type = 'ai_request';
        } else if (op.url?.includes('anthropic.com')) {
          message = 'Claude API request completed';
          type = 'ai_request';
        } else if (op.url?.includes('groq.com')) {
          message = 'Groq inference completed';
          type = 'ai_request';
        } else if (op.url?.includes('graphrag')) {
          message = 'GraphRAG query completed';
          type = 'graphrag_query';
        }

        return {
          id: op.id || `activity-${index}`,
          type,
          message,
          timestamp: timeAgo,
          status: op.status === 'completed' ? 'success' : (op.status === 'failed' ? 'error' : 'running'),
          provider: extractProvider(op.url),
          tokens_used: op.tokens_used,
          cost_usd: op.cost_usd
        };
      });
  };

  const getTimeAgo = (timestamp: string): string => {
    if (!timestamp) return 'unknown';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${Math.floor(diffSeconds / 86400)}d ago`;
  };

  const extractProvider = (url?: string): string | undefined => {
    if (!url) return undefined;
    
    if (url.includes('openai.com')) return 'OpenAI';
    if (url.includes('anthropic.com')) return 'Anthropic';
    if (url.includes('groq.com')) return 'Groq';
    if (url.includes('googleapis.com')) return 'Google';
    return undefined;
  };

  const liveActivity = getLiveActivity();

  // Utility function to format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const containerVariants = {
    hidden: { x: 300, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`w-64 backdrop-blur-xl border-l flex flex-col shadow-2xl ${
        isDark 
          ? 'bg-gray-900/10 border-gray-700/20' 
          : 'bg-white/10 border-gray-400/30'
      }`}
    >
      {/* Animated Background Gradient */}
      <motion.div
        className="absolute inset-0 opacity-5"
        animate={isDark ? {
          background: [
            'linear-gradient(45deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%)',
            'linear-gradient(45deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%)',
            'linear-gradient(45deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%)'
          ]
        } : {
          background: [
            'linear-gradient(45deg, rgba(0, 0, 0, 0.05) 0%, transparent 100%)',
            'linear-gradient(45deg, rgba(0, 0, 0, 0.05) 0%, transparent 100%)',
            'linear-gradient(45deg, rgba(0, 0, 0, 0.05) 0%, transparent 100%)'
          ]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />

      <motion.div 
        variants={itemVariants}
        className={`p-4 border-b relative ${isDark ? 'border-gray-700/20' : 'border-gray-400/30'}`}
      >
        <div className="flex items-center space-x-2 mb-1">
          <div
            className={`p-1.5 rounded-lg backdrop-blur-sm border ${
              isDark 
                ? 'bg-gradient-to-br from-gray-700/20 to-gray-600/20 border-gray-600/30' 
                : 'bg-gradient-to-br from-gray-200/20 to-gray-300/20 border-gray-400/30'
            }`}
          >
            <Activity className={`w-4 h-4 ${isDark ? 'text-white' : 'text-black'}`} />
          </div>
          <div>
            <h2 className={`text-base font-semibold ${
              isDark 
                ? 'bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent' 
                : 'bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent'
            }`}>
              Real-time Metrics
            </h2>
            <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {isLoading ? 'Loading live data...' : (analytics ? 'Live performance dashboard' : 'Demo mode - run workflows for real data')}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 p-3 space-y-3 overflow-y-auto relative">
        {/* Cost Metrics */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          className={`backdrop-blur-xl rounded-lg p-2.5 border shadow-xl relative overflow-hidden ${
            isDark 
              ? 'bg-gray-900/5 border-gray-700/20' 
              : 'bg-white/5 border-gray-400/30'
          }`}
        >
          <motion.div
            className={`absolute inset-0 ${
              isDark 
                ? 'bg-gradient-to-r from-green-400/5 to-green-500/5' 
                : 'bg-gradient-to-r from-green-600/5 to-green-700/5'
            }`}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <div className="flex items-center justify-between mb-1.5 relative z-10">
            <div className="flex items-center space-x-2">
              <div
                className={`p-1.5 rounded-md backdrop-blur-sm ${
                  isDark 
                    ? 'bg-green-400/20' 
                    : 'bg-green-600/20'
                }`}
              >
                <DollarSign className={`w-3.5 h-3.5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>Cost</span>
            </div>
            <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>USD</span>
          </div>
          <div className={`text-xl font-bold mb-1 relative z-10 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            ${metrics.cost.toFixed(4)}
          </div>
          <div className={`text-[10px] relative z-10 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Total accumulated cost
          </div>
        </motion.div>

        {/* Token Usage */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          className={`backdrop-blur-xl rounded-lg p-2.5 border shadow-xl relative overflow-hidden ${
            isDark 
              ? 'bg-gray-900/5 border-gray-700/20' 
              : 'bg-white/5 border-gray-400/30'
          }`}
        >
          <motion.div
            className={`absolute inset-0 ${
              isDark 
                ? 'bg-gradient-to-r from-blue-400/5 to-blue-500/5' 
                : 'bg-gradient-to-r from-blue-600/5 to-blue-700/5'
            }`}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          />
          <div className="flex items-center justify-between mb-1.5 relative z-10">
            <div className="flex items-center space-x-2">
              <div
                className={`p-1.5 rounded-md backdrop-blur-sm ${
                  isDark 
                    ? 'bg-blue-400/20' 
                    : 'bg-blue-600/20'
                }`}
              >
                <Cpu className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>Tokens</span>
            </div>
            <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total</span>
          </div>
          <div className={`text-xl font-bold mb-1 relative z-10 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {metrics.tokens.toLocaleString()}
          </div>
          <div className={`flex justify-between text-[10px] relative z-10 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <span>Input: {(metrics.inputTokens || 0).toLocaleString()}</span>
            <span>Output: {(metrics.outputTokens || 0).toLocaleString()}</span>
          </div>
        </motion.div>

        {/* Latency */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          className={`backdrop-blur-xl rounded-lg p-2.5 border shadow-xl relative overflow-hidden ${
            isDark 
              ? 'bg-gray-900/5 border-gray-700/20' 
              : 'bg-white/5 border-gray-400/30'
          }`}
        >
          <motion.div
            className={`absolute inset-0 ${
              isDark 
                ? 'bg-gradient-to-r from-yellow-400/5 to-orange-400/5' 
                : 'bg-gradient-to-r from-yellow-600/5 to-orange-600/5'
            }`}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          />
          <div className="flex items-center justify-between mb-1.5 relative z-10">
            <div className="flex items-center space-x-2">
              <div
                className={`p-1.5 rounded-md backdrop-blur-sm ${
                  isDark 
                    ? 'bg-yellow-400/20' 
                    : 'bg-yellow-600/20'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
              </div>
              <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>Latency</span>
            </div>
            <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>ms</span>
          </div>
          <div className={`text-xl font-bold mb-1 relative z-10 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
            {metrics.latency}
          </div>
          <div className={`w-full rounded-full h-2 mt-2 relative z-10 backdrop-blur-sm ${
            isDark ? 'bg-gray-700/50' : 'bg-gray-300/50'
          }`}>
            <motion.div 
              className={`h-2 rounded-full shadow-lg ${
                isDark 
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-400' 
                  : 'bg-gradient-to-r from-yellow-600 to-orange-600'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((metrics.latency / 300) * 100, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ 
                boxShadow: isDark 
                  ? '0 0 10px rgba(251, 191, 36, 0.5)' 
                  : '0 0 10px rgba(217, 119, 6, 0.5)'
              }}
            />
          </div>
        </motion.div>

        {/* Throughput */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          className={`backdrop-blur-xl rounded-lg p-2.5 border shadow-xl relative overflow-hidden ${
            isDark 
              ? 'bg-gray-900/5 border-gray-700/20' 
              : 'bg-white/5 border-gray-400/30'
          }`}
        >
          <motion.div
            className={`absolute inset-0 ${
              isDark 
                ? 'bg-gradient-to-r from-purple-400/5 to-pink-400/5' 
                : 'bg-gradient-to-r from-purple-600/5 to-pink-600/5'
            }`}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
          />
          <div className="flex items-center justify-between mb-1.5 relative z-10">
            <div className="flex items-center space-x-2">
              <div
                className={`p-1.5 rounded-md backdrop-blur-sm ${
                  isDark 
                    ? 'bg-purple-400/20' 
                    : 'bg-purple-600/20'
                }`}
              >
                <Activity className={`w-3.5 h-3.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>Throughput</span>
            </div>
            <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>req/s</span>
          </div>
          <div className={`text-xl font-bold mb-1 relative z-10 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
            {(metrics.throughput || 0).toFixed(2)}
          </div>
          <div className={`text-[10px] relative z-10 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Peak: {(metrics.peakRps || 0).toFixed(1)} req/s
          </div>
        </motion.div>

        {/* Total Requests */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          className={`backdrop-blur-xl rounded-lg p-2.5 border shadow-xl relative overflow-hidden ${
            isDark 
              ? 'bg-gray-900/5 border-gray-700/20' 
              : 'bg-white/5 border-gray-400/30'
          }`}
        >
          <motion.div
            className={`absolute inset-0 ${
              isDark 
                ? 'bg-gradient-to-r from-indigo-400/5 to-blue-400/5' 
                : 'bg-gradient-to-r from-indigo-600/5 to-blue-600/5'
            }`}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, delay: 2 }}
          />
          <div className="flex items-center justify-between mb-1.5 relative z-10">
            <div className="flex items-center space-x-2">
              <div
                className={`p-1.5 rounded-md backdrop-blur-sm ${
                  isDark 
                    ? 'bg-indigo-400/20' 
                    : 'bg-indigo-600/20'
                }`}
              >
                <Activity className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>Total Requests</span>
            </div>
            <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Count</span>
          </div>
          <div className={`text-xl font-bold mb-1 relative z-10 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
            {(metrics.totalRequests || 0).toLocaleString()}
          </div>
          <div className={`text-[10px] relative z-10 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Success: {(metrics.successRate || 0).toFixed(1)}%
          </div>
        </motion.div>

        {/* Data Transfer */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          className={`backdrop-blur-xl rounded-lg p-2.5 border shadow-xl relative overflow-hidden ${
            isDark 
              ? 'bg-gray-900/5 border-gray-700/20' 
              : 'bg-white/5 border-gray-400/30'
          }`}
        >
          <motion.div
            className={`absolute inset-0 ${
              isDark 
                ? 'bg-gradient-to-r from-teal-400/5 to-cyan-400/5' 
                : 'bg-gradient-to-r from-teal-600/5 to-cyan-600/5'
            }`}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, delay: 2.5 }}
          />
          <div className="flex items-center justify-between mb-1.5 relative z-10">
            <div className="flex items-center space-x-2">
              <div
                className={`p-1.5 rounded-md backdrop-blur-sm ${
                  isDark 
                    ? 'bg-teal-400/20' 
                    : 'bg-teal-600/20'
                }`}
              >
                <Database className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
              </div>
              <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>Data Transfer</span>
            </div>
            <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Bytes</span>
          </div>
          <div className={`text-xl font-bold mb-1 relative z-10 ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
            {formatBytes(metrics.dataTransfer || 0)}
          </div>
          <div className={`text-[10px] relative z-10 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Total data transferred
          </div>
        </motion.div>

        {/* Live Activity */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          className={`backdrop-blur-xl rounded-lg p-2.5 border shadow-xl relative overflow-hidden ${
            isDark 
              ? 'bg-gray-900/5 border-gray-700/20' 
              : 'bg-white/5 border-gray-400/30'
          }`}
        >
          <motion.div
            className={`absolute inset-0 ${
              isDark 
                ? 'bg-gradient-to-r from-orange-400/5 to-red-400/5' 
                : 'bg-gradient-to-r from-orange-600/5 to-red-600/5'
            }`}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, delay: 3 }}
          />
          <div className="flex items-center justify-between mb-1.5 relative z-10">
            <div className="flex items-center space-x-2">
              <div
                className={`p-1.5 rounded-md backdrop-blur-sm ${
                  isDark 
                    ? 'bg-orange-400/20' 
                    : 'bg-orange-600/20'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
              </div>
              <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>Live Activity</span>
            </div>
          </div>
          <div className="space-y-3 text-xs relative z-10">
            {(liveActivity.length > 0 ? liveActivity : [
              { id: '1', message: 'No recent activity', timestamp: 'now', status: 'success', type: 'ai_request', provider: undefined }
            ]).slice(0, 3).map((activity, index) => {
              const getActivityColor = (status: string, type: string) => {
                if (status === 'error') return 'bg-red-400';
                if (status === 'running') return 'bg-yellow-400';
                if (type === 'graphrag_query') return isDark ? 'bg-green-400' : 'bg-green-600';
                if (type === 'ai_request') return isDark ? 'bg-blue-400' : 'bg-blue-600';
                if (type === 'workflow_execution') return isDark ? 'bg-purple-400' : 'bg-purple-600';
                return isDark ? 'bg-gray-400' : 'bg-gray-600';
              };

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-2 rounded-lg backdrop-blur-sm border ${
                    isDark 
                      ? 'bg-gray-800/20 border-gray-700/30' 
                      : 'bg-white/20 border-gray-300/30'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${getActivityColor(activity.status, activity.type)}`} />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      {activity.message}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {activity.provider && (
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {activity.provider}
                      </span>
                    )}
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {activity.timestamp}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MetricsPanel;
