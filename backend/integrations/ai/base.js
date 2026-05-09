class AIProvider {
  /**
   * @param {Array<{role: string, content: string}>} messages
   * @param {object} opts
   * @returns {Promise<string>} the assistant's reply text
   */
  async chat(messages, opts = {}) {
    throw new Error('chat() not implemented');
  }
}

module.exports = AIProvider;
