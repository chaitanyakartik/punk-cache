const provider = process.env.VIDEO_PROVIDER || 'youtube';

if (provider === 'youtube') {
  module.exports = require('./youtube');
} else {
  throw new Error(`Unknown VIDEO_PROVIDER: ${provider}`);
}
