import React, { useState, useEffect, memo } from 'react';
import Shuffle from './Shuffle';
import { GameState, Room, SkinSettings, Skill } from '../types';
import { isValidSolanaAddress } from '../constants';
import { UserWallet, truncateAddress } from '../utils/walletUtils';
import { drawPlayer } from '../utils/drawUtils';
import WalletManager from './WalletManager';
import Leaderboard from './Leaderboard';

interface GameUIProps {
  gameState: GameState;
  score: number;
  gameSpeed: number;
  startGame: () => void;
  restartGame: () => void;
  goToMenu: () => void;
  activeRoom: Room | null;
  metaCoins: Room[];
  createdCoins: Room[];
  selectRoom: (room: Room) => void;
  addCustomCoin: (contractAddress: string, name?: string) => Promise<boolean>;
  removeCustomCoin: (coinId: string) => void;
  user: UserWallet | null;
  solPrice: number;
  onWithdraw: (amount: number) => void;
  onLogout: () => void;
  // Shop Props
  skins: SkinSettings[];
  skills: Skill[];
  ownedSkins: string[]; // IDs
  ownedSkills: string[]; // IDs
  buySkin: (id: string) => void;
  buySkill: (id: string) => void;
  equipSkin: (id: string) => void;
  equipSkill: (id: string) => void;
  selectedSkinId: string;
  activeSkillIds: string[];
  caAddress: string;
}

// Helper to format large numbers for Market Cap
const formatMC = (num: number) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(2) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toLocaleString();
};

// Animated number component - Memoized
const AnimatedNumber = memo<{ value: number; decimals?: number; prefix?: string; suffix?: string }>(({
  value,
  decimals = 2,
  prefix = '',
  suffix = ''
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const duration = 300;
    const startValue = displayValue;
    const diff = value - startValue;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + diff * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <>{prefix}{displayValue.toFixed(decimals)}{suffix}</>;
});

AnimatedNumber.displayName = 'AnimatedNumber';

// Token Logo Component
const TokenLogo = memo<{ logoUrl: string | null; ticker: string; size?: number }>(({
  logoUrl,
  ticker,
  size = 32
}) => {
  const [error, setError] = useState(false);

  if (!logoUrl || error) {
    // Fallback to first letter of ticker
    return (
      <div
        className="rounded-full bg-slate-700 flex items-center justify-center text-white font-bold"
        style={{ width: size, height: size, fontSize: size * 0.5 }}
      >
        {ticker?.charAt(0) || '?'}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={ticker}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
      onError={() => setError(true)}
    />
  );
});

TokenLogo.displayName = 'TokenLogo';

// Room Card Component - Memoized for performance
const RoomCard = memo<{
  room: Room;
  onClick: () => void;
  onRemove?: () => void;
  showRemove?: boolean;
}>(({ room, onClick, onRemove, showRemove }) => (
  <div className="relative group">
    <button
      onClick={onClick}
      className="minecraft-panel-dark p-5 transition-all duration-100 hover:scale-[1.02] text-left flex flex-col justify-between min-h-[160px] w-full relative overflow-hidden"
      style={{ borderLeftWidth: '4px', borderLeftColor: room.themeColor }}
    >
      <div className="flex items-start gap-3">
        <TokenLogo logoUrl={room.logoUrl} ticker={room.ticker} size={40} />
        <div className="flex-1 min-w-0">
          <div
            className="text-xl font-bold mb-1 group-hover:text-white transition-colors pixel-font truncate"
            style={{ color: room.themeColor }}
          >
            ${room.ticker}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {room.pairName || room.name}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-xs text-slate-500 mb-1">
          {room.isLoading ? (
            <span className="animate-pulse">Loading...</span>
          ) : room.lastFetchError ? (
            <span className="text-red-400">Data Unavailable</span>
          ) : (
            <>MC: ${formatMC(room.currentMarketCap)}</>
          )}
        </div>
        <div className="flex justify-between items-center">
          <div className="text-xs text-slate-600">
            LIQ: ${formatMC(room.liquidity)}
          </div>
          <div className={`text-lg font-bold transition-colors pixel-font ${room.multiplier >= 1 ? 'text-green-400' : 'text-red-400'
            }`}>
            {room.isLoading ? '...' : `${room.multiplier.toFixed(2)}x`}
          </div>
        </div>
      </div>

      {/* Hover Glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${room.themeColor}, transparent)` }}
      />
    </button>

    {/* Remove button removed - custom coins are now auto-cleaned */}
  </div>
));

RoomCard.displayName = 'RoomCard';

// Skin Preview Component - Uses the actual game drawing logic (Memoized)
const SkinPreview = memo<{ skin: SkinSettings }>(({ skin }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false; // Keep pixel art look

    // Dummy player for preview
    // Center in 60x60 logical canvas
    // Player is roughly 40x40
    const dummyPlayer: any = {
      x: 10,
      y: 10,
      width: 40,
      height: 40,
      isJumping: false,
      color: skin.hoodieColor,
      // Velocity properties needed by type but ignored by draw logic can be mocked
      vy: 0
    };

    // Draw frame 0 (Idle)
    drawPlayer(ctx, dummyPlayer, 0, skin);

  }, [skin]);

  return <canvas ref={canvasRef} width={60} height={60} className="w-16 h-16 object-contain pixelated" />;
});

