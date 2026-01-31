import React, { useState, useEffect } from 'react';
import { UserWallet, truncateAddress } from '../utils/walletUtils';
import { useToast } from './Toast';

interface WalletManagerProps {
    user: UserWallet;
    solPrice: number;
    onWithdraw: (amountUsd: number) => void;
    onLogout: () => void;
}

const WalletManager: React.FC<WalletManagerProps> = ({ user, solPrice, onWithdraw, onLogout }) => {
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const { addToast } = useToast();

    // Calculate SOL equivalent
    const amountUsd = parseFloat(withdrawAmount) || 0;
    const amountSol = solPrice > 0 ? amountUsd / solPrice : 0;

    const canWithdraw = amountUsd > 0 && amountUsd <= user.balanceUsd && solPrice > 0;

    const handleWithdraw = async () => {
        if (!canWithdraw) return;

        setIsProcessing(true);

        try {
            // IN A REAL APP: This would call a backend API to process the withdrawal securely.
            // THE USER REQUESTED: "Sending from my treasury wallet".
            // WARNING: Putting a Treasury Private Key in frontend code is extremely unsafe.
            // For this demo/prototype, we are simulating the withdrawal delay and success.

            console.log(`Initialating withdrawal of $${amountUsd} (${amountSol.toFixed(4)} SOL) to ${user.publicKey}`);

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Call parent to deduct balance
            onWithdraw(amountUsd);

            addToast(`Withdrawal successful! Sent ${amountSol.toFixed(4)} SOL`, 'success');
            setWithdrawAmount('');
            setWithdrawAmount('');

        } catch (error) {
            console.error('Withdrawal failed:', error);
            addToast('Withdrawal failed. Please try again.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(user.publicKey).then(() => {
            setIsCopied(true);
            addToast('Wallet address copied!', 'success');
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div className="relative z-50 w-80">
            <div className="minecraft-panel w-full">

                <div className="mb-6 pb-4 border-b-2 border-slate-400">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Dashboard</div>
                        <button
                            onClick={onLogout}
                            className="text-[10px] bg-red-600 text-white px-3 py-1 hover:bg-red-500 font-bold border-2 border-black shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none transition-all"
                        >
                            LOGOUT
                        </button>
                    </div>

                    <div className="bg-[#b8b8b8] p-4 border-4 border-slate-500 shadow-[inset_2px_2px_0_#fff,inset_-2px_-2px_0_#888] mb-4">
                        <div className="text-[8px] text-slate-800 uppercase font-bold mb-2">Total Earnings</div>
                        <div className="text-3xl font-bold text-mc-green tracking-tighter drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
                            ${user.balanceUsd.toFixed(2)}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div
                            onClick={handleCopyAddress}
                            className="flex items-center justify-between bg-[#ccc] p-2 border-2 border-slate-500 cursor-pointer hover:bg-[#ddd] transition-colors group relative"
                            title="Click to copy address"
                        >
                            <span className="text-[8px] font-bold text-slate-700 uppercase">Wallet</span>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-slate-900 bg-[#eee] px-2 py-0.5 border border-slate-400 font-mono group-hover:border-slate-800">
                                    {truncateAddress(user.publicKey)}
                                </span>
                                <span className="text-[8px]">📋</span>
                            </div>
                            {isCopied && (
                                <div className="absolute inset-0 bg-green-600 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-widest animate-pulse">
                                    COPIED!
                                </div>
                            )}
                        </div>
                        {solPrice > 0 && (
                            <div className="flex items-center justify-between bg-[#dfdfff] p-2 border-2 border-purple-400">
                                <span className="text-[8px] font-bold text-purple-700 uppercase">Sol Price</span>
                                <span className="text-[10px] font-bold text-purple-900">
                                    1 SOL = ${solPrice.toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Withdraw Section */}
                <div className="mb-6">
                    <label className="text-slate-800 text-[10px] uppercase mb-2 block font-bold">Withdraw Earnings</label>
                    <div className="flex gap-2 mb-3">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-3 text-slate-500 font-bold">$</span>
                            <input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-[#eee] border-2 border-slate-600 p-2.5 pl-7 text-black text-xs font-bold focus:border-black outline-none"
                            />
                        </div>
                        <button
                            onClick={handleWithdraw}
                            disabled={!canWithdraw || isProcessing}
                            className="bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-4 border-2 border-black uppercase tracking-wider transition-colors shadow-[2px_2px_0_#000] active:translate-y-0.5 active:shadow-none"
                        >
                            {isProcessing ? '...' : 'Send'}
                        </button>
                    </div>

                    {/* Conversion Preview */}
                    <div className="flex justify-between items-center text-[10px] bg-slate-200 p-2 border border-slate-400">
                        <span className="text-slate-600 font-bold">Est. Receive:</span>
                        <span className={amountSol > 0 ? "text-purple-700 font-bold" : "text-slate-600 font-bold"}>
                            {amountSol.toFixed(4)} SOL
                        </span>
                    </div>
                    {amountUsd > user.balanceUsd && (
                        <div className="text-red-600 font-bold text-[8px] mt-2">Insufficient balance</div>
                    )}
                </div>

                {/* Private Key Section */}
                <div className="minecraft-panel-inset p-3">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Your Private Key</span>
                        <button
                            onClick={() => setShowPrivateKey(!showPrivateKey)}
                            className="text-[10px] text-slate-400 hover:text-white underline decoration-dotted"
                        >
                            {showPrivateKey ? 'Hide' : 'Reveal'}
                        </button>
                    </div>

                    <div className="break-all text-[10px] leading-tight text-white bg-[#000] p-2 border border-[#333] select-all">
                        {showPrivateKey ? user.secretKey : '••••••••••••••••••••••••••••••••••••••••••••••••••'}
                    </div>

                    <div className="mt-2 text-[10px] text-yellow-500 flex gap-1 items-start">
                        <span>⚠️</span>
                        <span>Never share your private key. Anyone with this key can access your wallet.</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default WalletManager;
