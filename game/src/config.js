// Warung Kilat — all the numbers that shape the game: canvas size, screen layout,
// ingredients, recipes and how each day gets harder. One place to tune the game.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const MAX_PLATE_ITEMS = 4;
export const MAX_CUSTOMERS = 4;
export const MAX_STRIKES = 3;

// Ingredient catalogue. `station` is null for ready-to-serve ingredients, or the
// station kind that must cook the raw ingredient first. `cooked` is what it
// becomes once the station finishes.
export const INGREDIENTS = {
  nasi: { name: 'Nasi', short: 'Nasi', color: '#fff8e7', station: null, cooked: null, cookTime: 0 },
  'ayam-mentah': { name: 'Ayam Mentah', short: 'Ayam', color: '#f2b8a0', station: 'wajan', cooked: 'ayam-goreng', cookTime: 6 },
  'telur-mentah': { name: 'Telur Mentah', short: 'Telur', color: '#ffe9b8', station: 'wajan', cooked: 'telur-goreng', cookTime: 5 },
  'mie-mentah': { name: 'Mie Mentah', short: 'Mie', color: '#f7d774', station: 'panci', cooked: 'mie-rebus', cookTime: 5 },
  sayur: { name: 'Sayur', short: 'Sayur', color: '#7bc96f', station: null, cooked: null, cookTime: 0 },
  sambal: { name: 'Sambal', short: 'Sambal', color: '#e5484d', station: null, cooked: null, cookTime: 0 },
  'ayam-goreng': { name: 'Ayam Goreng', short: 'Ayam Grg', color: '#d98e32', station: null, cooked: null, cookTime: 0 },
  'telur-goreng': { name: 'Telur Goreng', short: 'Telur Grg', color: '#f6c453', station: null, cooked: null, cookTime: 0 },
  'mie-rebus': { name: 'Mie Rebus', short: 'Mie Rbs', color: '#f2c14e', station: null, cooked: null, cookTime: 0 },
};

// The order bins on the counter, left to right (keys 1-6).
export const BIN_ORDER = ['nasi', 'ayam-mentah', 'telur-mentah', 'mie-mentah', 'sayur', 'sambal'];

// Menu: every dish a customer can order. `minDay` gates the harder dishes so day 1
// stays gentle and later days ask for real planning.
export const RECIPES = {
  'nasi-telur': { name: 'Nasi Telur', items: ['nasi', 'telur-goreng'], price: 12, minDay: 1 },
  'nasi-ayam': { name: 'Nasi Ayam', items: ['nasi', 'ayam-goreng'], price: 15, minDay: 1 },
  'ayam-geprek': { name: 'Ayam Geprek', items: ['ayam-goreng', 'sambal'], price: 16, minDay: 1 },
  'nasi-campur': { name: 'Nasi Campur', items: ['nasi', 'ayam-goreng', 'sayur'], price: 20, minDay: 2 },
  'mie-goreng': { name: 'Mie Goreng', items: ['mie-rebus', 'telur-goreng', 'sayur'], price: 18, minDay: 2 },
  'nasi-geprek': { name: 'Nasi Geprek', items: ['nasi', 'ayam-goreng', 'sambal'], price: 22, minDay: 2 },
};
export const RECIPE_IDS = Object.keys(RECIPES);

// How a day is tuned. Later days: shorter day, higher target, faster customers,
// shorter patience, more complex orders.
export function dayTuning(day) {
  return {
    daySeconds: Math.max(60, 95 - (day - 1) * 5),
    targetCoins: 55 + (day - 1) * 35,
    spawnSeconds: Math.max(5.5, 12 - (day - 1) * 1.5),
    patienceSeconds: Math.max(26, 46 - (day - 1) * 3),
    firstSpawnSeconds: 2.5,
  };
}

// Burn window: a finished dish stays edible this long before it burns.
export const BURN_SECONDS = 5;
// Day-clear bonus, in coins, for every strike-free day.
export const CLEAN_DAY_BONUS = 10;

// Layout rectangles (logical 1280x720 pixels). render.js draws here, input.js
// hit-tests here, so the picture and the clicks always agree.
export const LAYOUT = {
  hud: { x: 0, y: 0, w: 1280, h: 60 },
  dayTimer: { x: 560, y: 14, w: 300, h: 16 },
  pauseButton: { x: 1210, y: 10, w: 56, h: 40 },
  // Customer slots: four seats along the order board.
  customerSlots: [
    { x: 40, y: 72, w: 290, h: 138 },
    { x: 350, y: 72, w: 290, h: 138 },
    { x: 660, y: 72, w: 290, h: 138 },
    { x: 970, y: 72, w: 290, h: 138 },
  ],
  // Cooking stations on the back counter: two woks, one pot.
  stations: [
    { x: 90, y: 246, w: 300, h: 150, kind: 'wajan', label: 'WAJAN 1' },
    { x: 490, y: 246, w: 300, h: 150, kind: 'wajan', label: 'WAJAN 2' },
    { x: 890, y: 246, w: 300, h: 150, kind: 'panci', label: 'PANCI' },
  ],
  // Ingredient bins on the front counter.
  bins: BIN_ORDER.map((id, i) => ({ id, x: 40 + i * 148, y: 436, w: 132, h: 118 })),
  // The assembly plate, right of the bins.
  plate: { x: 940, y: 436, w: 300, h: 118 },
  trashButton: { x: 40, y: 640, w: 150, h: 56 },
  serveButton: { x: 1060, y: 630, w: 180, h: 66 },
  hint: { x: 210, y: 640, w: 820, h: 56 },
  titleStartButton: { x: 490, y: 520, w: 300, h: 64 },
  overRestartButton: { x: 490, y: 520, w: 300, h: 64 },
  dayNextButton: { x: 490, y: 520, w: 300, h: 64 },
};

// Customer look: a small cast of regulars, picked by seeded random.
export const CUSTOMER_LOOKS = [
  { skin: '#f2c89b', shirt: '#3e7cb1', hair: '#2b2b2b', hat: null },
  { skin: '#e8b07d', shirt: '#c94f4f', hair: '#4a2f1d', hat: 'cap' },
  { skin: '#f6d7a8', shirt: '#5da271', hair: '#1d1d1d', hat: null },
  { skin: '#d9a066', shirt: '#8e6cc8', hair: '#6b6b6b', hat: 'cap' },
  { skin: '#f2c89b', shirt: '#e08a2e', hair: '#2b2b2b', hat: 'hijab' },
  { skin: '#e8b07d', shirt: '#2e8b8b', hair: '#3d2b1f', hat: null },
];
