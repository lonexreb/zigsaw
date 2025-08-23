const API_BASE = 'http://localhost:3000/api/fastapi';

async function testFastApiIntegration() {
  console.log('🧪 Testing FastAPI Video Generation...\n');

  // Test 1: Test video generation endpoint
  console.log('1. Testing video generation endpoint...');
  try {
    const videoResponse = await fetch(`${API_BASE}/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'A beautiful sunset over the ocean',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        style: 'cinematic',
        duration: 10,
        quality: 'medium'
      })
    });

    console.log(`📊 Video generation response status: ${videoResponse.status}`);
    console.log(`📊 Video generation response headers:`, Object.fromEntries(videoResponse.headers.entries()));

    if (videoResponse.ok) {
      const data = await videoResponse.json();
      console.log('✅ Video generation successful!');
      console.log('📄 Response data:', JSON.stringify(data, null, 2));
    } else {
      const errorData = await videoResponse.json();
      console.log(`❌ Video generation failed with status: ${videoResponse.status}`);
      console.log('   Error details:', JSON.stringify(errorData, null, 2));
    }
  } catch (error) {
    console.error('❌ Error testing video generation:', error.message);
  }

  console.log('\n🏁 FastAPI video generation test completed!');
}

// Run the test
testFastApiIntegration().catch(console.error);
