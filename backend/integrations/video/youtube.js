const VideoProvider = require('./base');

class YouTubeProvider extends VideoProvider {
  async fetchMetadata(url) {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) throw new Error(`oEmbed fetch failed: ${res.status}`);
    const data = await res.json();
    return {
      title: data.title,
      author: data.author_name,
      thumbnail_url: data.thumbnail_url,
    };
  }
}

module.exports = new YouTubeProvider();
