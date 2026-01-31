import React, { useState } from 'react';
import { generateWallet, loginWithPrivateKey, UserWallet } from '../utils/walletUtils';

interface AuthModalProps {
    onLogin: (wallet: UserWallet) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<'signin' | 'signup'>('signup');
    const [privateKeyInput, setPrivateKeyInput] = useState('');
    const [generatedWallet, setGeneratedWallet] = useState<UserWallet | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = () => {
        const newWallet = generateWallet();
        setGeneratedWallet(newWallet);
        setError(null);
    };

    const handleLogin = () => {
        if (!privateKeyInput.trim()) {
            setError('Please enter your private key');
            return;
        }

        const wallet = loginWithPrivateKey(privateKeyInput.trim());
        if (wallet) {
            onLogin(wallet);
            // Try to verify locally stored balance for this user
            const storedBalance = localStorage.getItem(`balance_${wallet.publicKey}`);
            if (storedBalance) {
                wallet.balanceUsd = parseFloat(storedBalance);
            }
        } else {
            setError('Invalid Private Key. Please check and try again.');
        }
    };

    const handleCopy = () => {
        if (generatedWallet) {
            navigator.clipboard.writeText(generatedWallet.secretKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCompleteSignup = () => {
        if (generatedWallet) {
            onLogin(generatedWallet);
        }
    };

    return (
        <div className="minecraft-panel-dark w-full max-w-md p-6 relative animate-fade-in shadow-2xl">

            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white pixel-font mb-2 text-shadow">
                    Rugs Runner
                </h1>
                <p className="text-slate-400 text-sm">Connect to the Solana Blockchain</p>
            </div>

            {/* Tabs */}
            {!generatedWallet && (
                <div className="flex mb-6 border-b-4 border-black bg-[#111]">
                    <button
                        onClick={() => { setMode('signup'); setError(null); }}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${mode === 'signup'
                            ? 'bg-[#333] text-white border-b-4 border-[#55ff55]'
                            : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        NEW PLAYER
                    </button>
                    <button
                        onClick={() => { setMode('signin'); setError(null); }}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${mode === 'signin'
                            ? 'bg-[#333] text-white border-b-4 border-[#55ff55]'
                            : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        I HAVE A KEY
                    </button>
                </div>
            )}

            {/* CONTENT */}
            <div className="space-y-4">

                {/* SIGN UP FLOW */}
                {mode === 'signup' && !generatedWallet && (
                    <div className="text-center py-4">
                        <p className="text-slate-300 mb-6 leading-relaxed">
                            Generate a unique Solana Burner Wallet directly in your browser.
                            This will be your identity.
                        </p>
                        <button
                            onClick={handleGenerate}
                            className="btn-minecraft btn-minecraft-green w-full py-4 text-lg font-bold tracking-widest"
                        >
                            GENERATE WALLET
                        </button>
                    </div>
                )}

                {/* SIGN UP SUCCESS - SHOW KEYS */}
                {generatedWallet && (
                    <div className="animate-fade-in">
                        <div className="bg-[#330000] border-2 border-red-500 p-4 mb-6">
                            <div className="flex items-center gap-2 text-red-500 font-bold mb-2">
                                <span>⚠️ IMPORTANT SECURITY WARNING</span>
                            </div>
                            <p className="text-red-200 text-xs leading-relaxed">
                                This looks like a game, but this is a REAL Solana Private Key.
                                <br /><br />
                                <strong>We do not store this.</strong> If you refresh or close this tab without saving it,
                                your account and funds will be lost forever. Copy it now!
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Your Public Address</label>
                            <div className="bg-[#000] p-3 text-white font-mono text-xs break-all border-2 border-[#555]">
                                {generatedWallet.publicKey}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="text-xs text-[#55ff55] uppercase tracking-wider mb-1 block font-bold">Your Private Key (SECRET)</label>
                            <div
                                onClick={handleCopy}
                                className="bg-[#000] p-4 text-[#55ff55] font-mono text-xs break-all border-2 border-[#55ff55] cursor-pointer hover:bg-[#111] transition-colors relative group"
                            >
                                {generatedWallet.secretKey}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white font-bold">{copied ? 'COPIED!' : 'CLICK TO COPY'}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCompleteSignup}
                            disabled={!copied}
                            className={`w-full py-4 text-lg font-bold tracking-widest transition-all ${copied
                                ? 'btn-minecraft btn-minecraft-green'
                                : 'bg-[#333] text-slate-500 cursor-not-allowed border-4 border-[#444]'
                                }`}
                        >
                            {copied ? 'I SAVED IT - START GAME' : 'COPY KEY TO CONTINUE'}
                        </button>
                    </div>
                )}

                {/* SIGN IN FLOW */}
                {mode === 'signin' && (
                    <div>
                        <div className="mb-6">
                            <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Paste Private Key</label>
                            <textarea
                                value={privateKeyInput}
                                onChange={(e) => setPrivateKeyInput(e.target.value)}
                                placeholder="Paste your base58 private key here..."
                                className="w-full h-32 bg-[#000] border-4 border-[#555] p-3 text-white font-mono text-xs resize-none focus:outline-none focus:border-white transition-colors"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border-2 border-red-500 text-red-400 p-3 text-sm mb-4 text-center font-bold">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleLogin}
                            className="btn-minecraft w-full py-4 text-lg font-bold tracking-widest"
                        >
                            LOGIN
                        </button>
                    </div>
                )}

            </div>
        </div>

    );
};

export default AuthModal;
