const AIProvider = require('./base');

class GeminiProvider extends AIProvider {
  async chat(messages, opts = {}) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured. Add it to your .env file.');
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    // Separate system message from conversation
    const systemMsg = messages.find(m => m.role === 'system');
    const conversation = messages.filter(m => m.role !== 'system');

    // Convert OpenAI message format → Gemini format
    const contents = conversation.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body = { contents };
    if (systemMsg) {
      body.system_instruction = { parts: [{ text: systemMsg.content }] };
    }
    if (opts.temperature !== undefined) {
      body.generationConfig = { temperature: opts.temperature, maxOutputTokens: opts.max_tokens ?? 1024 };
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  }
}

module.exports = new GeminiProvider();
