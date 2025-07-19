import type { NextApiRequest, NextApiResponse } from 'next';

// In-memory storage for statistics (in production, use a database)
let requestCount = 0;
let startTime = Date.now();

// Function to increment request count (called from other API endpoints)
export const incrementRequestCount = () => {
  requestCount++;
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
    const uptime = Date.now() - startTime;
    const uptimeMinutes = Math.floor(uptime / 60000);
    
    // Calculate requests per minute (based on uptime)
    const requestsPerMinute = uptimeMinutes > 0 ? Math.floor(requestCount / uptimeMinutes) : requestCount;
    
    // Simulate some dynamic stats
    const stats = {
      requests: requestsPerMinute + Math.floor(Math.random() * 50),
      users: Math.floor(Math.random() * 20) + 5,
      uptime: Math.floor(uptime / 1000), // seconds
      performance: Math.floor(Math.random() * 20) + 80,
      workflows: Math.floor(Math.random() * 5) + 2,
      nodes: Math.floor(Math.random() * 10) + 5,
      totalRequests: requestCount,
      serverStartTime: new Date(startTime).toISOString()
    };
    
    return res.status(200).json(stats);

  } catch (error) {
    console.error('❌ Stats API error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} 