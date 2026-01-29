import React, { useState, useEffect, memo } from 'react';
import { GameState, Room, SkinSettings, Skill } from '../types';
import { isValidSolanaAddress } from '../constants';
import { UserWallet, truncateAddress } from '../utils/walletUtils';
import WalletManager from './WalletManager';

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
      className="terminal-card bg-slate-900/80 backdrop-blur p-5 hover:bg-slate-800 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 text-left flex flex-col justify-between min-h-[160px] w-full border border-slate-700/50 rounded-xl relative overflow-hidden"
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
  skins = [],
  skills = [],
  ownedSkins = [],
  ownedSkills = [],
  buySkin,
  buySkill,
  equipSkin,
  equipSkill,
  selectedSkinId,
  activeSkillIds = []
}) => {
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
          <div className="terminal-card bg-slate-900 px-4 py-2 flex-1 max-w-xs pointer-events-auto">
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
            className={`terminal-card bg-slate-900 px-6 py-2 flex-1 text-center border-t-4 transition-all duration-300 pointer-events-auto ${flashClass}`}
            style={{ borderColor: activeRoom.themeColor }}
          >
            <div className="flex items-center justify-center gap-3 mb-1">
              <TokenLogo logoUrl={activeRoom.logoUrl} ticker={activeRoom.ticker} size={28} />
              <div>
                <div className="text-xs text-slate-400">
                  {activeRoom.isMeta ? 'META COIN' : 'CUSTOM COIN'}
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
          <div className={`terminal-card bg-slate-900 px-4 py-2 flex-1 max-w-xs text-right transition-all duration-300 pointer-events-auto ${flashClass}`}>
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
          <div className="min-h-screen w-full bg-slate-950 flex flex-col py-12 px-6 pointer-events-auto overflow-y-auto">
            {/* Hero Section */}
            <div className="text-center mb-12 relative">

              {/* User Info & Wallet Manager */}
              {user && (
                <div className="absolute top-0 right-0 hidden md:block">
                  <WalletManager user={user} solPrice={solPrice} onWithdraw={onWithdraw} />
                </div>
              )}
              <h1 className="text-6xl md:text-7xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400 pixel-font tracking-widest drop-shadow-lg">
                DEGEN TERMINAL
              </h1>
              <p className="text-lg text-slate-400 mb-2">Trade memecoins in real-time • Powered by DexScreener</p>

              <button
                onClick={() => setIsShopOpen(true)}
                className="mt-6 px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg border-2 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all transform hover:scale-105 pixel-font tracking-wider"
              >
                🛍️ ITEM SHOP
              </button>

              <div className="mt-8 mx-auto w-64 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>
            </div>

            {/* META COINS SECTION */}
            <div className="max-w-7xl mx-auto w-full mb-16">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30"></div>
                <h2 className="text-2xl font-bold text-purple-400 pixel-font tracking-wider flex items-center gap-3">
                  <span className="text-3xl">⭐</span> META COINS
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-purple-500 via-transparent to-transparent opacity-30"></div>
              </div>
              <p className="text-slate-500 text-sm text-center mb-6">Featured Solana memecoins with live price tracking</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {metaCoins.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onClick={() => selectRoom(room)}
                  />
                ))}
              </div>
            </div>

            {/* CREATED COINS SECTION */}
            <div className="max-w-7xl mx-auto w-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-30"></div>
                <h2 className="text-2xl font-bold text-orange-400 pixel-font tracking-wider flex items-center gap-3">
                  <span className="text-3xl">🚀</span> CUSTOM COINS
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-orange-500 via-transparent to-transparent opacity-30"></div>
              </div>
              <p className="text-slate-500 text-sm text-center mb-6">Add any Solana token by contract address (CA)</p>

              {/* Add Coin Form */}
              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
                {!isAdding ? (
                  <button
                    onClick={() => setIsAdding(true)}
                    className="w-full py-4 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-orange-500 hover:text-orange-400 transition-all flex items-center justify-center gap-3 text-lg"
                  >
                    <span className="text-2xl">+</span>
                    Add Custom Coin by CA
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Contract Address (CA) *</label>
                      <input
                        type="text"
                        value={contractInput}
                        onChange={(e) => setContractInput(e.target.value)}
                        placeholder="Enter Solana token contract address..."
                        className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none transition-colors font-mono text-sm ${validationError ? 'border-red-500 focus:border-red-400' : 'border-slate-600 focus:border-orange-500'
                          }`}
                      />
                      {validationError && (
                        <p className="text-red-400 text-xs mt-2">{validationError}</p>
                      )}
                      <p className="text-slate-600 text-xs mt-2">
                        Example: DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Display Name (Optional)</label>
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="e.g. My Token"
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                      />
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
                        className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddCoin}
                        disabled={!!validationError || !contractInput.trim() || isVerifyingCoin}
                        className={`flex-1 py-3 rounded-lg text-white font-bold transition-colors flex items-center justify-center gap-2 ${validationError || !contractInput.trim() || isVerifyingCoin
                          ? 'bg-slate-600 cursor-not-allowed opacity-50'
                          : 'bg-orange-600 hover:bg-orange-500'
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

              {/* Created Coins Grid */}
              {createdCoins.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {createdCoins.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onClick={() => selectRoom(room)}
                      onRemove={() => removeCustomCoin(room.id)}
                      showRemove={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-600">
                  <div className="text-4xl mb-4">🪙</div>
                  <p>No custom coins added yet</p>
                  <p className="text-sm mt-2">Paste a Solana contract address to start trading!</p>
                </div>
              )}
            </div>

            {/* API Info */}
            <div className="text-center mt-16 text-slate-600 text-sm space-y-1">
              <p>📊 Data from DexScreener API • Selects highest liquidity pair</p>
              <p>⏱️ Updates every 10 seconds • Sensitivity: 5x</p>
            </div>
          </div>
        )}

        {/* START SCREEN */}
        {gameState === GameState.START && activeRoom && (
          <div className="terminal-card bg-slate-900 p-8 max-w-lg w-full text-center pointer-events-auto transform transition-all duration-300 hover:scale-[1.01]">
            <div className="flex items-center justify-center gap-4 mb-4">
              <TokenLogo logoUrl={activeRoom.logoUrl} ticker={activeRoom.ticker} size={48} />
              <div className="text-left">
                <div className="text-xs text-slate-500 uppercase tracking-wider">
                  {activeRoom.isMeta ? '⭐ META COIN' : '🚀 CUSTOM COIN'}
                </div>
                <h1 className="text-4xl font-bold pixel-font tracking-widest" style={{ color: activeRoom.themeColor }}>
                  ${activeRoom.ticker}
                </h1>
                {activeRoom.pairName && (
                  <div className="text-xs text-slate-500">{activeRoom.pairName}</div>
                )}
              </div>
            </div>

            <div className="h-1 w-full bg-gradient-to-r from-transparent via-white to-transparent mb-6 opacity-20"></div>

            {activeRoom.isLoading ? (
              <div className="text-slate-400 text-lg mb-8">
                <div className="animate-pulse">Fetching market data...</div>
                <div className="text-sm text-slate-600 mt-2">Setting 1.00x baseline</div>
              </div>
            ) : activeRoom.lastFetchError ? (
              <div className="text-red-400 text-lg mb-8">
                <div>⚠ Coin Data Unavailable</div>
                <div className="text-sm text-slate-500 mt-2">Check contract address and try again</div>
              </div>
            ) : (
              <div className="text-slate-300 text-lg mb-8 leading-relaxed">
                <div className="bg-slate-800/50 p-4 rounded mb-4">
                  <div className="text-xs text-slate-500 mb-1">INITIAL MARKET CAP (1.00x BASELINE)</div>
                  <div className="text-2xl font-bold" style={{ color: activeRoom.themeColor }}>
                    ${formatMC(activeRoom.initialMarketCap)}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    Liquidity: ${formatMC(activeRoom.liquidity)}
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  <span className="text-green-400">Price ↑ = Higher Multiplier</span> •
                  <span className="text-red-400 ml-2">Price ↓ = Lower Multiplier</span>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={goToMenu}
                className="btn-retro flex-1 py-4 text-xl font-bold tracking-wider border-slate-600 text-slate-400 hover:bg-slate-800"
              >
                BACK
              </button>
              <button
                onClick={startGame}
                disabled={activeRoom.isLoading || activeRoom.lastFetchError}
                className={`btn-retro flex-1 py-4 text-xl font-bold tracking-wider ${activeRoom.isLoading || activeRoom.lastFetchError ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                style={{
                  borderColor: activeRoom.themeColor,
                  color: activeRoom.themeColor,
                  boxShadow: `0 4px 0 ${activeRoom.themeColor}33`
                }}
              >
                {activeRoom.isLoading ? 'LOADING...' : activeRoom.lastFetchError ? 'UNAVAILABLE' : 'ENTER'}
              </button>
            </div>
          </div>
        )}

        {/* GAME OVER SCREEN */}
        {gameState === GameState.GAMEOVER && activeRoom && (
          <div className="terminal-card bg-slate-900 p-8 max-w-md w-full text-center pointer-events-auto border-red-900/50 shadow-red-900/20">
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
                className="btn-retro btn-retro-red w-full py-3 text-xl font-bold tracking-wider"
              >
                RE-ENTER ${activeRoom.ticker}
              </button>
              <button
                onClick={goToMenu}
                className="btn-retro w-full py-3 text-xl font-bold tracking-wider border-slate-600 text-slate-400 hover:bg-slate-800"
              >
                DASHBOARD
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER / TICKER */}
      {gameState === GameState.PLAYING && activeRoom && (
        <div className="absolute bottom-4 left-0 right-0 text-center opacity-50 text-xs pixel-font text-green-800">
          // LIVE :: ${activeRoom.ticker} :: ${formatMC(activeRoom.currentMarketCap)} :: BASE ${formatMC(activeRoom.initialMarketCap)} :: {activeRoom.multiplier.toFixed(2)}x //
        </div>
      )}


      {/* SHOP MODAL */}
      {
        isShopOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsShopOpen(false)} />
            <div className="relative bg-slate-900 border-2 border-slate-700 w-full max-w-4xl h-[80vh] rounded-xl flex flex-col shadow-2xl overflow-hidden animate-In">

              {/* Header */}
              <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-950">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 pixel-font">
                  ITEM SHOP
                </h2>
                <button onClick={() => setIsShopOpen(false)} className="text-slate-400 hover:text-white text-2xl">
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-700">
                <button
                  className={`flex-1 py-4 text-center font-bold tracking-wider transition-colors ${shopTab === 'skins' ? 'bg-purple-900/30 text-purple-400 border-b-2 border-purple-500' : 'text-slate-500 hover:bg-slate-800'}`}
                  onClick={() => setShopTab('skins')}
                >
                  SKINS ({skins.length})
                </button>
                <button
                  className={`flex-1 py-4 text-center font-bold tracking-wider transition-colors ${shopTab === 'skills' ? 'bg-purple-900/30 text-purple-400 border-b-2 border-purple-500' : 'text-slate-500 hover:bg-slate-800'}`}
                  onClick={() => setShopTab('skills')}
                >
                  SKILLS ({skills.length})
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
                {shopTab === 'skins' ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {skins.map(skin => {
                      const isOwned = ownedSkins.includes(skin.id);
                      const isEquipped = selectedSkinId === skin.id;

                      return (
                        <div key={skin.id} className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 relative ${isEquipped ? 'border-green-500 bg-green-900/20' : 'border-slate-700 bg-slate-800 hover:border-purple-500'}`}>
                          {/* Preview Placeholder */}
                          <div className="w-16 h-16 relative">
                            {/* Simple CSS representation of skin */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-10 rounded-sm" style={{ backgroundColor: skin.pantsColor }} />
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-8 rounded-sm" style={{ backgroundColor: skin.hoodieColor }} />
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-6 rounded-sm" style={{ backgroundColor: skin.skinColor }} />
                            {skin.accessory !== 'none' && (
                              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs">👓</div>
                            )}
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
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {skills.map(skill => {
                      const isOwned = ownedSkills.includes(skill.id);
                      const isActive = activeSkillIds.includes(skill.id);

                      return (
                        <div key={skill.id} className={`p-6 rounded-xl border-2 transition-all flex items-start gap-4 ${isActive ? 'border-green-500 bg-green-900/20' : 'border-slate-700 bg-slate-800'}`}>
                          <div className="text-4xl bg-slate-900 p-3 rounded-lg border border-slate-700">
                            {skill.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-xl text-white">{skill.name}</h3>
                              {isOwned && (
                                <button
                                  onClick={() => equipSkill(skill.id)}
                                  className={`px-4 py-1 rounded text-xs font-bold ${isActive ? 'bg-green-600 text-white' : 'bg-slate-600 hover:bg-slate-500 text-white'}`}
                                >
                                  {isActive ? 'ACTIVE' : 'ACTIVATE'}
                                </button>
                              )}
                            </div>
                            <p className="text-slate-400 text-sm mb-3">{skill.description}</p>
                            <div className="flex gap-4 text-xs font-mono text-slate-500">
                              <span>⏱️ Duration: {skill.durationMs / 1000}s</span>
                              <span>Cooldown: {skill.cooldownMs / 1000}s</span>
                            </div>
                            {!isOwned && (
                              <button onClick={() => buySkill(skill.id)} className="mt-3 w-full py-2 bg-purple-600 hover:bg-purple-500 rounded font-bold text-white text-sm">
                                UNLOCK (FREE)
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        )
      }
    </div>
  );
});

GameUI.displayName = 'GameUI';

export default GameUI;