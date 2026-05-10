import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export function useContexts() {
  const [contexts, setContexts] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/contexts');
      setContexts(data);
    } catch (err) {
      console.error('Failed to load contexts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const createContext = async (name, category) => {
    const ctx = await api.post('/contexts', { name, category });
    await refresh();
    return ctx;
  };

  const deleteContext = async (id) => {
    await api.del(`/contexts/${id}`);
    await refresh();
  };

  const setLastOpened = async (id) => {
    await api.put('/contexts/meta/last-opened', { id });
  };

  const updateContextColor = async (id, color) => {
    await api.put(`/contexts/${id}`, { color });
    await refresh();
  };

  const updateContextCategory = async (id, category) => {
    await api.put(`/contexts/${id}`, { category });
    await refresh();
  };

  return { contexts, loading, refresh, createContext, deleteContext, setLastOpened, updateContextColor, updateContextCategory };
}
