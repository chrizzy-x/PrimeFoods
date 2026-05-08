import { useState } from 'react';
import { useCategories, useMenuItems } from '../lib/queries';
import { MenuCard } from '../components/MenuCard';
import { CategoryPill } from '../components/CategoryPill';

export function Menu() {
  const { data: categories = [] } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const { data: items = [], isLoading } = useMenuItems(selectedCategory);

  return (
    <div className="min-h-full">
      <div className="px-4 pt-10 pb-4">
        <h1 className="font-display font-bold text-2xl text-text-primary">Menu</h1>
        <p className="text-text-secondary text-sm mt-0.5">Browse our full selection</p>
      </div>

      <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide pb-3">
        <CategoryPill
          category={{ id: '', name: 'All', emoji: '🍽️', sort_order: 0 }}
          selected={!selectedCategory}
          onClick={() => setSelectedCategory(undefined)}
        />
        {categories.map((cat) => (
          <CategoryPill
            key={cat.id}
            category={cat}
            selected={selectedCategory === cat.id}
            onClick={() => setSelectedCategory(cat.id)}
          />
        ))}
      </div>

      <div className="px-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 bg-surface rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-12">No items in this category</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
