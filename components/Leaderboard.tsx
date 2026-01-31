import React, { useState, useEffect } from 'react';
import { truncateAddress } from '../utils/walletUtils';

// Global style override to ensure no shadows in this component
const NO_SHADOW_STYLE = { textShadow: 'none' };

type Timeframe = 'Weekly' | 'Monthly';

interface LeaderboardEntry {
    rank: number;
    walletAddress: string;
    amount: number;
    prize?: string;
}

// Generate random Solana-like address
const generateRandomAddress = () => {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let addr = '';
    for (let i = 0; i < 44; i++) {
        addr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return addr;
};

// Mock data generator for wallet addresses
const generateMockData = (count: number, minAmount: number, maxAmount: number): LeaderboardEntry[] => {
    const entries: LeaderboardEntry[] = [];

    for (let i = 0; i < count; i++) {
        entries.push({
            rank: i + 1,
            walletAddress: generateRandomAddress(),
            amount: Math.floor(Math.random() * (maxAmount - minAmount) + minAmount),
        });
    }
    return entries.sort((a, b) => b.amount - a.amount).map((entry, index) => ({ ...entry, rank: index + 1 }));
};

const Leaderboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Timeframe>('Weekly');
    const [weeklyData, setWeeklyData] = useState<LeaderboardEntry[]>([]);
    const [monthlyData, setMonthlyData] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        // Initial data
        setWeeklyData(generateMockData(15, 500, 5000));
        setMonthlyData(generateMockData(15, 2000, 20000));

        // Simulate live updates
        const interval = setInterval(() => {
            // Randomly update one entry to simulate live changes
            if (Math.random() > 0.5) {
                setWeeklyData(prev => {
                    const newData = [...prev];
                    const idx = Math.floor(Math.random() * newData.length);
                    newData[idx] = { ...newData[idx], amount: newData[idx].amount + Math.floor(Math.random() * 50) };
                    return newData.sort((a, b) => b.amount - a.amount).map((item, i) => ({ ...item, rank: i + 1 }));
                });
            } else {
                setMonthlyData(prev => {
                    const newData = [...prev];
                    const idx = Math.floor(Math.random() * newData.length);
                    newData[idx] = { ...newData[idx], amount: newData[idx].amount + Math.floor(Math.random() * 100) };
                    return newData.sort((a, b) => b.amount - a.amount).map((item, i) => ({ ...item, rank: i + 1 }));
                });
            }
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const getPrizes = (rank: number, type: Timeframe): string | null => {
        if (type === 'Weekly') {
            // 5 SOL Pool: 1st: 2.5, 2nd: 1.5, 3rd: 1.0
            if (rank === 1) return '2.5 SOL';
            if (rank === 2) return '1.5 SOL';
            if (rank === 3) return '1.0 SOL';
        } else {
            // 15 SOL Pool: 1st: 6, 2nd: 4, 3rd: 2.5, 4th: 1.5, 5th: 1.0
            if (rank === 1) return '6.0 SOL';
            if (rank === 2) return '4.0 SOL';
            if (rank === 3) return '2.5 SOL';
            if (rank === 4) return '1.5 SOL';
            if (rank === 5) return '1.0 SOL';
        }
        return null;
    };

    const data = activeTab === 'Weekly' ? weeklyData : monthlyData;
    const poolSize = activeTab === 'Weekly' ? '5 SOL' : '15 SOL';

    return (
        // Replaced dark theme with customized light/white theme
        <div className="hidden lg:block w-[400px] bg-white border-4 border-white shadow-2xl relative" style={{ borderColor: '#fff #555 #555 #fff', borderWidth: '4px', borderStyle: 'solid' }}>

            {/* Header - White Theme */}
            <div className="bg-slate-50 p-3 border-b-2 border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="text-yellow-500 text-[1.25rem] drop-shadow-sm">🏆</span>
                    <div className="font-bold text-slate-800 pixel-font tracking-wide text-lg" style={NO_SHADOW_STYLE}>TOP RUNNERS</div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('Weekly')}
                        className={`px-3 py-1 text-xs font-bold border-2 transition-all rounded shadow-sm ${activeTab === 'Weekly' ? 'bg-purple-600 border-purple-800 text-white' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                    >
                        Weekly
                    </button>
                    <button
                        onClick={() => setActiveTab('Monthly')}
                        className={`px-3 py-1 text-xs font-bold border-2 transition-all rounded shadow-sm ${activeTab === 'Monthly' ? 'bg-purple-600 border-purple-800 text-white' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                    >
                        Monthly
                    </button>
                </div>
            </div>

            {/* Prize Pool Banner - Lighter */}
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-2 text-center border-b-2 border-slate-200">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                    {activeTab} Giveaway Pool
                </p>
                <div className="text-[1.5rem] font-bold text-slate-800 pixel-font" style={NO_SHADOW_STYLE}>
                    {poolSize}
                </div>
            </div>

            {/* List - Reduced Height (approx half) & White Bkg */}
            <div className="max-h-[220px] overflow-y-auto custom-scrollbar-light bg-white">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase sticky top-0 z-10 font-bold">
                        <tr>
                            <th className="px-4 py-2 text-center">#</th>
                            <th className="px-4 py-2">Wallet</th>
                            <th className="px-4 py-2 text-right">Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((entry) => {
                            const prize = getPrizes(entry.rank, activeTab);
                            let rowClass = "hover:bg-slate-50 transition-colors";

                            // Medal styling
                            let rankDisplay: React.ReactNode = <span className="text-slate-400 font-mono font-bold">{entry.rank}</span>;
                            let rankSize = "text-base";

                            if (entry.rank === 1) {
                                rowClass = "bg-yellow-50 hover:bg-yellow-100";
                                rankDisplay = <span className="text-[1.25rem]">🥇</span>;
                            } else if (entry.rank === 2) {
                                rowClass = "bg-slate-100 hover:bg-slate-200";
                                rankDisplay = <span className="text-[1.25rem]">🥈</span>;
                            } else if (entry.rank === 3) {
                                rowClass = "bg-orange-50 hover:bg-orange-100";
                                rankDisplay = <span className="text-[1.25rem]">🥉</span>;
                            }

                            return (
                                <tr key={entry.rank} className={rowClass}>
                                    <td className={`px-4 py-2 text-center font-bold ${rankSize}`}>
                                        {rankDisplay}
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="font-bold text-slate-800 font-mono tracking-tight text-xs">
                                            {truncateAddress(entry.walletAddress)}
                                        </div>
                                        {prize && (
                                            <div className="text-[10px] text-purple-600 font-mono leading-none mt-1 font-bold">
                                                🎁 {prize}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <div className="font-mono text-green-600 font-bold text-xs">
                                            ${entry.amount.toLocaleString()}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer info - Lighter */}
            <div className="p-2 bg-slate-50 text-center border-t-2 border-slate-200">
                <p className="text-[10px] text-slate-400 font-bold">
                    ~ Leaderboard does not reset on withdraw ~
                </p>
            </div>
        </div>
    );
};

export default Leaderboard;
