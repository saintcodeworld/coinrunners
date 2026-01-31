export enum GameState {
  MENU = 'MENU',
  START = 'START',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
}

export enum ObstacleType {
  CANDLE = 'CANDLE',
  LINK = 'LINK',
  HALT = 'HALT',
  // Portal removed as per request
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Player extends Entity {
  vy: number; // Vertical velocity
  isJumping: boolean;
  color: string;
}

export interface Obstacle extends Entity {
  type: ObstacleType;
  passed: boolean; // For scoring or internal logic
}

export interface Coin extends Entity {
  collected: boolean;
  value: number;
  type: 'green' | 'red';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface Room {
  id: string;
  name: string;
  tokenAddress: string;
  pairAddress: string; // DexScreener pair address for API calls
  initialMarketCap: number; // Set on room entry, stays constant (1.00x baseline)
  currentMarketCap: number; // Updated real-time every 10s
  previousMarketCap: number; // For tracking direction (flash green/red)
  themeColor: string; // Hex for background tint
  multiplier: number; // Calculated using sensitivity formula
  flashState: 'none' | 'green' | 'red'; // For visual feedback
  isLoading: boolean; // Loading state during initial fetch
  isMeta: boolean; // true = Meta Coin (preset), false = Created Coin (user added)
  priceHistory: PricePoint[]; // Historical price data for dynamic chart
  // New metadata fields from DexScreener
  ticker: string; // Symbol like "BONK", "WIF"
  logoUrl: string | null; // Token logo URL from DexScreener
  pairName: string | null; // Pair name like "BONK/SOL"
  liquidity: number; // Current liquidity in USD
  lastFetchError: boolean; // True if last fetch failed
  lastAccessed: number; // Timestamp for auto-cleanup
  cleanupDuration?: number; // Optional: Minutes until inactive deletion (0 or undefined = Never)
}

// Price point for chart visualization
export interface PricePoint {
  timestamp: number;
  marketCap: number;
  normalizedValue: number; // 0-1 scale relative to initial market cap
}

// DexScreener API response types
export interface DexScreenerPair {
  chainId: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    symbol: string;
  };
  priceUsd: string;
  fdv: number;
  marketCap: number;
  liquidity: {
    usd: number;
  };
  info?: {
    imageUrl?: string;
  };
}

export interface DexScreenerResponse {
  pairs: DexScreenerPair[] | null;
}


export interface SkinSettings {
  id: string;
  name: string;
  hoodieColor: string;
  pantsColor: string;
  skinColor: string;
  accessory: 'none' | 'sunglasses' | 'hat' | 'cap' | 'headphones' | 'bandana' | 'tophat' | 'crown' | 'mask' | 'visor' | 'hair';
  accessoryColor?: string;
  // Visual customization
  model?: 'human' | 'penguin' | 'lobster' | 'robot' | 'skeleton' | 'dog';
  headScale?: number; // Default 1.0
  bodyScale?: number; // Default 1.0 (width multiplier)
  // Extra Cosmetics
  chain?: boolean;
  footwear?: 'none' | 'boots' | 'sneakers' | 'flippers' | 'shoes';
}

export enum SkillType {
  LONG_JUMP = 'LONG_JUMP',
  SPEED_BOOST = 'SPEED_BOOST',
  SLOW_MOTION = 'SLOW_MOTION',
  SHIELD = 'SHIELD',
  INVISIBILITY = 'INVISIBILITY',
  MAGNET = 'MAGNET',
  DIAMOND_HANDS = 'DIAMOND_HANDS',
  WHALE_MODE = 'WHALE_MODE',
  LASER_EYES = 'LASER_EYES',
  TO_THE_MOON = 'TO_THE_MOON',
  RUG_INSURANCE = 'RUG_INSURANCE',
}

export interface Skill {
  id: string;
  type: SkillType;
  name: string;
  description: string;
  durationMs: number; // Duration of effect
  cooldownMs: number; // Time before reuse
  cost: number;
  triggerKey?: string; // e.g. 'S', 'Z'
  icon: string; // Emoji character for now
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}
