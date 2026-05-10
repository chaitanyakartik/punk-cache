import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export function useCalendar() {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectUrl, setConnectUrl] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const status = await api.get('/calendar/status');
      setConnected(status.connected);
      if (status.connected) {
        const data = await api.get('/calendar/events');
        setEvents(data.events || []);
        setError(null);
      } else {
        setEvents([]);
      }
    } catch (err) {
      setConnected(false);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConnectUrl = useCallback(async () => {
    try {
      const data = await api.get('/calendar/auth-url');
      setConnectUrl(data.url);
    } catch {
      setConnectUrl(null);
    }
  }, []);

  useEffect(() => {
    refresh();
    fetchConnectUrl();
    // Poll every 5 minutes when mounted
    const interval = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh, fetchConnectUrl]);

  // Handle OAuth redirect back (calendarConnected=1 in URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendarConnected')) {
      window.history.replaceState({}, '', window.location.pathname);
      refresh();
    }
    if (params.get('calendarError')) {
      setError(decodeURIComponent(params.get('calendarError')));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refresh]);

  const disconnect = async () => {
    await api.post('/calendar/disconnect', {});
    setConnected(false);
    setEvents([]);
  };

  return { connected, events, loading, connectUrl, error, refresh, disconnect };
}
