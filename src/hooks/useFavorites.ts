import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const FAVORITES_STORAGE_KEY = 'yield-ranker-favorites';

export function useFavorites() {
  const { user } = useAuth();
  const storageKey = user ? `${FAVORITES_STORAGE_KEY}-${user.id}` : FAVORITES_STORAGE_KEY;
  
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Failed to load favorites from localStorage:', error);
    }
    return new Set();
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFavorites(new Set(Array.isArray(parsed) ? parsed : []));
      }
    } catch (error) {
      console.error('Failed to load favorites from localStorage:', error);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(favorites)));
    } catch (error) {
      console.error('Failed to save favorites to localStorage:', error);
    }
  }, [favorites, storageKey]);

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol);
      } else {
        newFavorites.add(symbol);
      }
      return newFavorites;
    });
  };

  const isFavorite = (symbol: string) => favorites.has(symbol);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
  };
}