SkinPreview.displayName = 'SkinPreview';

// Main GameUI Component - Memoized
const GameUI = memo<GameUIProps>(({
  gameState,
  score,
  gameSpeed,
  startGame,
  restartGame,
  goToMenu,
  activeRoom,
  metaCoins,
  createdCoins,
  selectRoom,
  addCustomCoin,
  removeCustomCoin,
  user,
  solPrice,
  onWithdraw,
  onLogout,
  skins = [],
  skills = [],
  ownedSkins = [],
  ownedSkills = [],
  buySkin,
  buySkill,
  equipSkin,
  equipSkill,
  selectedSkinId,
  activeSkillIds = [],
  caAddress
}) => {
  const [showCopied, setShowCopied] = useState(false);

  const handleCopyCA = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!caAddress) return;
    navigator.clipboard.writeText(caAddress);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };
  // Shop State
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [shopTab, setShopTab] = useState<'skins' | 'skills'>('skins');
  // Form state for adding custom coins
  const [contractInput, setContractInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isVerifyingCoin, setIsVerifyingCoin] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate input on change
  useEffect(() => {
    if (contractInput.length > 0) {
      if (!isValidSolanaAddress(contractInput)) {
        setValidationError('Invalid Solana address format (32-44 base58 characters)');
      } else {
        setValidationError(null);
      }
    } else {
      setValidationError(null);
    }
  }, [contractInput]);

  const handleAddCoin = async () => {
    if (!contractInput.trim()) {
      setValidationError('Please enter a contract address');
      return;
    }

    if (validationError) {
      return;
    }

    // Start verification
    setIsVerifyingCoin(true);

    try {
      const success = await addCustomCoin(contractInput.trim(), nameInput.trim() || undefined);

      if (success) {
        setContractInput('');
        setNameInput('');
        setIsAdding(false);
        setValidationError(null);
      }
    } finally {
      setIsVerifyingCoin(false);
    }
  };

  // Flash state for visual feedback
  const flashClass = activeRoom?.flashState === 'green'
    ? 'flash-green'
    : activeRoom?.flashState === 'red'
      ? 'flash-red'
      : '';

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-20">

      {/* HUD (Only visible when NOT in MENU) */}
      {gameState !== GameState.MENU && activeRoom && (
        <div className="flex justify-between items-start w-full gap-4">

          {/* Portfolio / Score */}
          <div className="minecraft-panel-dark px-4 py-2 flex-1 max-w-xs pointer-events-auto">
            <div className="text-xs text-slate-400 mb-1">EARNINGS</div>
            <div className="text-2xl font-bold text-solana pixel-font flex items-center gap-1">
              <span className="text-xl">$</span>
              <AnimatedNumber value={score} prefix="" suffix="" />
              <span className="text-sm text-slate-500">USD</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">$0.02 per coin</div>
          </div>

          {/* ROOM INFO with Logo */}
          <div
            className={`minecraft-panel-dark px-6 py-2 flex-1 text-center transition-all duration-100 pointer-events-auto ${flashClass}`}
            style={{ borderBottom: `4px solid ${activeRoom.themeColor}` }}
          >
            <div className="flex items-center justify-center gap-3 mb-1">
              <TokenLogo logoUrl={activeRoom.logoUrl} ticker={activeRoom.ticker} size={28} />
              <div>
                <div className="text-xs text-slate-400">
                  COIN
                </div>
                <div className="text-2xl font-bold pixel-font transition-colors duration-300" style={{ color: activeRoom.themeColor }}>
                  ${activeRoom.ticker}
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              MC: ${formatMC(activeRoom.currentMarketCap)} | LIQ: ${formatMC(activeRoom.liquidity)}
            </div>
            {activeRoom.lastFetchError && (
              <div className="text-xs text-yellow-400 animate-pulse">⚠ Connection Issue</div>
            )}
          </div>

          {/* Multiplier */}
          <div className={`minecraft-panel-dark px-4 py-2 flex-1 max-w-xs text-right transition-all duration-100 pointer-events-auto ${flashClass}`}>
            <div className="text-xs text-slate-400 mb-1">ACTIVE REWARDS</div>
            <div className={`text-2xl font-bold pixel-font transition-all duration-500 ${activeRoom.multiplier > 1.2 ? 'text-glow-green' :
              activeRoom.multiplier < 0.8 ? 'text-glow-red' : 'text-white'
              }`}>
              <AnimatedNumber value={activeRoom.multiplier} suffix="x" />
            </div>
            <div className="text-xs text-slate-500 mt-1">SPEED: {gameSpeed.toFixed(1)}x</div>
            {activeRoom.flashState === 'green' && (
              <div className="text-green-400 text-xs animate-pulse">▲ PUMPING</div>
            )}
            {activeRoom.flashState === 'red' && (
              <div className="text-red-400 text-xs animate-pulse">▼ DUMPING</div>
            )}
          </div>
        </div>
      )}

      {/* CENTER OVERLAYS */}
      <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">

        {/* DASHBOARD (MENU) - Full Page Landing */}
        {gameState === GameState.MENU && (
          <div className="fixed inset-0 w-full h-full bg-slate-950 flex flex-col py-12 px-6 pointer-events-auto overflow-y-auto z-40">
            {/* Hero Section */}
            <div className="text-center mb-12 relative">

              {/* LEADERBOARD - Top Left */}
              <div className="fixed top-6 left-6 z-50">
                <Leaderboard />
              </div>

              {/* User Info & Wallet Manager */}
              {user && (
                <div className="fixed top-6 right-6 z-50 hidden md:block">
                  <WalletManager user={user} solPrice={solPrice} onWithdraw={onWithdraw} onLogout={onLogout} />
                </div>
              )}
              <div className="mb-4 flex flex-wrap justify-center gap-4 md:gap-6">
                <Shuffle
                  text="Rugs"
                  className="text-5xl md:text-6xl font-bold pixel-font tracking-widest drop-shadow-lg text-shadow"
                  style={{ color: '#ff3131' }}
                  shuffleDirection="right"
                  tag="span"
                  loop={true}
                  triggerOnHover={false}
                />
                <Shuffle
                  text="Runner"
                  className="text-5xl md:text-6xl font-bold pixel-font tracking-widest drop-shadow-lg text-shadow"
                  style={{ color: '#00bf63' }}
                  shuffleDirection="right"
                  tag="span"
                  loop={true}
                  triggerOnHover={false}
                />
              </div>

              {caAddress && (
                <div
                  onClick={handleCopyCA}
                  className="group flex flex-col items-center justify-center mb-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-slate-400 font-bold">CA:</span>
                    <span className="text-lg text-slate-200 font-mono tracking-wider group-hover:text-white transition-colors border-b border-transparent group-hover:border-white/50">
                      {caAddress}
                    </span>
                    <span className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                      📋
                    </span>
                  </div>
                  <div className={`text-xs text-green-400 font-bold transition-all duration-300 ${showCopied ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                    COPIED TO CLIPBOARD!
                  </div>
                </div>
              )}
              {!caAddress && (
                <p className="text-lg text-slate-400 mb-2">Mine tokens in real-time • Powered by DexScreener</p>
              )}

              <button
                onClick={() => setIsShopOpen(true)}
                className="mt-6 btn-minecraft btn-minecraft-gold px-8 py-3 font-bold tracking-wider"
              >
                ITEM SHOP
              </button>

              <div className="mt-8 mx-auto w-64 h-2 bg-slate-700"></div>
            </div>

            {/* COINS SECTION */}
            <div className="max-w-7xl mx-auto w-full mb-16">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30"></div>
                <h2 className="text-2xl font-bold text-purple-400 pixel-font tracking-wider flex items-center gap-3">
                  <span className="text-3xl">🪙</span> COINS
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-purple-500 via-transparent to-transparent opacity-30"></div>
              </div>
              <p className="text-slate-500 text-sm text-center mb-6">Trade and run with your favorite tokens</p>

              {/* Create New Coin Form */}
              <div className="minecraft-panel px-6 py-6 mb-8 max-w-2xl mx-auto">
                {!isAdding ? (
                  <button
                    onClick={() => setIsAdding(true)}
                    className="w-full py-4 border-4 border-dashed border-slate-500 text-slate-700 hover:border-slate-800 hover:text-slate-900 transition-all flex items-center justify-center gap-3 text-lg font-bold"
                  >
                    <span className="text-2xl">+</span>
                    Create new coin
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-800 mb-2 font-bold">Contract Address (CA) *</label>
                      <input
                        type="text"
                        value={contractInput}
                        onChange={(e) => setContractInput(e.target.value)}
                        placeholder="Enter Solana token contract address..."
                        className={`w-full px-4 py-3 bg-slate-800 border-4 text-white placeholder-slate-500 focus:outline-none transition-colors font-mono text-sm ${validationError ? 'border-red-500' : 'border-slate-600'
                          }`}
                      />
                      {validationError && (
                        <p className="text-red-500 text-xs mt-2 font-bold">{validationError}</p>
                      )}
                      <p className="text-slate-600 text-xs mt-2">
                        Example: DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setIsAdding(false);
                          setContractInput('');
                          setNameInput('');
                          setValidationError(null);
                        }}
                        disabled={isVerifyingCoin}
                        className="flex-1 btn-minecraft"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddCoin}
                        disabled={!!validationError || !contractInput.trim() || isVerifyingCoin}
                        className={`flex-1 btn-minecraft btn-minecraft-green ${validationError || !contractInput.trim() || isVerifyingCoin
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                          }`}
                      >
                        {isVerifyingCoin ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Verifying...
                          </>
                        ) : (
                          'Add Coin'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* All Coins Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[...metaCoins, ...createdCoins].map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onClick={() => selectRoom(room)}
                    onRemove={() => removeCustomCoin(room.id)}
                    showRemove={!room.isMeta}
                  />
                ))}
              </div>
            </div>

          </div>
        )}

        {/* START SCREEN */}
        {/* START SCREEN POPUP */}
        {gameState === GameState.START && activeRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative minecraft-panel-dark w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-y-auto animate-In p-6">

              {/* Header / Token Info */}
              <div className="flex items-center justify-center gap-4 mb-6 pb-6 border-b border-slate-700">
                <TokenLogo logoUrl={activeRoom.logoUrl} ticker={activeRoom.ticker} size={48} />
                <div className="text-left">
                  <div className="text-xs text-slate-500 uppercase tracking-wider">
                    COIN
                  </div>
                  <h1 className="text-4xl font-bold pixel-font tracking-widest" style={{ color: activeRoom.themeColor }}>
                    ${activeRoom.ticker}
                  </h1>
                </div>
              </div>

              {/* Market Stats */}
              {!activeRoom.isLoading && !activeRoom.lastFetchError && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-800/50 p-3 rounded">
                    <div className="text-xs text-slate-500">MARKET CAP</div>
                    <div className="text-xl font-bold text-white">${formatMC(activeRoom.currentMarketCap || activeRoom.initialMarketCap)}</div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded">
                    <div className="text-xs text-slate-500">MULTIPLIER</div>
                    <div className="text-xl font-bold" style={{ color: activeRoom.themeColor }}>{activeRoom.multiplier.toFixed(2)}x</div>
                  </div>
                </div>
              )}

              {/* SKILL SELECTION */}
              <div className="mb-8">
                <div className="flex justify-between items-end mb-4 border-b border-slate-700 pb-2">
                  <div>
                    <h3 className="text-xl font-bold text-purple-400 pixel-font">BUY POWER-UPS</h3>
                    <p className="text-xs text-slate-500">Select for this round</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-bold pixel-font ${activeSkillIds.length === 3 ? 'text-red-400' : 'text-slate-400'}`}>{activeSkillIds.length}/3</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {skills.map(skill => {
                    const isSelected = activeSkillIds.includes(skill.id);
                    return (
                      <button
                        key={skill.id}
                        onClick={() => equipSkill(skill.id)}
                        className={`p-3 rounded-lg border-2 text-left transition-all relative overflow-hidden group ${isSelected ? 'border-purple-500 bg-purple-900/30' : 'border-slate-700 bg-slate-800 hover:border-slate-500'}`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-2xl mb-2 block">{skill.icon}</span>
                          {isSelected && <span className="text-purple-400 text-xs font-bold">READY</span>}
                        </div>
                        <div className="font-bold text-sm text-white">{skill.name}</div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-1">{skill.description}</div>

                        {/* Price Tag or Free */}
                        <div className="mt-2 text-xs font-bold text-green-400">
                          {skill.cost > 0 ? `$${skill.cost}` : 'FREE'}
                        </div>

                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="text-[10px] font-mono bg-slate-950 px-1 rounded text-slate-300">
                            {skill.durationMs > 0 ? 'Active (Slot 1-3)' : 'Passive'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-auto">
                <button
                  onClick={goToMenu}
                  className="btn-minecraft flex-1 py-4 text-xl font-bold tracking-wider"
                >
                  CANCEL
                </button>
                <button
                  onClick={startGame}
                  disabled={activeRoom.isLoading || activeRoom.lastFetchError}
                  className={`btn-minecraft btn-minecraft-green flex-1 py-4 text-xl font-bold tracking-wider text-white ${activeRoom.isLoading || activeRoom.lastFetchError ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  START GAME
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GAME OVER SCREEN */}
        {gameState === GameState.GAMEOVER && activeRoom && (
          <div className="minecraft-panel-dark p-8 max-w-md w-full text-center pointer-events-auto border-red-900/50 shadow-red-900/20">
            <h1 className="text-7xl font-bold mb-4 text-red-600 pixel-font shake tracking-tighter" style={{ textShadow: '4px 4px 0px #450a0a' }}>
              RUGGED
            </h1>

            <div className="bg-red-950/30 border border-red-900/50 p-4 mb-8">
              <div className="text-red-400 text-sm mb-1 uppercase tracking-widest">Total Earnings</div>
              <div className="text-4xl text-white font-bold pixel-font">${score.toFixed(2)} USD</div>
              <div className="text-xs text-slate-500 mt-2">
                Final Multiplier: {activeRoom.multiplier.toFixed(2)}x
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={restartGame}
                className="btn-minecraft btn-minecraft-red w-full py-3 text-xl font-bold tracking-wider"
              >
                RE-ENTER ${activeRoom.ticker}
              </button>
              <button
                onClick={goToMenu}
                className="btn-minecraft w-full py-3 text-xl font-bold tracking-wider"
              >
                DASHBOARD
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER / TICKER */}
      {
        gameState === GameState.PLAYING && activeRoom && (
          <div className="absolute bottom-4 left-0 right-0 text-center opacity-50 text-xs pixel-font text-green-800">
          // LIVE :: ${activeRoom.ticker} :: ${formatMC(activeRoom.currentMarketCap)} :: BASE ${formatMC(activeRoom.initialMarketCap)} :: {activeRoom.multiplier.toFixed(2)}x //
          </div>
        )
      }


      {/* SHOP MODAL */}
      {
        isShopOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsShopOpen(false)} />
            <div className="relative minecraft-panel-dark w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-In">

              {/* Header */}
              <div className="p-6 border-b-4 border-black flex justify-between items-center bg-[#111]">
                <h2 className="text-3xl font-bold text-white pixel-font text-shadow">
                  ITEM SHOP
                </h2>
                <button onClick={() => setIsShopOpen(false)} className="text-slate-400 hover:text-white text-2xl">
                  ✕
                </button>
              </div>

              <div className="flex border-b border-slate-700">
                <div
                  className="flex-1 py-4 text-center font-bold tracking-wider text-purple-400 border-b-2 border-purple-500"
                >
                  SKINS ({skins.length})
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {skins.map(skin => {
                    const isOwned = ownedSkins.includes(skin.id);
                    const isEquipped = selectedSkinId === skin.id;

                    return (
                      <div key={skin.id} className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 relative ${isEquipped ? 'border-green-500 bg-green-900/20' : 'border-slate-700 bg-slate-800 hover:border-purple-500'}`}>
                        {/* Preview Placeholder */}
                        <div className="w-20 h-20 flex items-center justify-center bg-slate-900/50 rounded-lg mb-2">
                          <SkinPreview skin={skin} />
                        </div>

                        <div className="text-center">
                          <div className="font-bold text-white mb-1">{skin.name}</div>
                          <div className="text-xs text-slate-400 uppercase">{skin.accessory}</div>
                        </div>

                        <button
                          onClick={() => isOwned ? equipSkin(skin.id) : buySkin(skin.id)}
                          className={`w-full py-2 rounded font-bold text-sm ${isEquipped ? 'bg-green-600 text-white cursor-default' : isOwned ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}
                        >
                          {isEquipped ? 'EQUIPPED' : isOwned ? 'EQUIP' : 'FREE'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )
      }
    </div >
  );
});

GameUI.displayName = 'GameUI';

export default GameUI;