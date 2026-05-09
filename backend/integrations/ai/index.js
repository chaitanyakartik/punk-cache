const provider = process.env.AI_PROVIDER || 'gemini';

if (provider === 'grok') {
  module.exports = require('./grok');
} else if (provider === 'groq') {
  module.exports = require('./groq');
} else if (provider === 'gemini') {
  module.exports = require('./gemini');
} else {
  throw new Error(`Unknown AI_PROVIDER: ${provider}`);
}
