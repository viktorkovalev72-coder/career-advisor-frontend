import { Vacancy } from '../types-pro';

const FAVORITES_KEY = 'career_advisor_favorites';

export function getFavorites(): Vacancy[] {
  try {
    const data = localStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
}

export function saveFavorites(favorites: Vacancy[]): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Error saving favorites:', error);
  }
}

export function addFavorite(vacancy: Vacancy): Vacancy[] {
  const favorites = getFavorites();
  if (!favorites.find(f => f.id === vacancy.id)) {
    favorites.push({ ...vacancy, isFavorite: true });
    saveFavorites(favorites);
  }
  return favorites;
}

export function removeFavorite(vacancyId: string): Vacancy[] {
  const favorites = getFavorites();
  const filtered = favorites.filter(f => f.id !== vacancyId);
  saveFavorites(filtered);
  return filtered;
}

export function toggleFavorite(vacancy: Vacancy): Vacancy[] {
  const favorites = getFavorites();
  const index = favorites.findIndex(f => f.id === vacancy.id);
  
  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push({ ...vacancy, isFavorite: true });
  }
  
  saveFavorites(favorites);
  return favorites;
}

export function isFavorite(vacancyId: string): boolean {
  const favorites = getFavorites();
  return favorites.some(f => f.id === vacancyId);
}
