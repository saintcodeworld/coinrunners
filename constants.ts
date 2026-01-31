import { Room, SkillType } from './types';

export const CHAT_SERVER_URL = 'ws://localhost:8080'; // Local backend websocket for development

// Physics
export const GRAVITY = 0.6;
export const JUMP_FORCE = -13;
export const GAME_SPEED_INITIAL = 6;
export const MAX_GAME_SPEED = 12;
export const SPEED_INCREMENT = 0.001;

// Dimensions
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 400;
export const FLOOR_HEIGHT = 50;
export const PLAYER_SIZE = 40;

// Spawning
export const MIN_OBSTACLE_GAP = 300;
export const MAX_OBSTACLE_GAP = 600;
export const COIN_SIZE = 20;
export const PORTAL_DISTANCE = 2000;

// Colors
export const COLOR_BG = '#111827';
export const COLOR_FLOOR = '#374151';
export const COLOR_PLAYER = '#22c55e';
export const COLOR_SOLANA = '#9945FF';
export const COLOR_RUG = '#ef4444';
export const COLOR_LINK = '#3b82f6';
export const COLOR_HALT = '#eab308';

// ===========================================
// MULTIPLIER SETTINGS
// ===========================================
export const SENSITIVITY = 1;
export const FLOOR_MULTIPLIER = 0.1;
export const FETCH_INTERVAL_MS = 1000; // 1 second - fastest updates

// ===========================================
// SCORING SETTINGS
// ===========================================
export const COIN_VALUE_USD = 0.02; // Each coin collected is worth $0.02 (2 cents)
export const RED_COIN_VALUE_USD = -0.01; // Red coins take away $0.01

// ===========================================
// CHART SETTINGS
// ===========================================
export const MAX_PRICE_HISTORY = 100;
export const CHART_SCROLL_SPEED = 2;

// ===========================================
// THEME COLORS FOR CREATED COINS
// ===========================================
export const RANDOM_THEME_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#00CED1', '#FF69B4', '#7FFF00', '#FF4500'
];

// ===========================================
// VALIDATION UTILITIES
// ===========================================
// Solana address is base58 encoded and 32-44 characters
export const isValidSolanaAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') return false;
  // Solana addresses are 32-44 characters, base58 encoded
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
};

// ===========================================
// META COINS - 3 preset coins with full metadata
// Using real DexScreener-compatible token addresses
// ===========================================
export const META_COINS: Room[] = [
  {
    id: 'fartcoin',
    name: '$FARTCOIN',
    ticker: 'FARTCOIN',
    // FARTCOIN - active memecoin on Solana
    tokenAddress: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump',
    pairAddress: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump',
    initialMarketCap: 0,
    currentMarketCap: 0,
    previousMarketCap: 0,
    themeColor: '#9945FF',
    multiplier: 1,
    flashState: 'none',
    isLoading: true,
    isMeta: true,
    priceHistory: [],
    logoUrl: null,
    pairName: null,
    liquidity: 0,
    lastFetchError: false,
    lastAccessed: 0,
  },
  {
    id: 'bonk',
    name: '$BONK',
    ticker: 'BONK',
    // BONK - verified working address
    tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    pairAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    initialMarketCap: 0,
    currentMarketCap: 0,
    previousMarketCap: 0,
    themeColor: '#FFA500',
    multiplier: 1,
    flashState: 'none',
    isLoading: true,
    isMeta: true,
    priceHistory: [],
    logoUrl: null,
    pairName: null,
    liquidity: 0,
    lastFetchError: false,
    lastAccessed: 0,
  },
  {
    id: 'wif',
    name: '$WIF',
    ticker: 'WIF',
    // WIF (dogwifhat) - correct address
    tokenAddress: 'EKpQGSJtjMFqKZ9KQnvvSB3MVVDHn8aLNbHrTYJmKKED',
    pairAddress: 'EKpQGSJtjMFqKZ9KQnvvSB3MVVDHn8aLNbHrTYJmKKED',
    initialMarketCap: 0,
    currentMarketCap: 0,
    previousMarketCap: 0,
    themeColor: '#8B4513',
    multiplier: 1,
    flashState: 'none',
    isLoading: true,
    isMeta: true,
    priceHistory: [],
    logoUrl: null,
    pairName: null,
    liquidity: 0,
    lastFetchError: false,
    lastAccessed: 0,
  },
];

