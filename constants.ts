import { Room, SkillType } from './types';

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
export const SENSITIVITY = 5;
export const FLOOR_MULTIPLIER = 0.1;
export const FETCH_INTERVAL_MS = 5000; // 5 seconds - faster updates

// ===========================================
// SCORING SETTINGS
// ===========================================
export const COIN_VALUE_USD = 0.02; // Each coin collected is worth $0.02 (2 cents)

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
  { id: 'default', name: 'Original Degen', hoodieColor: '#22c55e', pantsColor: '#1e293b', skinColor: '#fca5a5', accessory: 'sunglasses' },
  { id: 'pepe', name: 'Froggy', hoodieColor: '#4c9f70', pantsColor: '#1a4731', skinColor: '#74c69d', accessory: 'none' },
  { id: 'chad', name: 'Giga Chad', hoodieColor: '#000000', pantsColor: '#333333', skinColor: '#e0ac69', accessory: 'mask' },
  { id: 'punk', name: 'Sol Punk', hoodieColor: '#a855f7', pantsColor: '#242424', skinColor: '#ffbf00', accessory: 'headphones' },
  { id: 'doge', name: 'Doge', hoodieColor: '#eab308', pantsColor: '#854d0e', skinColor: '#fcd34d', accessory: 'hat', accessoryColor: '#ef4444' },
  { id: 'alien', name: 'Alien', hoodieColor: '#10b981', pantsColor: '#064e3b', skinColor: '#6ee7b7', accessory: 'visor', accessoryColor: '#ec4899' },
  { id: 'king', name: 'Whale King', hoodieColor: '#3b82f6', pantsColor: '#1e3a8a', skinColor: '#fca5a5', accessory: 'crown', accessoryColor: '#fbbf24' },
  { id: 'ninja', name: 'Code Ninja', hoodieColor: '#111827', pantsColor: '#000000', skinColor: '#e5e7eb', accessory: 'bandana', accessoryColor: '#ef4444' },
  { id: 'gentleman', name: 'Sir Degen', hoodieColor: '#4b5563', pantsColor: '#1f2937', skinColor: '#fca5a5', accessory: 'tophat', accessoryColor: '#000000' },
  { id: 'solana', name: 'Solana Man', hoodieColor: '#9945FF', pantsColor: '#14F195', skinColor: '#fca5a5', accessory: 'cap', accessoryColor: '#000000' },
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
