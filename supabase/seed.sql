-- Prime Foods Seed Data: 5 categories + 16 Nigerian food items

-- ─── Categories ───────────────────────────────────────────────────────────────

INSERT INTO public.categories (id, name, emoji, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Rice Dishes',    '🍚', 1),
  ('11111111-0000-0000-0000-000000000002', 'Soups & Stews',  '🍲', 2),
  ('11111111-0000-0000-0000-000000000003', 'Grills & Suya',  '🔥', 3),
  ('11111111-0000-0000-0000-000000000004', 'Snacks & Sides', '🥘', 4),
  ('11111111-0000-0000-0000-000000000005', 'Drinks',         '🥤', 5);

-- ─── Menu Items ───────────────────────────────────────────────────────────────

-- Rice Dishes
INSERT INTO public.menu_items (name, description, price, image_url, category_id, is_available, prep_time_minutes, calories, is_featured) VALUES
  (
    'Party Jollof Rice',
    'Smoky, rich tomato-based rice cooked over firewood — the real deal. Served with fried plantain and coleslaw.',
    3500, 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800',
    '11111111-0000-0000-0000-000000000001', true, 25, 520, true
  ),
  (
    'Fried Rice & Chicken',
    'Fragrant golden fried rice with garden vegetables, seasoned with soy and spices. Served with crispy grilled chicken.',
    4200, 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800',
    '11111111-0000-0000-0000-000000000001', true, 20, 610, true
  ),
  (
    'Ofada Rice & Stew',
    'Local unpolished Ofada rice served with native palm oil stew loaded with assorted meat and locust beans.',
    3800, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    '11111111-0000-0000-0000-000000000001', true, 30, 490, false
  ),
  (
    'White Rice & Beans',
    'Perfectly boiled white rice served alongside seasoned honey beans cooked in rich palm oil and crayfish.',
    2500, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800',
    '11111111-0000-0000-0000-000000000001', true, 20, 440, false
  ),

-- Soups & Stews
  (
    'Egusi Soup',
    'Ground melon seed soup slow-cooked with leafy vegetables, assorted meats, stockfish, and iru (locust beans). Served with swallow of choice.',
    4500, 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800',
    '11111111-0000-0000-0000-000000000002', true, 35, 580, true
  ),
  (
    'Banga Soup',
    'Delta-style palm nut soup richly spiced with oburunbebe stick, dried fish, and assorted beef. Best with starch or eba.',
    5000, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800',
    '11111111-0000-0000-0000-000000000002', true, 40, 620, false
  ),
  (
    'Catfish Pepper Soup',
    'Spicy aromatic broth with fresh catfish, uziza leaves, and traditional pepper soup spices — warming and deeply flavourful.',
    4800, 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800',
    '11111111-0000-0000-0000-000000000002', true, 30, 310, true
  ),
  (
    'Ofe Onugbu (Bitter Leaf Soup)',
    'Igbo classic made with bitter leaf, cocoyam, ofo thickener, and assorted meats cooked in palm oil. Served with eba or fufu.',
    4200, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800',
    '11111111-0000-0000-0000-000000000002', true, 40, 550, false
  ),

-- Grills & Suya
  (
    'Beef Suya',
    'Hausa-style flame-grilled beef skewers rubbed in kuli-kuli spice mix (groundnut and spice). Served with fresh sliced onion, tomato, and suya pepper.',
    3200, 'https://images.unsplash.com/photo-1544025162-d76preserver-6ca1-4caa7-b1d0-dc77fa23f568?w=800',
    '11111111-0000-0000-0000-000000000003', true, 20, 420, true
  ),
  (
    'Asun (Peppered Goat Meat)',
    'Smoked, charred goat meat tossed in a fiery scotch bonnet and bell pepper sauce. A party favourite.',
    5500, 'https://images.unsplash.com/photo-1544025162-d76preserver-6ca1-4caa7-b1d0-dc77fa23f568?w=800',
    '11111111-0000-0000-0000-000000000003', true, 25, 480, false
  ),
  (
    'Grilled Chicken Wings',
    'Marinated chicken wings grilled to perfection with a blend of Nigerian spices and served with a spicy dipping sauce.',
    4000, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800',
    '11111111-0000-0000-0000-000000000003', true, 30, 390, true
  ),

-- Snacks & Sides
  (
    'Puff Puff',
    'Fluffy, lightly sweetened deep-fried dough balls — the ultimate Nigerian street snack. Served hot in portions of 8.',
    1200, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800',
    '11111111-0000-0000-0000-000000000004', true, 15, 280, false
  ),
  (
    'Akara (Bean Cakes)',
    'Crispy outside, soft inside deep-fried bean cakes seasoned with peppers and onion. A timeless breakfast staple.',
    1500, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800',
    '11111111-0000-0000-0000-000000000004', true, 20, 320, false
  ),
  (
    'Moi Moi',
    'Steamed bean pudding blended with peppers, onions, crayfish, and eggs. Rich, soft, and satisfying.',
    1800, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800',
    '11111111-0000-0000-0000-000000000004', true, 45, 260, false
  ),

-- Drinks
  (
    'Chapman',
    'Nigeria''s iconic party drink — a refreshing mix of Fanta, Sprite, grenadine, angostura bitters, cucumber, and ice. Mocktail style.',
    1500, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800',
    '11111111-0000-0000-0000-000000000005', true, 5, 120, false
  ),
  (
    'Zobo Drink',
    'Chilled hibiscus flower drink infused with ginger, cloves, and pineapple — naturally tart, refreshing, and homemade.',
    1000, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800',
    '11111111-0000-0000-0000-000000000005', true, 5, 80, false
  );
