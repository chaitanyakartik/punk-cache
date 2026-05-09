class CalendarProvider {
  getAuthUrl() { throw new Error('getAuthUrl() not implemented'); }
  async handleCallback(code) { throw new Error('handleCallback() not implemented'); }
  async getEvents(timeMin, timeMax) { throw new Error('getEvents() not implemented'); }
  async getStatus() { throw new Error('getStatus() not implemented'); }
  async disconnect() { throw new Error('disconnect() not implemented'); }
}

module.exports = CalendarProvider;