// ===========================================
// SKINS
// ===========================================
export const SKINS: import('./types').SkinSettings[] = [
  // 1. Standard
  { id: 'default', name: 'Original Degen', hoodieColor: '#22c55e', pantsColor: '#1e293b', skinColor: '#fca5a5', accessory: 'sunglasses', model: 'human', footwear: 'sneakers' },
  // 2. Business
  { id: 'business', name: 'Corporate Shill', hoodieColor: '#374151', pantsColor: '#111827', skinColor: '#e0ac69', accessory: 'tophat', accessoryColor: '#000000', model: 'human', chain: true, footwear: 'boots' },
  // 3. Big Brain
  { id: 'brain', name: 'Big Brain', hoodieColor: '#ec4899', pantsColor: '#be185d', skinColor: '#fbcfe8', accessory: 'none', model: 'human', headScale: 1.6, bodyScale: 0.8, footwear: 'sneakers' },
  // 4. Ninja
  { id: 'ninja', name: 'Shadow Coder', hoodieColor: '#171717', pantsColor: '#0a0a0a', skinColor: '#262626', accessory: 'bandana', accessoryColor: '#ef4444', model: 'human', footwear: 'boots' },
  // 5. Golden
  { id: 'gold', name: 'Whale God', hoodieColor: '#fbbf24', pantsColor: '#b45309', skinColor: '#fcd34d', accessory: 'crown', accessoryColor: '#ffffff', model: 'human', bodyScale: 1.2, chain: true },
  // 6. Cyber
  { id: 'cyber', name: 'Cyber Degen', hoodieColor: '#0ea5e9', pantsColor: '#0369a1', skinColor: '#94a3b8', accessory: 'visor', accessoryColor: '#f472b6', model: 'human', footwear: 'sneakers' },
  // 7. Yeti
  { id: 'yeti', name: 'Abominable', hoodieColor: '#f8fafc', pantsColor: '#cbd5e1', skinColor: '#bae6fd', accessory: 'none', model: 'human', bodyScale: 1.4, headScale: 1.0, footwear: 'none' },
  // 8. Devil
  { id: 'devil', name: 'Rekt Demon', hoodieColor: '#991b1b', pantsColor: '#450a0a', skinColor: '#ef4444', accessory: 'mask', accessoryColor: '#7f1d1d', model: 'human', chain: true, footwear: 'boots' },
  // 9. Gnome
  { id: 'gnome', name: 'Garden Gnome', hoodieColor: '#2563eb', pantsColor: '#16a34a', skinColor: '#fca5a5', accessory: 'hat', accessoryColor: '#dc2626', model: 'human', bodyScale: 0.7, headScale: 0.8, footwear: 'boots' },
  // 10. Alien
  { id: 'alien', name: 'Moon Visitor', hoodieColor: '#10b981', pantsColor: '#064e3b', skinColor: '#a7f3d0', accessory: 'headphones', accessoryColor: '#6366f1', model: 'human', headScale: 1.2, bodyScale: 0.6, footwear: 'none' },

  // SPECIALS
  { id: 'penguin', name: 'Pudgy', hoodieColor: '#0f172a', pantsColor: '#fff', skinColor: '#fff', accessory: 'none', model: 'penguin' },
  { id: 'lobster', name: 'Lobster DAO', hoodieColor: '#dc2626', pantsColor: '#991b1b', skinColor: '#ef4444', accessory: 'none', model: 'lobster' },
];

// ===========================================
// SKILLS
// ===========================================
export const SKILLS: import('./types').Skill[] = [
  {
    id: 'long_jump',
    type: SkillType.LONG_JUMP,
    name: 'Moon Boots',
    description: 'Jump 2x higher! (Passive)',
    durationMs: 0, // Passive
    cooldownMs: 0,
    cost: 0,
    icon: '👟'
  },
  {
    id: 'speed_boost',
    type: SkillType.SPEED_BOOST,
    name: 'Rocket Fuel',
    description: 'Press "S" to go 2x speed for 10s',
    durationMs: 10000,
    cooldownMs: 20000,
    cost: 0,
    triggerKey: 'S',
    icon: '🚀'
  },
  {
    id: 'skill_slow',
    type: SkillType.SLOW_MOTION,
    name: 'Matrix Mode',
    description: 'Slow down time to 0.5x speed for precision dodging',
    durationMs: 10000,
    cooldownMs: 20000,
    cost: 300,
    triggerKey: 'Z',
    icon: '⏳'
  },
  {
    id: 'skill_shield',
    type: SkillType.SHIELD,
    name: 'Second Chance',
    description: 'Survive one collision per run. You trip, but get back up!',
    durationMs: 3000, // Invulnerability duration after trip
    cooldownMs: 0, // Passive / One-per-run
    cost: 500,
    triggerKey: undefined, // Passive
    icon: '🛡️'
  },
  {
    id: 'skill_invis',
    type: SkillType.INVISIBILITY,
    name: 'Ghost Walk',
    description: 'Phase through obstacles unharmed for 7 seconds',
    durationMs: 7000,
    cooldownMs: 50000,
    cost: 750,
    triggerKey: 'I',
    icon: '👻'
  },
  {
    id: 'skill_magnet',
    type: SkillType.MAGNET,
    name: 'Coin Magnet',
    description: 'Attract all nearby coins (One use per run!)',
    durationMs: 10000, // Magnet duration
    cooldownMs: 999999, // Effectively infinite (one use)
    cost: 600,
    triggerKey: 'M',
    icon: '🧲'
  }
];
