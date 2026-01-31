import React, { useState } from 'react';
import { Room } from '../types';
import { RANDOM_THEME_COLORS, isValidSolanaAddress } from '../constants';

interface AdminPanelProps {
    metaCoins: Room[];
    setMetaCoins: React.Dispatch<React.SetStateAction<Room[]>>;
}

export default function AdminPanel({ metaCoins, setMetaCoins }: AdminPanelProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    // Add Coin Form State
    const [newAddress, setNewAddress] = useState('');
    const [newName, setNewName] = useState('');
    const [newTicker, setNewTicker] = useState('');
    const [addMessage, setAddMessage] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;

        // Check against env var
        if (password === envPassword) {
            setIsAuthenticated(true);
            setError(false);
        } else {
            setError(true);
        }
    };

    const handleAddCoin = () => {
        if (!newAddress || !newName || !newTicker) {
            setAddMessage('ALL FIELDS REQUIRED');
            return;
        }

        if (!isValidSolanaAddress(newAddress)) {
            setAddMessage('INVALID SOLANA ADDRESS');
            return;
        }

        if (metaCoins.some(c => c.tokenAddress === newAddress)) {
            setAddMessage('COIN ALREADY EXISTS');
            return;
        }

        const randomColor = RANDOM_THEME_COLORS[Math.floor(Math.random() * RANDOM_THEME_COLORS.length)];

        const newCoin: Room = {
            id: `meta_${newTicker.toLowerCase()}_${Date.now()}`,
            name: newName,
            ticker: newTicker.toUpperCase(),
            tokenAddress: newAddress,
            pairAddress: newAddress, // Assuming same for simplicity, app will resolve
            initialMarketCap: 0,
            currentMarketCap: 0,
            previousMarketCap: 0,
            themeColor: randomColor,
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
        };

        setMetaCoins([...metaCoins, newCoin]);
        setNewAddress('');
        setNewName('');
        setNewTicker('');
        setAddMessage('COIN ADDED SUCCESSFULLY');

        setTimeout(() => setAddMessage(''), 3000);
    };

    const handleDeleteCoin = (id: string) => {
        if (confirm('Are you sure you want to delete this coin?')) {
            setMetaCoins(metaCoins.filter(c => c.id !== id));
        }
    };

    if (isAuthenticated) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 overflow-y-auto">
                <div className="minecraft-panel w-full max-w-4xl text-center my-8">
                    <h1 className="text-2xl mb-2 pixel-font text-mc-gold">ADMIN DASHBOARD</h1>
                    <p className="mb-6 pixel-font text-white text-xs">META COINS CONFIGURATION</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        {/* LIST SECTION */}
                        <div className="minecraft-panel-inset p-4">
                            <h2 className="pixel-font text-mc-green mb-4 text-sm">ACTIVE COINS ({metaCoins.length})</h2>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {metaCoins.map((coin) => (
                                    <div key={coin.id} className="flex items-center justify-between bg-zinc-900 p-2 border border-zinc-700">
                                        <div>
                                            <p className="text-white pixel-font text-[10px]">{coin.name} ({coin.ticker})</p>
                                            <p className="text-gray-500 text-[8px] font-mono">{coin.tokenAddress.substring(0, 16)}...</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteCoin(coin.id)}
                                            className="btn-minecraft-red px-2 py-1 text-[8px]"
                                        >
                                            DELETE
                                        </button>
                                    </div>
                                ))}
                                {metaCoins.length === 0 && <p className="text-gray-500 text-center text-xs mt-10">NO COINS CONFIGURED</p>}
                            </div>
                        </div>

                        {/* ADD SECTION */}
                        <div className="flex flex-col gap-4">
                            <div className="minecraft-panel p-4">
                                <h2 className="pixel-font text-mc-gold mb-4 text-sm">ADD NEW META COIN</h2>

                                <div className="flex flex-col gap-3">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1 pixel-font">TOKEN ADDRESS</label>
                                        <input
                                            type="text"
                                            className="w-full text-xs"
                                            value={newAddress}
                                            onChange={(e) => setNewAddress(e.target.value)}
                                            placeholder="Solana Address..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] text-gray-400 mb-1 pixel-font">NAME (e.g. $BONK)</label>
                                            <input
                                                type="text"
                                                className="w-full text-xs"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                placeholder="$NAME"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-gray-400 mb-1 pixel-font">TICKER (e.g. BONK)</label>
                                            <input
                                                type="text"
                                                className="w-full text-xs"
                                                value={newTicker}
                                                onChange={(e) => setNewTicker(e.target.value)}
                                                placeholder="TICKER"
                                            />
                                        </div>
                                    </div>

                                    {addMessage && (
                                        <p className={`text-[10px] pixel-font text-center ${addMessage.includes('SUCCESS') ? 'text-green-500' : 'text-red-500'}`}>
                                            {addMessage}
                                        </p>
                                    )}

                                    <button onClick={handleAddCoin} className="btn-minecraft-green w-full mt-2">
                                        ADD TO ROTATION
                                    </button>
                                </div>
                            </div>

                            <div className="minecraft-panel p-4 flex flex-col justify-center items-center">
                                <p className="text-[10px] text-gray-400 pixel-font mb-2">ACTIONS</p>
                                <button
                                    className="btn-minecraft-red w-full"
                                    onClick={() => window.location.href = '/'}
                                >
                                    EXIT ADMIN MODE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
            <div className="minecraft-panel w-full max-w-md text-center">
                <h1 className="text-xl mb-8 pixel-font text-mc-red blink-text">RESTRICTED AREA</h1>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div className="relative">
                        <input
                            type="password"
                            placeholder="PASSWORD"
                            className="w-full pixel-font text-center bg-black text-white border-4 border-gray-600 p-3 outline-none focus:border-white"
                            style={{ fontFamily: "'Press Start 2P', cursive" }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <p className="text-mc-red text-xs pixel-font animate-pulse">
                            ⚠ ACCESS DENIED
                        </p>
                    )}

                    <button type="submit" className="btn-minecraft w-full py-4 text-yellow-200">
                        AUTHENTICATE
                    </button>
                </form>

                <div className="mt-8 text-xs text-gray-500 pixel-font">
                    <a href="/" className="hover:text-white hover:underline no-underline text-gray-600">
                        &lt; RETURN TO GAME
                    </a>
                </div>
            </div>
        </div>
    );
}
