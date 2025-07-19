import type { NextApiRequest, NextApiResponse } from 'next';

// In-memory storage for API call logs (in production, use a database)
let apiCallLogs: any[] = [];

// Function to add a log entry (called from other API endpoints)
export const addAPICallLog = (logEntry: any) => {
  apiCallLogs.push({
    ...logEntry,
    timestamp: new Date().toISOString(),
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  });
  
  // Keep only the last 100 logs
  if (apiCallLogs.length > 100) {
    apiCallLogs = apiCallLogs.slice(-100);
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Return the logs in reverse chronological order
    const sortedLogs = [...apiCallLogs].reverse();
    
    return res.status(200).json({
      success: true,
      logs: sortedLogs,
      total: sortedLogs.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Logs API error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} 