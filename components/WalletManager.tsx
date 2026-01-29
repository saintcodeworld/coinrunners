import React, { useState, useEffect } from 'react';
import { UserWallet, truncateAddress } from '../utils/walletUtils';
import { useToast } from './Toast';

interface WalletManagerProps {
    user: UserWallet;
    solPrice: number;
    onWithdraw: (amountUsd: number) => void; // Callback to update local balance state
}

const WalletManager: React.FC<WalletManagerProps> = ({ user, solPrice, onWithdraw }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const { addToast } = useToast();

    const toggleOpen = () => setIsOpen(!isOpen);

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
            setIsOpen(false);

        } catch (error) {
            console.error('Withdrawal failed:', error);
            addToast('Withdrawal failed. Please try again.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="relative z-50">
            {/* Trigger Button (Wallet Info) */}
            <button
                onClick={toggleOpen}
                className="flex items-center gap-4 bg-slate-900/80 p-3 rounded-lg border border-slate-800 backdrop-blur-md shadow-lg hover:border-green-500/50 transition-colors group cursor-pointer"
            >
                <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold group-hover:text-green-400">Total Earnings</div>
                    <div className="text-xl font-bold text-green-400 font-mono">${user.balanceUsd.toFixed(2)}</div>
                </div>
                <div className="h-8 w-px bg-slate-700 mx-1"></div>
                <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold group-hover:text-green-400">Wallet</div>
                    <div className="text-xs font-mono text-slate-300 bg-black/40 px-2 py-1 rounded">
                        {truncateAddress(user.publicKey)}
                        <span className="ml-2 text-[10px] text-slate-500">▼</span>
                    </div>
                </div>
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Backdrop to close */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>

                    <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700/50 rounded-lg shadow-2xl p-4 z-50 animate-fade-in ring-1 ring-black">

                        {/* Header */}
                        <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                            <span className="text-slate-400 text-xs font-bold uppercase">Wallet Manager</span>
                            {solPrice > 0 && (
                                <span className="text-purple-400 text-xs font-mono">1 SOL = ${solPrice.toFixed(2)}</span>
                            )}
                        </div>

                        {/* Withdraw Section */}
                        <div className="mb-6">
                            <label className="text-slate-500 text-xs uppercase mb-1 block">Withdraw Earnings</label>
                            <div className="flex gap-2 mb-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                                    <input
                                        type="number"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-black/50 border border-slate-700 rounded p-2 pl-6 text-green-400 font-mono text-sm focus:border-green-500 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={handleWithdraw}
                                    disabled={!canWithdraw || isProcessing}
                                    className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-3 rounded uppercase tracking-wider transition-colors"
                                >
                                    {isProcessing ? '...' : 'Send'}
                                </button>
                            </div>

                            {/* Conversion Preview */}
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-slate-600">Est. Receive:</span>
                                <span className={amountSol > 0 ? "text-solana" : "text-slate-600"}>
                                    {amountSol.toFixed(4)} SOL
                                </span>
                            </div>
                            {amountUsd > user.balanceUsd && (
                                <div className="text-red-500 text-[10px] mt-1">Insufficient balance</div>
                            )}
                        </div>

                        {/* Private Key Section */}
                        <div className="bg-slate-950/50 rounded p-3 border border-slate-800">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-500 text-[10px] uppercase font-bold">Your Private Key</span>
                                <button
                                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                                    className="text-[10px] text-slate-400 hover:text-white underline decoration-dotted"
                                >
                                    {showPrivateKey ? 'Hide' : 'Reveal'}
                                </button>
                            </div>

                            <div className="break-all font-mono text-[10px] leading-tight text-slate-600 bg-black/40 p-2 rounded border border-slate-900 select-all">
                                {showPrivateKey ? user.secretKey : '••••••••••••••••••••••••••••••••••••••••••••••••••'}
                            </div>

                            <div className="mt-2 text-[10px] text-yellow-700/80 flex gap-1 items-start">
                                <span>⚠️</span>
                                <span>Never share your private key. Anyone with this key can access your wallet.</span>
                            </div>
                        </div>

                    </div>
                </>
            )}
        </div>
    );
};

export default WalletManager;
