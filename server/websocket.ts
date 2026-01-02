import { WebSocketServer, WebSocket as WSWebSocket } from 'ws';
import type { Server } from 'http';
import { IncomingMessage } from 'http';
import logger from './logger';

interface AuthenticatedWebSocket extends WSWebSocket {
  userId?: string;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: 'auth' | 'message' | 'typing' | 'ping';
  payload?: any;
  token?: string;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  init(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      verifyClient: (info, callback) => {
        // Allow all connections, authentication happens after connection
        callback(true);
      }
    });

    this.wss.on('connection', (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      ws.isAlive = true;
      logger.info('New WebSocket connection attempt');

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          logger.error('WebSocket message parse error:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          this.removeClient(ws.userId, ws);
          logger.info(`WebSocket disconnected for user: ${ws.userId}`);
        }
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });
    });

    // Start heartbeat to detect dead connections
    this.startHeartbeat();

    logger.info('WebSocket server initialized on /ws');
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case 'auth':
        this.handleAuth(ws, message);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      case 'typing':
        this.handleTyping(ws, message);
        break;
      default:
        logger.warn(`Unknown message type: ${message.type}`);
    }
  }

  private async handleAuth(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    try {
      // For now, we'll use simple user ID from token
      // In production, verify Firebase token here
      const userId = message.payload?.userId;
      
      if (!userId) {
        ws.send(JSON.stringify({ type: 'auth', success: false, message: 'User ID required' }));
        return;
      }

      ws.userId = userId;
      this.addClient(userId, ws);
      
      ws.send(JSON.stringify({ type: 'auth', success: true, userId }));
      logger.info(`WebSocket authenticated for user: ${userId}`);
    } catch (error) {
      logger.error('WebSocket auth error:', error);
      ws.send(JSON.stringify({ type: 'auth', success: false, message: 'Authentication failed' }));
    }
  }

  private handleTyping(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (!ws.userId) return;
    
    const { conversationId, isTyping } = message.payload || {};
    if (!conversationId) return;

    // Broadcast typing status to other participants
    this.broadcastToConversation(conversationId, ws.userId, {
      type: 'typing',
      payload: {
        userId: ws.userId,
        conversationId,
        isTyping
      }
    });
  }

  private addClient(userId: string, ws: AuthenticatedWebSocket) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(ws);
    logger.info(`Added client for user ${userId}. Total clients: ${this.clients.get(userId)!.size}`);
  }

  private removeClient(userId: string, ws: AuthenticatedWebSocket) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.delete(ws);
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) return;

      this.wss.clients.forEach((ws: WebSocket) => {
        const client = ws as AuthenticatedWebSocket;
        if (client.isAlive === false) {
          if (client.userId) {
            this.removeClient(client.userId, client);
          }
          return client.terminate();
        }
        client.isAlive = false;
        client.ping();
      });
    }, 30000); // 30 seconds
  }

  sendToUser(userId: string, message: any) {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) {
      logger.info(`No active WebSocket clients for user: ${userId}`);
      return false;
    }

    const messageStr = JSON.stringify(message);
    let sent = false;
    
    userClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
        sent = true;
      }
    });

    return sent;
  }

  broadcastToConversation(conversationId: string, excludeUserId: string, message: any) {
    // This would need conversation participant lookup
    // For now, we'll handle it in the message creation endpoint
  }

  isUserOnline(userId: string): boolean {
    const userClients = this.clients.get(userId);
    if (!userClients) return false;
    
    for (const ws of userClients) {
      if (ws.readyState === WebSocket.OPEN) {
        return true;
      }
    }
    return false;
  }

  getOnlineUsersCount(): number {
    return this.clients.size;
  }

  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.wss) {
      this.wss.close();
    }
  }
}

export const wsManager = new WebSocketManager();
