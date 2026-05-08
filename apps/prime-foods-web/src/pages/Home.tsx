import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories, useFeaturedMenuItems, useMenuItems, useProfile } from '../lib/queries';
import { MenuCard } from '../components/MenuCard';
import { CategoryPill } from '../components/CategoryPill';
import { CartDrawer } from '../components/CartDrawer';
import { useCartStore } from '../store/cart';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
      {initials || '?'}
    </div>
  );
}

export function Home() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: categories = [] } = useCategories();
  const { data: featured = [], isLoading: featuredLoading } = useFeaturedMenuItems();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: menuItems = [] } = useMenuItems(selectedCategory);
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const total = useCartStore((s) => s.items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0));

  const filtered = useMemo(() => {
    if (!search.trim()) return menuItems;
    const q = search.toLowerCase();
    return menuItems.filter(
      (m) => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q),
    );
  }, [menuItems, search]);

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="px-4 pt-10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-sm">{getGreeting()},</p>
            <h1 className="font-display font-bold text-xl text-text-primary">
              {profile?.full_name?.split(' ')[0] ?? 'Foodie'} 👋
            </h1>
          </div>
          <Avatar name={profile?.full_name ?? ''} />
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search dishes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-2xl pl-10 pr-4 py-3 text-text-primary placeholder:text-muted text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Featured items */}
      {!search && (
        <section className="mb-5">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="font-display font-bold text-text-primary">Featured</h2>
            <button onClick={() => navigate('/menu')} className="text-accent text-sm font-medium">
              See all
            </button>
          </div>
          {featuredLoading ? (
            <div className="flex gap-3 px-4">
              {[1, 2].map((k) => (
                <div key={k} className="w-48 h-48 bg-surface rounded-2xl flex-shrink-0 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-1">
              {featured.map((item) => (
                <div key={item.id} className="w-48 flex-shrink-0">
                  <MenuCard item={item} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Categories */}
      {!search && (
        <section className="mb-4">
          <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide pb-1">
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
        </section>
      )}

      {/* Menu grid */}
      <section className="px-4">
        <h2 className="font-display font-bold text-text-primary mb-3">
          {search ? `Results for "${search}"` : selectedCategory ? categories.find((c) => c.id === selectedCategory)?.name ?? 'Menu' : 'All Items'}
        </h2>
        {filtered.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-8">No items found</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Floating cart button */}
      {itemCount > 0 && (
        <button
          onClick={() => setDrawerOpen(true)}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-accent hover:bg-accent-dark text-white rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-lg shadow-accent/40 z-30 transition-all active:scale-95"
        >
          <span className="bg-white/20 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
            {itemCount}
          </span>
          <span className="font-semibold text-sm">View Cart</span>
          <span className="font-bold text-sm">₦{total.toLocaleString()}</span>
        </button>
      )}

      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
