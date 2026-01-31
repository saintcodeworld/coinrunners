import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';
import AdminPanel from './components/AdminPanel';
import { ToastContainer, useToast } from './components/Toast';
import { GameState, Room, PricePoint, DexScreenerPair, DexScreenerResponse, SkinSettings, Skill } from './types';
import {
  META_COINS,
  SKINS,
  SKILLS,
  SENSITIVITY,
  FLOOR_MULTIPLIER,
  FETCH_INTERVAL_MS,
  MAX_PRICE_HISTORY,
  isValidSolanaAddress,
  RANDOM_THEME_COLORS
} from './constants';
import AuthModal from './components/AuthModal';
import LiveChat from './components/LiveChat';
import { UserWallet, truncateAddress, loginWithPrivateKey } from './utils/walletUtils';

// LocalStorage keys
const CUSTOM_COINS_KEY = 'degen_runner_custom_coins';
const USER_SESSION_KEY = 'degen_runner_session';

// ===========================================
// DEXSCREENER API HELPER
// ===========================================
interface FetchResult {
  marketCap: number;
  ticker: string;
  logoUrl: string | null;
  pairName: string | null;
  liquidity: number;
  priceUsd: number;
  success: boolean;
}

const fetchDexScreenerData = async (tokenAddress: string): Promise<FetchResult> => {
  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}?t=${Date.now()}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data: DexScreenerResponse = await response.json();

    if (data.pairs && data.pairs.length > 0) {
      // Pick the pair with highest liquidity for accurate tracking
      const sortedPairs = [...data.pairs].sort(
        (a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
      );
      const bestPair = sortedPairs[0];

      const marketCap = bestPair.fdv || bestPair.marketCap || 0;
      const ticker = bestPair.baseToken?.symbol || 'UNKNOWN';
      const logoUrl = bestPair.info?.imageUrl || null;
      const pairName = `${bestPair.baseToken?.symbol}/${bestPair.quoteToken?.symbol}`;
      const liquidity = bestPair.liquidity?.usd || 0;
      const priceUsd = parseFloat(bestPair.priceUsd || '0');

      if (marketCap > 0) {
        return {
          marketCap,
          ticker,
          logoUrl,
          pairName,
          liquidity,
          priceUsd,
          success: true
        };
      }
    }

    return {
      marketCap: 0,
      ticker: 'UNKNOWN',
      logoUrl: null,
      pairName: null,
      liquidity: 0,
      priceUsd: 0,
      success: false,
    };
  } catch (error) {
    console.error('DexScreener API error:', error);
    return {
      marketCap: 0,
      ticker: 'ERROR',
      logoUrl: null,
      pairName: null,
      liquidity: 0,
      priceUsd: 0,
      success: false,
    };
  }
};

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState<number>(0);
  const [gameSpeedDisplay, setGameSpeedDisplay] = useState<number>(0);

  // Toast notifications
  const { toasts, addToast, removeToast } = useToast();

  // User Auth State
  const [user, setUser] = useState<UserWallet | null>(null);

  // Handle Login / Signup result
  const handleLogin = (wallet: UserWallet) => {
    setUser(wallet);
    // Persist session
    localStorage.setItem(USER_SESSION_KEY, wallet.secretKey);
    addToast('Welcome to the on-chain arena!', 'success');
  };

  // Handle Logout
  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_SESSION_KEY);
    setGameState(GameState.MENU);
    addToast('Logged out successfully', 'info');
  }, [addToast]);

  // Load session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(USER_SESSION_KEY);
    if (savedSession) {
      const wallet = loginWithPrivateKey(savedSession);
      if (wallet) {
        // Load balance
        const storedBalance = localStorage.getItem(`balance_${wallet.publicKey}`);
        if (storedBalance) {
          wallet.balanceUsd = parseFloat(storedBalance);
        }
        setUser(wallet);
      }
    }
  }, []);

  // Save balance to LocalStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(`balance_${user.publicKey}`, user.balanceUsd.toString());
    }
  }, [user]);

  // ===========================================
  // WALLET & WITHDRAW LOGIC
  // ===========================================
  const [solPrice, setSolPrice] = useState<number>(0);

  // Poll SOL Price every 10s
  useEffect(() => {
    const fetchSol = async () => {
      // SOL TOKEN ADDRESS (Wrapped SOL on DexScreener)
      const SOL_ADDR = 'So11111111111111111111111111111111111111112';
      const res = await fetchDexScreenerData(SOL_ADDR);
      if (res.success && res.priceUsd > 0) {
        setSolPrice(res.priceUsd);
      }
    };
    fetchSol(); // Initial
    const interval = setInterval(fetchSol, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle Withdraw (Deduct Balance)
  const handleWithdraw = (amountUsd: number) => {
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        balanceUsd: Math.max(0, prev.balanceUsd - amountUsd)
      };
    });
  };

  // ===========================================
  // META COINS STATE (Persisted)
  // ===========================================
  const [metaCoins, setMetaCoins] = useState<Room[]>(() => {
    try {
      const saved = localStorage.getItem('degen_runner_meta_coins_v1');
      return saved ? JSON.parse(saved) : META_COINS;
    } catch (e) {
      console.error('Failed to load meta coins', e);
      return META_COINS;
    }
  });

  // Save Meta Coins to LS on change
  useEffect(() => {
    localStorage.setItem('degen_runner_meta_coins_v1', JSON.stringify(metaCoins));
  }, [metaCoins]);

  // Created Coins (user added)
  const [createdCoins, setCreatedCoins] = useState<Room[]>([]);

  // Active room tracking
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);

  // Shop State
  const [ownedSkins, setOwnedSkins] = useState<string[]>(SKINS.map(s => s.id));
  const [ownedSkills, setOwnedSkills] = useState<string[]>(SKILLS.map(s => s.id));
  const [selectedSkinId, setSelectedSkinId] = useState<string>('default');
  const [activeSkillIds, setActiveSkillIds] = useState<string[]>([]);

  const selectedSkin = useMemo(() => SKINS.find(s => s.id === selectedSkinId) || SKINS[0], [selectedSkinId]);
  const activeSkills = useMemo(() => SKILLS.filter(s => activeSkillIds.includes(s.id)), [activeSkillIds]);

  const buySkin = useCallback((id: string) => {
    if (!ownedSkins.includes(id)) setOwnedSkins(prev => [...prev, id]);
  }, [ownedSkins]);

  const buySkill = useCallback((id: string) => {
    if (!ownedSkills.includes(id)) setOwnedSkills(prev => [...prev, id]);
  }, [ownedSkills]);

  const equipSkin = useCallback((id: string) => {
    if (ownedSkins.includes(id)) setSelectedSkinId(id);
  }, [ownedSkins]);

  const equipSkill = useCallback((id: string) => {
    setActiveSkillIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id); // Toggle Off
      }
      if (prev.length >= 3) {
        // Max 3 limit
        return prev;
      }
      return [...prev, id]; // Toggle On
    });
  }, []);

  // Clear skills when returning to menu
  useEffect(() => {
    if (gameState === GameState.MENU) {
      setActiveSkillIds([]);
    }
  }, [gameState]);

  // Ref to hold the latest activeRoom state for the interval to access
  const activeRoomRef = useRef<Room | null>(null);

  // Sync ref with state
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  // Interval ref for cleanup
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialFetchDoneRef = useRef<boolean>(false);
  const latestFetchReqIdRef = useRef<number>(0);

  // ===========================================
  // LOAD CUSTOM COINS FROM LOCALSTORAGE
  // ===========================================
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_COINS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const resetCoins = parsed.map((coin: Room) => ({
          ...coin,
          isLoading: true,
          multiplier: 1,
          initialMarketCap: 0,
          currentMarketCap: 0,
          priceHistory: [],
          lastFetchError: false,
        }));
        setCreatedCoins(resetCoins);
      }
    } catch (e) {
      console.error('Failed to load custom coins:', e);
    }
  }, []);

  // ===========================================
  // AUTO REFRESH DASHBOARD DATA
  // ===========================================
  useEffect(() => {
    const fetchAllMetaCoins = async () => {
      console.log('Refreshing dashboard data...');

      const updates = await Promise.all(META_COINS.map(async (coin) => {
        const result = await fetchDexScreenerData(coin.tokenAddress);
        if (result.success && result.marketCap > 0) {
          return {
            ...coin,
            initialMarketCap: result.marketCap,
            currentMarketCap: result.marketCap, // Set both to current
            previousMarketCap: result.marketCap,
            isLoading: false,
            ticker: result.ticker,
            logoUrl: result.logoUrl,
            pairName: result.pairName,
            liquidity: result.liquidity,
          };
        }
        return coin;
      }));

      // Only update if we got valid data
      setMetaCoins(prev => {
        return updates.map(update => {
          // If we are currently PLAYING this room, don't overwrite it with dashboard data
          // to avoid messing up the game state loop
          if (activeRoomRef.current && activeRoomRef.current.id === update.id) {
            return activeRoomRef.current;
          }
          return update;
        });
      });
    };

    // Initial fetch
    fetchAllMetaCoins();

    // Refresh dashboard every 30 seconds
    const dashboardInterval = setInterval(fetchAllMetaCoins, 30000);

    return () => clearInterval(dashboardInterval);
  }, []);

  // ===========================================
  // AUTO CLEANUP INACTIVE COINS (5 MINS)
  // ===========================================
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const FIVE_MINUTES = 5 * 60 * 1000;

      setCreatedCoins(prev => prev.filter(coin => {
        // Always keep if it is the currently active room
        if (activeRoomRef.current && activeRoomRef.current.id === coin.id) return true;

        // Remove if inactive for > 5 minutes
        // Used || 0 to handle migration from old data without lastAccessed
        return (now - (coin.lastAccessed || 0)) < FIVE_MINUTES;
      }));
    }, 10000); // Check every 10 seconds

    return () => clearInterval(cleanupInterval);
  }, []);

  // ===========================================
  // SAVE CUSTOM COINS TO LOCALSTORAGE
  // ===========================================
  useEffect(() => {
    if (createdCoins.length > 0) {
      try {
        // Don't save priceHistory to localStorage (too large)
        const toSave = createdCoins.map(c => ({
          ...c,
          priceHistory: [],
          isLoading: true,
        }));
        localStorage.setItem(CUSTOM_COINS_KEY, JSON.stringify(toSave));
      } catch (e) {
        console.error('Failed to save custom coins:', e);
      }
    }
  }, [createdCoins]);

  // ===========================================
  // MULTIPLIER CALCULATION
  // Formula: Multiplier = 1 + ((currentMC - initialMC) / initialMC) * 5
  // ===========================================
  const calculateMultiplier = useCallback((initial: number, current: number): number => {
    if (initial <= 0) return 1;
    const change = (current - initial) / initial;
    const rawMultiplier = 1 + (change * SENSITIVITY);
    return Math.max(FLOOR_MULTIPLIER, rawMultiplier); // Hard floor at 0.1x
  }, []);

  // ===========================================
  // ADD CUSTOM COIN WITH REAL API VALIDATION
  // ===========================================
  const [isVerifying, setIsVerifying] = useState(false);

  const addCustomCoin = useCallback(async (contractAddress: string, name?: string): Promise<boolean> => {
    // Step 1: Format validation
    if (!isValidSolanaAddress(contractAddress)) {
      addToast('Invalid Solana address format', 'error');
      return false;
    }

    // Step 2: Check if already exists
    const exists = createdCoins.some(c => c.tokenAddress === contractAddress);
    if (exists) {
      addToast('This coin is already added!', 'warning');
      return false;
    }

    // Step 3: REAL API VALIDATION - Verify token exists on DexScreener
    setIsVerifying(true);
    addToast('Verifying token on DexScreener...', 'info');

    try {
      const result = await fetchDexScreenerData(contractAddress);

      if (!result.success || result.marketCap <= 0) {
        setIsVerifying(false);
        addToast('Token not found on DexScreener. Check the contract address.', 'error');
        return false;
      }

      // Token is valid! Create room with fetched metadata
      const randomColor = RANDOM_THEME_COLORS[
        Math.floor(Math.random() * RANDOM_THEME_COLORS.length)
      ];

      const verifiedCoin: Room = {
        id: `custom_${contractAddress}_${Date.now()}`,
        name: name || `$${result.ticker}`,
        ticker: result.ticker,
        tokenAddress: contractAddress,
        pairAddress: contractAddress,
        initialMarketCap: 0,
        currentMarketCap: result.marketCap, // Pre-fill with current data
        previousMarketCap: 0,
        themeColor: randomColor,
        multiplier: 1,
        flashState: 'none',
        isLoading: true,
        isMeta: false,
        priceHistory: [],
        logoUrl: result.logoUrl,
        pairName: result.pairName,
        liquidity: result.liquidity,
        lastFetchError: false,
        lastAccessed: Date.now(), // Set initial access time
      };

      setCreatedCoins(prev => [...prev, verifiedCoin]);
      setIsVerifying(false);
      addToast(`$${result.ticker} verified and added!`, 'success');
      return true;

    } catch (error) {
      setIsVerifying(false);
      addToast('Failed to verify token. Please try again.', 'error');
      console.error('Token verification error:', error);
      return false;
    }
  }, [createdCoins, addToast]);

  // ===========================================
  // REMOVE CUSTOM COIN
  // ===========================================
  const removeCustomCoin = useCallback((coinId: string) => {
    setCreatedCoins(prev => {
      const remaining = prev.filter(c => c.id !== coinId);
      localStorage.setItem(CUSTOM_COINS_KEY, JSON.stringify(remaining));
      return remaining;
    });
    addToast('Coin removed', 'info');
  }, [addToast]);

  // ===========================================
  // INITIAL FETCH - Called when entering a room
  // ===========================================
  const performInitialFetch = useCallback(async (room: Room): Promise<Room | null> => {
    if (!room) return null;

    const result = await fetchDexScreenerData(room.tokenAddress);

    if (result.success && result.marketCap > 0) {
      // Create initial price point for chart
      const initialPoint: PricePoint = {
        timestamp: Date.now(),
        marketCap: result.marketCap,
        normalizedValue: 0.5,
      };

      const updatedRoom: Room = {
        ...room,
        initialMarketCap: result.marketCap,
        currentMarketCap: result.marketCap,
        previousMarketCap: result.marketCap,
        multiplier: 1,
        isLoading: false,
        flashState: 'none',
        priceHistory: [initialPoint],
        // Update metadata from API
        ticker: result.ticker,
        name: `$${result.ticker}`,
        logoUrl: result.logoUrl,
        pairName: result.pairName,
        liquidity: result.liquidity,
        lastFetchError: false,
      };

      // Update in the correct list
      if (room.isMeta) {
        setMetaCoins(prev => prev.map(r => r.id === room.id ? updatedRoom : r));
      } else {
        setCreatedCoins(prev => prev.map(r => r.id === room.id ? updatedRoom : r));
      }

      initialFetchDoneRef.current = true;
      return updatedRoom;
    } else {
      // API failed - show error toast
      addToast('Coin Data Unavailable - Check contract address', 'error');

      const errorRoom: Room = {
        ...room,
        isLoading: false,
        lastFetchError: true,
      };

      if (room.isMeta) {
        setMetaCoins(prev => prev.map(r => r.id === room.id ? errorRoom : r));
      } else {
        setCreatedCoins(prev => prev.map(r => r.id === room.id ? errorRoom : r));
      }

      return null;
    }
  }, [addToast]);

  // ===========================================
  // LIVE FETCH - Called every 10 seconds
  // ===========================================
  const performLiveFetch = useCallback(async () => {
    // ALWAYS use the REF to get the freshest state inside the interval
    const currentRoom = activeRoomRef.current;

    if (!initialFetchDoneRef.current || !currentRoom) return;

    // Increment request ID
    const requestId = Date.now();
    latestFetchReqIdRef.current = requestId;

    const result = await fetchDexScreenerData(currentRoom.tokenAddress);

    // RACE CONDITION CHECK: If a newer request has started, ignore this one
    if (latestFetchReqIdRef.current !== requestId) {
      console.log('Discarding stale fetch result');
      return;
    }

    if (result.success && result.marketCap > 0) {
      const newMultiplier = calculateMultiplier(currentRoom.initialMarketCap, result.marketCap);

      // Determine flash state for visual feedback
      let flashState: 'none' | 'green' | 'red' = 'none';
      if (result.marketCap > currentRoom.currentMarketCap) {
        flashState = 'green'; // Price went UP
      } else if (result.marketCap < currentRoom.currentMarketCap) {
        flashState = 'red'; // Price went DOWN
      }

      // Create new price point for chart
      const newPricePoint: PricePoint = {
        timestamp: Date.now(),
        marketCap: result.marketCap,
        normalizedValue: 0.5 + ((result.marketCap - currentRoom.initialMarketCap) / currentRoom.initialMarketCap) * 0.5,
      };

      // Add to price history (limit to MAX_PRICE_HISTORY points)
      const updatedHistory = [...(currentRoom.priceHistory || []), newPricePoint].slice(-MAX_PRICE_HISTORY);

      const updatedRoom: Room = {
        ...currentRoom,
        previousMarketCap: currentRoom.currentMarketCap,
        currentMarketCap: result.marketCap,
        multiplier: newMultiplier,
        flashState,
        priceHistory: updatedHistory,
        liquidity: result.liquidity,
        lastFetchError: false,
      };

      setActiveRoom(updatedRoom);

      // Also update in the list
      if (currentRoom.isMeta) {
        setMetaCoins(prev => prev.map(r => r.id === currentRoom.id ? updatedRoom : r));
      } else {
        setCreatedCoins(prev => prev.map(r => r.id === currentRoom.id ? updatedRoom : r));
      }

      // Clear flash after animation
      setTimeout(() => {
        setActiveRoom(prev => prev ? { ...prev, flashState: 'none' } : null);
      }, 500);
    } else {
      // Graceful failure: Keep last known data, mark error
      const errorRoom = { ...currentRoom, lastFetchError: true };
      setActiveRoom(errorRoom);

      console.warn('Live fetch failed, keeping previous data');
    }
  }, [calculateMultiplier]);

  // ===========================================
  // BALANCE UPDATE ON GAME OVER
  // ===========================================
  const gameOutcomeProcessedRef = useRef(false);

  useEffect(() => {
    if (gameState === GameState.GAMEOVER) {
      if (!gameOutcomeProcessedRef.current && score > 0 && user) {
        // Add earnings to user balance
        setUser(prev => prev ? ({ ...prev, balanceUsd: prev.balanceUsd + score }) : null);
        gameOutcomeProcessedRef.current = true;
      }
    } else {
      gameOutcomeProcessedRef.current = false;
    }
  }, [gameState, score]); // user is in closure, but setState updater handles current value

  // ===========================================
  // CLEANUP FUNCTION - Clear all state
  // ===========================================
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    initialFetchDoneRef.current = false;
  }, []);

  // ===========================================
  // ROOM SELECTION
  // ===========================================
  const selectRoom = useCallback(async (room: Room) => {
    // MUST clear all active intervals first
    cleanup();

    // Update lastAccessed timestamp for this room to prevent auto-cleanup while active
    if (!room.isMeta) {
      setCreatedCoins(prev => prev.map(c =>
        c.id === room.id ? { ...c, lastAccessed: Date.now() } : c
      ));
    }

    // Reset game state
    setScore(0);

    // Reset room with empty price history for fresh chart
    setActiveRoom({
      ...room,
      isLoading: true,
      priceHistory: [],
      initialMarketCap: 0,
      currentMarketCap: 0,
      multiplier: 1,
      lastFetchError: false,
    });

    // Perform initial fetch - MUST complete before game can start
    const updatedRoom = await performInitialFetch(room);

    // GUARD: If user switched rooms while fetching, discard this result
    if (activeRoomRef.current?.id !== room.id) return;

    if (updatedRoom) {
      setActiveRoom(updatedRoom);
      setGameState(GameState.START);

      // Start 10-second interval for live updates
      intervalRef.current = setInterval(() => {
        performLiveFetch();
      }, FETCH_INTERVAL_MS);
    } else {
      // Fetch failed - go back to menu
      setGameState(GameState.MENU);
    }
  }, [cleanup, performInitialFetch, performLiveFetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Keep live fetch updated when game is playing
  useEffect(() => {
    if (gameState === GameState.PLAYING && intervalRef.current === null && initialFetchDoneRef.current && activeRoom) {
      intervalRef.current = setInterval(() => {
        performLiveFetch();
      }, FETCH_INTERVAL_MS);
    }
  }, [gameState, performLiveFetch, activeRoom]);

  // ===========================================
  // GAME CONTROLS
  // ===========================================
  const startGame = useCallback(() => {
    if (activeRoom && !activeRoom.isLoading && !activeRoom.lastFetchError) {
      setGameState(GameState.PLAYING);
    }
  }, [activeRoom]);

  const goToMenu = useCallback(() => {
    cleanup();
    setActiveRoom(null);
    setGameState(GameState.MENU);
  }, [cleanup]);

  const restartGame = useCallback(async () => {
    // FORCE FULL RESET: Re-select the room to trigger a fresh Initial Fetch
    // This ensures the player enters with a NEW Initial Market Cap derived from the CURRENT market price.
    // They cannot restart with the old (potentially favorable) baseline.
    const currentRoom = activeRoomRef.current;
    if (currentRoom) {
      // Create a clean version of the room to reload
      const cleanRoom = {
        ...currentRoom,
        priceHistory: [],
        isLoading: true,
        multiplier: 1,
        // Resetting these to 0 ensures performInitialFetch populates them fresh
        initialMarketCap: 0,
        currentMarketCap: 0,
        lastFetchError: false,
      };

      await selectRoom(cleanRoom);
      // selectRoom automatically sets GameState.START when done
    } else {
      goToMenu();
    }
  }, [selectRoom, goToMenu]);

  // ===========================================
  // MEMOIZED COMPONENTS FOR PERFORMANCE
  // ===========================================
  const MemoizedGameCanvas = useMemo(() => {
    if (!activeRoom) return null;
    return (
      <GameCanvas
        gameState={gameState}
        setGameState={setGameState}
        setScore={setScore}
        setGameSpeedDisplay={setGameSpeedDisplay}
        activeRoom={activeRoom}
        selectedSkin={selectedSkin}
        activeSkills={activeSkills}
      />
    );
  }, [gameState, activeRoom, selectedSkin, activeSkills]);

  // ===========================================
  // RENDER
  // ===========================================

  if (window.location.pathname === '/admin') {
    return <AdminPanel metaCoins={metaCoins} setMetaCoins={setMetaCoins} />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <LiveChat user={user} />

      {gameState === GameState.MENU ? (
        <>
          {/* BACKGROUND CONTENT (Dashboard) */}
          <div className={`h-full w-full overflow-y-auto min-h-screen transition-all duration-500 ${!user ? 'filter blur-md opacity-50 pointer-events-none select-none grayscale-[0.5]' : ''}`}>
            <GameUI
              gameState={gameState}
              score={score}
              gameSpeed={gameSpeedDisplay}
              startGame={startGame}
              restartGame={restartGame}
              goToMenu={goToMenu}
              activeRoom={activeRoom}
              metaCoins={metaCoins}
              createdCoins={createdCoins}
              selectRoom={selectRoom}
              addCustomCoin={addCustomCoin}
              removeCustomCoin={removeCustomCoin}
              user={user}
              solPrice={solPrice}
              onWithdraw={handleWithdraw}
              onLogout={handleLogout}
              skins={SKINS}
              skills={SKILLS}
              ownedSkins={ownedSkins}
              ownedSkills={ownedSkills}
              buySkin={buySkin}
              buySkill={buySkill}
              equipSkin={equipSkin}
              equipSkill={equipSkill}
              selectedSkinId={selectedSkinId}
              activeSkillIds={activeSkillIds}
            />

            <div className="fixed bottom-4 text-slate-500 text-xs text-center w-full pixel-font">
              Degen Runner v3.0 • Real-Time Multiplier • Powered by DexScreener • Live Updates
            </div>
          </div>

          {/* AUTH OVERLAY POPUP */}
          {!user && (
            <div className="absolute inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40"></div>
              <AuthModal onLogin={handleLogin} />
            </div>
          )}
        </>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute inset-0 w-full h-full">
            {MemoizedGameCanvas}
          </div>

          <GameUI
            gameState={gameState}
            score={score}
            gameSpeed={gameSpeedDisplay}
            startGame={startGame}
            restartGame={restartGame}
            goToMenu={goToMenu}
            activeRoom={activeRoom}
            metaCoins={metaCoins}
            createdCoins={createdCoins}
            selectRoom={selectRoom}
            addCustomCoin={addCustomCoin}
            removeCustomCoin={removeCustomCoin}
            user={user}
            solPrice={solPrice}
            onWithdraw={handleWithdraw}
            onLogout={handleLogout}
            skins={SKINS}
            skills={SKILLS}
            ownedSkins={ownedSkins}
            ownedSkills={ownedSkills}
            buySkin={buySkin}
            buySkill={buySkill}
            equipSkin={equipSkin}
            equipSkill={equipSkill}
            selectedSkinId={selectedSkinId}
            activeSkillIds={activeSkillIds}
          />

          {/* Scanlines Effect Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]"></div>

          <div className="fixed bottom-4 text-slate-500 text-xs text-center w-full pixel-font">
            Degen Runner v3.0 • Real-Time Multiplier • Powered by DexScreener • 5s Updates
          </div>
        </div>
      )}
    </div>
  );
}

export default App;