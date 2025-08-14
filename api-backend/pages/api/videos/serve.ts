import { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import * as path from 'path';

// API endpoint to serve downloaded videos
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    const { path: videoPath } = req.query;

    if (!videoPath || typeof videoPath !== 'string') {
      return res.status(400).json({ error: 'Video path parameter required' });
    }

    console.log(`🎬 Serving video: ${videoPath}`);

    // Security: Only serve files from ZigsawVideos folder
    if (!videoPath.includes('ZigsawVideos') || !videoPath.includes('Downloads')) {
      console.error(`🚫 Access denied for path: ${videoPath}`);
      return res.status(403).json({ error: 'Access denied - invalid path' });
    }

    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      console.error(`📁 File not found: ${videoPath}`);
      return res.status(404).json({ error: 'Video file not found' });
    }

    // Get file stats
    const stats = fs.statSync(videoPath);
    const fileSize = stats.size;

    console.log(`📊 Serving video file: ${path.basename(videoPath)} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

    // Set appropriate headers
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', fileSize.toString());
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    
    // Handle range requests for video streaming
    const range = req.headers.range;
    
    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      console.log(`📺 Range request: ${start}-${end}/${fileSize}`);
      
      // Set partial content headers
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunksize.toString());
      
      // Create stream for range
      const stream = fs.createReadStream(videoPath, { start, end });
      stream.pipe(res);
      
    } else {
      // No range request, serve entire file
      console.log(`📹 Serving full video file`);
      const stream = fs.createReadStream(videoPath);
      stream.pipe(res);
    }

  } catch (error) {
    console.error('❌ Video serving error:', error);
    return res.status(500).json({
      error: `Failed to serve video: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}
