import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { CHAT_SERVER_URL } from '../constants';
import { UserWallet, truncateAddress } from '../utils/walletUtils';

interface LiveChatProps {
    user: UserWallet | null;
}

const LiveChat: React.FC<LiveChatProps> = ({ user }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isOpen, setIsOpen] = useState(true);
    const [status, setStatus] = useState<'connecting' | 'open' | 'closed'>('connecting');
    const scrollRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<WebSocket | null>(null);

    // Auto scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    useEffect(() => {
        let reconnectTimeout: ReturnType<typeof setTimeout>;

        const connect = () => {
            try {
                const socket = new WebSocket(CHAT_SERVER_URL);
                socketRef.current = socket;

                socket.onopen = () => {
                    setStatus('open');
                    addSystemMessage('Connected to live chat');
                };

                socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        // Handle standard chat message format
                        if (data.type === 'message' || data.text) {
                            const newMessage: ChatMessage = data.type === 'message' ? data.payload : {
                                id: Date.now().toString(),
                                sender: data.sender || 'Unknown',
                                text: data.text,
                                timestamp: Date.now()
                            };
                            setMessages(prev => [...prev.slice(-49), newMessage]);
                        }
                    } catch (err) {
                        console.error('Failed to parse WS message', err);
                    }
                };

                socket.onclose = () => {
                    setStatus('closed');
                    addSystemMessage('Disconnected. Reconnecting...');
                    reconnectTimeout = setTimeout(connect, 5000);
                };

                socket.onerror = () => {
                    setStatus('closed');
                };
            } catch (err) {
                console.error('WS Connection error:', err);
                setStatus('closed');
            }
        };

        connect();

        return () => {
            if (socketRef.current) socketRef.current.close();
            clearTimeout(reconnectTimeout);
        };
    }, []);

    const addSystemMessage = (text: string) => {
        const msg: ChatMessage = {
            id: `system_${Date.now()}`,
            sender: 'SYSTEM',
            text,
            timestamp: Date.now(),
            isSystem: true
        };
        setMessages(prev => [...prev.slice(-49), msg]);
    };

    const handleSend = () => {
        if (!input.trim() || status !== 'open') return;

        const senderName = user ? truncateAddress(user.publicKey) : 'Guest';

        const messageData = {
            type: 'message',
            payload: {
                id: `${Date.now()}_${Math.random()}`,
                sender: senderName,
                text: input.trim(),
                timestamp: Date.now()
            }
        };

        try {
            socketRef.current?.send(JSON.stringify(messageData));
            // Note: In some setups, the server echoes back. 
            // If it doesn't, we might want to add to local state here.
            // But usually online chats wait for server confirmation/broadcast.
            setInput('');
        } catch (err) {
            console.error('Send error:', err);
            addSystemMessage('Failed to send message');
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 left-4 z-50 bg-[#333] border-4 border-[#fff] p-3 text-white hover:text-[#55ff55] shadow-[4px_4px_0_#000] transition-all hover:scale-110 pointer-events-auto"
                title="Open Live Chat"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" /></svg>
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 left-4 z-50 w-80 h-96 minecraft-panel-dark flex flex-col overflow-hidden pointer-events-auto animate-fade-in">
            {/* Header */}
            <div className="p-3 border-b-4 border-black flex justify-between items-center bg-[#111]">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 ${status === 'open' ? 'bg-[#55ff55]' : 'bg-[#ff5555]'}`} />
                    <span className="text-[10px] font-bold text-white pixel-font tracking-widest uppercase">Global Chat</span>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-[#888] hover:text-white transition-colors p-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {messages.length === 0 && status === 'open' && (
                    <div className="text-center py-20">
                        <p className="text-slate-600 text-[10px] italic">The terminal is quiet...</p>
                        <p className="text-slate-700 text-[9px] mt-1 uppercase tracking-tighter">Start the conversation</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.isSystem ? 'items-center' : 'items-start'}`}>
                        {msg.isSystem ? (
                            <div className="bg-[#333] px-3 py-1 border border-[#555] mb-2">
                                <span className="text-[10px] text-[#aaa] italic">{msg.text}</span>
                            </div>
                        ) : (
                            <div className="max-w-[90%]">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-[10px] font-bold text-[#55ff55]">{msg.sender}</span>
                                    <span className="text-[8px] text-[#888]">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="bg-[#222] border-2 border-[#555] px-2 py-1 relative">
                                    <span className="text-xs text-white leading-relaxed break-words">{msg.text}</span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-[#111] border-t-4 border-black">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={status === 'open' ? "Type message..." : "Reconnecting..."}
                        disabled={status !== 'open'}
                        className="flex-1 bg-[#000] border-2 border-[#555] px-3 py-2 text-xs text-white placeholder-[#555] focus:outline-none focus:border-white transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={status !== 'open' || !input.trim()}
                        className="btn-minecraft btn-minecraft-green p-2 px-3"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>

            {/* Custom scrollbar style hide */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .scrollbar-hide::-webkit-scrollbar { display: none; }
            `}} />
        </div>
    );
};

export default LiveChat;
