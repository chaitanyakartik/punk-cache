import { createContext, useContext, useState } from 'react';
import { MASTER_CATEGORIES } from '../constants/categories';

const CategoriesCtx = createContext(null);

export function CategoriesProvider({ children }) {
  const [colorOverrides, setColorOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ct_cat_colors')) || {}; } catch { return {}; }
  });

  const categories = MASTER_CATEGORIES.map(c => ({
    ...c,
    color: colorOverrides[c.id] || c.color,
  }));

  const updateCategoryColor = (id, color) => {
    const next = { ...colorOverrides, [id]: color };
    setColorOverrides(next);
    localStorage.setItem('ct_cat_colors', JSON.stringify(next));
  };

  return (
    <CategoriesCtx.Provider value={{ categories, updateCategoryColor }}>
      {children}
    </CategoriesCtx.Provider>
  );
}

export function useCategories() {
  return useContext(CategoriesCtx);
}
