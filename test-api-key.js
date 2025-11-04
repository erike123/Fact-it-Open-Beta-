// Quick script to test if your Anthropic API key works
// Run this with: node test-api-key.js

const ANTHROPIC_API_KEY = '<REPLACE_ME>';

async function testKey() {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: 'Say "API key works!" if you can read this.'
        }]
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS! API Key is valid and working!');
      console.log('Response:', data.content[0].text);
      console.log('\n💰 Cost of this test: ~$0.0001 (basically free)');
    } else {
      console.log('❌ ERROR: API Key issue');
      console.log('Status:', response.status);
      console.log('Error:', data);

      if (response.status === 401) {
        console.log('\n⚠️ API Key is INVALID or EXPIRED');
        console.log('You need to get a new key from: https://console.anthropic.com/');
      } else if (response.status === 429) {
        console.log('\n⚠️ Rate limit or insufficient credits');
        console.log('Add credits at: https://console.anthropic.com/settings/billing');
      }
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

console.log('Testing Anthropic API key...\n');
testKey();
