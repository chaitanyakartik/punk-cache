const provider = process.env.CALENDAR_PROVIDER || 'google';

if (provider === 'google') {
  module.exports = require('./google');
} else {
  throw new Error(`Unknown CALENDAR_PROVIDER: ${provider}`);
}
