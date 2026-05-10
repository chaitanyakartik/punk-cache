import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export function useClipboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/clipboard');
      setEntries(data.entries.slice().reverse());
    } catch (err) {
      console.error('Failed to load clipboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addEntry = async (text) => {
    await api.post('/clipboard', { text });
    await refresh();
  };

  const deleteEntry = async (id) => {
    await api.del(`/clipboard/${id}`);
    await refresh();
  };

  return { entries, loading, addEntry, deleteEntry, refresh };
}
