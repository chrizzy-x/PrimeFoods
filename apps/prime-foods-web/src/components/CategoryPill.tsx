import type { Category } from '@primefoods/types';

interface Props {
  category: Category;
  selected: boolean;
  onClick: () => void;
}

export function CategoryPill({ category, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
        selected
          ? 'bg-accent text-white shadow-md shadow-accent/30'
          : 'bg-surface-2 text-text-secondary border border-border hover:border-accent/50'
      }`}
    >
      <span>{category.emoji}</span>
      <span>{category.name}</span>
    </button>
  );
}
