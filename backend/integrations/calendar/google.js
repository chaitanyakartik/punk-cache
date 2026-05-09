const { google } = require('googleapis');
const CalendarProvider = require('./base');
const storage = require('../../services/storage');

class GoogleCalendarProvider extends CalendarProvider {
  constructor() {
    super();
    this._client = null;
  }

  _getClient() {
    if (!this._client) {
      const clientId     = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri  = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/calendar/oauth/callback';
      if (!clientId || !clientSecret) {
        throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env');
      }
      this._client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    }
    return this._client;
  }

  getAuthUrl() {
    const client = this._getClient();
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    });
  }

  async handleCallback(code) {
    const client = this._getClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    const meta = await storage.readMeta();
    meta.calendarTokens = tokens;
    await storage.writeMeta(meta);
    return tokens;
  }

  async _authedClient() {
    const meta = await storage.readMeta();
    if (!meta.calendarTokens) throw new Error('Calendar not connected');
    const client = this._getClient();
    client.setCredentials(meta.calendarTokens);
    // Persist refreshed tokens automatically
    client.on('tokens', async (tokens) => {
      const m = await storage.readMeta();
      m.calendarTokens = { ...m.calendarTokens, ...tokens };
      await storage.writeMeta(m);
    });
    return client;
  }

  async getEvents(timeMin, timeMax) {
    const auth = await this._authedClient();
    const cal = google.calendar({ version: 'v3', auth });

    const start = timeMin || new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const end   = timeMax || new Date(new Date().setHours(23, 59, 59, 999)).toISOString();

    const res = await cal.events.list({
      calendarId: 'primary',
      timeMin: start,
      timeMax: end,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 50,
    });

    return (res.data.items || []).map(e => ({
      id: e.id,
      title: e.summary || 'No title',
      start: e.start.dateTime || e.start.date,
      end:   e.end.dateTime   || e.end.date,
      location: e.location || null,
      colorId: e.colorId || null,
      isAllDay: !e.start.dateTime,
    }));
  }

  async getStatus() {
    try {
      const meta = await storage.readMeta();
      return { connected: !!meta.calendarTokens };
    } catch {
      return { connected: false };
    }
  }

  async disconnect() {
    const meta = await storage.readMeta();
    meta.calendarTokens = null;
    await storage.writeMeta(meta);
    this._client = null;
  }
}

module.exports = new GoogleCalendarProvider();
