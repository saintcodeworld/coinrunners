import { Keypair, Connection, clusterApiUrl, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

// Use devnet for testing, mainnet-beta for production
const CONNECTION = new Connection(clusterApiUrl('mainnet-beta'));

export interface UserWallet {
    publicKey: string;
    secretKey: string; // Base58 encoded
    balanceUsd: number;
}

// Generate a new random Solana wallet
export const generateWallet = (): UserWallet => {
    const keypair = Keypair.generate();
    return {
        publicKey: keypair.publicKey.toString(),
        secretKey: bs58.encode(keypair.secretKey),
        balanceUsd: 0,
    };
};

// Login with existing private key
export const loginWithPrivateKey = (privateKeyStr: string): UserWallet | null => {
    try {
        const decoded = bs58.decode(privateKeyStr);
        const keypair = Keypair.fromSecretKey(decoded);
        return {
            publicKey: keypair.publicKey.toString(),
            secretKey: privateKeyStr,
            balanceUsd: 0, // In a real app, you'd fetch this from a DB. Here we'll handle it in App state.
        };
    } catch (error) {
        console.error('Invalid private key:', error);
        return null;
    }
};

// Get SOL Balance (On-Chain)
export const getSolBalance = async (publicKeyStr: string): Promise<number> => {
    try {
        const publicKey = new PublicKey(publicKeyStr);
        const balance = await CONNECTION.getBalance(publicKey);
        return balance / LAMPORTS_PER_SOL;
    } catch (error) {
        console.error('Error fetching SOL balance:', error);
        return 0;
    }
};

// Format address for UI (e.g., 8xzt...9jLk)
export const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
};
