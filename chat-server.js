/**
 * Simple WebSocket Server for Degen Runner Live Chat
 * 
 * To run this:
 * 1. Install ws: npm install ws
 * 2. Run: node chat-server.js
 */

import { WebSocketServer } from 'ws';

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

console.log(`🚀 Chat server running on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
    console.log('✅ New player connected');

    ws.on('message', (data) => {
        const messageString = data.toString();
        console.log('💬 Message:', messageString);

        // Broadcast to all connected clients
        wss.clients.forEach((client) => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(messageString);
            }
        });
    });

    ws.on('close', () => {
        console.log('❌ Player disconnected');
    });

    ws.onerror = (err) => {
        console.error('⚠️ WebSocket error:', err);
    };
});
