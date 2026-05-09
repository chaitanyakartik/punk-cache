class VideoProvider {
  async fetchMetadata(url) {
    throw new Error('fetchMetadata() not implemented');
  }
}

module.exports = VideoProvider;
