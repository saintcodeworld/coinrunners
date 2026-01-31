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

    return (
        <div className="relative z-50 w-80">
            <div className="minecraft-panel w-full">

                {/* Header Info */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-[#555]">
                    <div>
                        <div className="text-[10px] text-slate-800 uppercase tracking-widest font-bold">Total Earnings</div>
                        <div className="text-2xl font-bold text-mc-green">${user.balanceUsd.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2 mb-1">
                            <div className="text-[10px] text-slate-800 uppercase tracking-widest font-bold">Wallet</div>
                            <button
                                onClick={onLogout}
                                className="text-[10px] bg-red-800 text-white px-2 py-1 hover:bg-red-700 font-bold border-2 border-black"
                            >
                                LOGOUT
                            </button>
                        </div>
                        <div className="text-[10px] text-slate-800 bg-[#ccc] px-2 py-1 mb-1 border-2 border-slate-600">
                            {truncateAddress(user.publicKey)}
                        </div>
                        {solPrice > 0 && (
                            <span className="text-purple-700 text-[10px] block font-bold">1 SOL = ${solPrice.toFixed(2)}</span>
                        )}
                    </div>
                </div>

                {/* Withdraw Section */}
                <div className="mb-6">
                    <label className="text-slate-800 text-xs uppercase mb-1 block font-bold">Withdraw Earnings</label>
                    <div className="flex gap-2 mb-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                            <input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-[#eee] border-2 border-slate-600 p-2 pl-6 text-black text-sm focus:border-black outline-none"
                            />
                        </div>
                        <button
                            onClick={handleWithdraw}
                            disabled={!canWithdraw || isProcessing}
                            className="bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-3 border-2 border-black uppercase tracking-wider transition-colors shadow-[2px_2px_0_#000]"
                        >
                            {isProcessing ? '...' : 'Send'}
                        </button>
                    </div>

                    {/* Conversion Preview */}
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-700">Est. Receive:</span>
                        <span className={amountSol > 0 ? "text-purple-700 font-bold" : "text-slate-700"}>
                            {amountSol.toFixed(4)} SOL
                        </span>
                    </div>
                    {amountUsd > user.balanceUsd && (
                        <div className="text-red-600 font-bold text-[10px] mt-1">Insufficient balance</div>
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
