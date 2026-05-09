const AIProvider = require('./base');

class GrokProvider extends AIProvider {
  async chat(messages, opts = {}) {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey || apiKey === 'your-grok-api-key-here') {
      throw new Error('GROK_API_KEY is not configured. Add it to your .env file.');
    }

    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROK_MODEL || 'grok-beta',
        messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.max_tokens ?? 1024,
        stream: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Grok API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  }
}

module.exports = new GrokProvider();
