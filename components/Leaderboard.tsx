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

const Leaderboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Timeframe>('Weekly');
    const [weeklyData, setWeeklyData] = useState<LeaderboardEntry[]>([]);
    const [monthlyData, setMonthlyData] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // In a real application, fetch data from your backend here.
        // For now, we initialize with empty data to ensure no "bots" are shown.

        // Simulating API latency then showing empty/real state
        setTimeout(() => {
            setWeeklyData([]);
            setMonthlyData([]);
            setIsLoading(false);
        }, 1000);

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
        <div className="hidden lg:block w-[400px] bg-black border-4 shadow-2xl relative" style={{ borderColor: '#333 #111 #111 #333', borderStyle: 'solid' }}>

            {/* Header - Dark Theme */}
            <div className="bg-[#111] p-3 border-b-2 border-[#222] flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="text-yellow-500 text-[1.25rem] drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">🏆</span>
                    <div className="font-bold text-white pixel-font tracking-wide text-lg" style={NO_SHADOW_STYLE}>TOP RUNNERS</div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('Weekly')}
                        className={`px-3 py-1 text-xs font-bold border-2 transition-all rounded shadow-sm ${activeTab === 'Weekly' ? 'text-white' : 'bg-black border-[#444] text-slate-400 hover:bg-[#222] hover:text-white'}`}
                        style={activeTab === 'Weekly' ? { backgroundColor: '#00bf63', borderColor: '#00a054' } : {}}
                    >
                        Weekly
                    </button>
                    <button
                        onClick={() => setActiveTab('Monthly')}
                        className={`px-3 py-1 text-xs font-bold border-2 transition-all rounded shadow-sm ${activeTab === 'Monthly' ? 'text-white' : 'bg-black border-[#444] text-slate-400 hover:bg-[#222] hover:text-white'}`}
                        style={activeTab === 'Monthly' ? { backgroundColor: '#00bf63', borderColor: '#00a054' } : {}}
                    >
                        Monthly
                    </button>
                </div>
            </div>

            {/* Prize Pool Banner - Dark */}
            <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] p-2 text-center border-b-2 border-[#222]">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                    {activeTab} Giveaway Pool
                </p>
                <div className="text-[1.5rem] font-bold pixel-font" style={{ ...NO_SHADOW_STYLE, color: '#00bf63' }}>
                    {poolSize}
                </div>
            </div>

            {/* List - Reduced Height (approx half) & Black Bkg */}
            <div className="max-h-[220px] overflow-y-auto custom-scrollbar bg-black min-h-[100px]">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full py-8 text-slate-500 text-xs font-bold animate-pulse">
                        Loading Data...
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-full py-8 text-slate-500 text-xs font-bold">
                        <span className="text-2xl mb-2 opacity-30 grayscale pointer-events-none">🕸️</span>
                        No runners yet
                        <span className="text-[9px] opacity-70 mt-1 font-medium">Be the first!</span>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-xs text-slate-400 bg-[#0a0a0a] border-b border-[#222] uppercase sticky top-0 z-10 font-bold">
                            <tr>
                                <th className="px-4 py-2 text-center">#</th>
                                <th className="px-4 py-2">Wallet</th>
                                <th className="px-4 py-2 text-right">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#111]">
                            {data.map((entry) => {
                                const prize = getPrizes(entry.rank, activeTab);
                                let rowClass = "hover:bg-[#0a0a0a] transition-colors";

                                // Medal styling
                                let rankDisplay: React.ReactNode = <span className="text-slate-500 font-mono font-bold">{entry.rank}</span>;
                                let rankSize = "text-base";

                                if (entry.rank === 1) {
                                    rowClass = "bg-[#1a1a00] hover:bg-[#2a2a00]";
                                    rankDisplay = <span className="text-[1.25rem] drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">🥇</span>;
                                } else if (entry.rank === 2) {
                                    rowClass = "bg-[#0f172a] hover:bg-[#1e293b]";
                                    rankDisplay = <span className="text-[1.25rem] drop-shadow-[0_0_5px_rgba(148,163,184,0.5)]">🥈</span>;
                                } else if (entry.rank === 3) {
                                    rowClass = "bg-[#1c1917] hover:bg-[#292524]";
                                    rankDisplay = <span className="text-[1.25rem] drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]">🥉</span>;
                                }

                                return (
                                    <tr key={entry.rank} className={rowClass}>
                                        <td className={`px-4 py-2 text-center font-bold ${rankSize}`}>
                                            {rankDisplay}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="font-bold text-slate-200 font-mono tracking-tight text-xs">
                                                {truncateAddress(entry.walletAddress)}
                                            </div>
                                            {prize && (
                                                <div className="text-[10px] font-mono leading-none mt-1 font-bold" style={{ color: '#00bf63' }}>
                                                    🎁 {prize}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <div className="font-mono text-green-400 font-bold text-xs">
                                                ${entry.amount.toLocaleString()}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

        </div>
    );
};

export default Leaderboard;
