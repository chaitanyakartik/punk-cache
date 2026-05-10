import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export function useCards(contextId) {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!contextId) return;
    try {
      setLoading(true);
      const data = await api.get(`/contexts/${contextId}`);
      setContext(data);
    } catch (err) {
      console.error('Failed to load context:', err);
    } finally {
      setLoading(false);
    }
  }, [contextId]);

  useEffect(() => { refresh(); }, [refresh]);

  // Refresh when command bar creates/updates cards from outside
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('personal-os:data-changed', handler);
    return () => window.removeEventListener('personal-os:data-changed', handler);
  }, [refresh]);

  const createCard = async (data) => {
    const card = await api.post(`/cards/${contextId}`, data);
    await refresh();
    return card;
  };

  const updateCard = async (cardId, data) => {
    const card = await api.put(`/cards/${contextId}/${cardId}`, data);
    await refresh();
    return card;
  };

  const moveCard = async (cardId, state) => {
    await api.put(`/cards/${contextId}/${cardId}/state`, { state });
    setContext(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        cards: prev.cards.map(c =>
          c.id === cardId ? { ...c, state, updated_at: new Date().toISOString() } : c
        ),
      };
    });
  };

  const deleteCard = async (cardId) => {
    await api.del(`/cards/${contextId}/${cardId}`);
    await refresh();
  };

  return { context, loading, refresh, createCard, updateCard, moveCard, deleteCard };
}
