import { useState, useEffect, useRef, useCallback } from 'react';
import { getApiUrl } from '@/lib/query-client';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/logger';

interface WebSocketMessage {
  type: 'auth' | 'new_message' | 'typing' | 'pong' | 'error';
  payload?: any;
  success?: boolean;
  message?: string;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (type: string, payload: any) => void;
  subscribe: (type: string, callback: (payload: any) => void) => () => void;
}

const createLogger = (context: string) => ({
  info: (message: string, data?: any) => console.log(`[${context}] ${message}`, data || ''),
  error: (message: string, error?: any) => console.error(`[${context}] ${message}`, error || ''),
  warn: (message: string, data?: any) => console.warn(`[${context}] ${message}`, data || ''),
});

export function useWebSocket(): UseWebSocketReturn {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const subscribers = useRef<Map<string, Set<(payload: any) => void>>>(new Map());
  const log = createLogger('WebSocket');

  const connect = useCallback(() => {
    if (!user) {
      log.info('No user, skipping WebSocket connection');
      return;
    }

    try {
      const apiUrl = getApiUrl();
      const wsUrl = apiUrl.replace('https://', 'wss://').replace('http://', 'ws://');
      const url = `${wsUrl}ws`;
      
      log.info(`Connecting to WebSocket: ${url}`);
      
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        log.info('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;

        // Send authentication
        ws.current?.send(JSON.stringify({
          type: 'auth',
          payload: { userId: user.uid }
        }));

        // Start heartbeat
        const heartbeat = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        // Store heartbeat interval for cleanup
        (ws.current as any).heartbeatInterval = heartbeat;
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          if (message.type === 'auth') {
            if (message.success) {
              log.info('WebSocket authenticated');
            } else {
              log.error('WebSocket authentication failed', message.message);
            }
            return;
          }

          if (message.type === 'pong') {
            return;
          }

          // Notify subscribers
          const typeSubscribers = subscribers.current.get(message.type);
          if (typeSubscribers) {
            typeSubscribers.forEach(callback => {
              try {
                callback(message.payload);
              } catch (error) {
                log.error(`Error in subscriber callback for ${message.type}:`, error);
              }
            });
          }
        } catch (error) {
          log.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        log.error('WebSocket error:', error);
      };

      ws.current.onclose = () => {
        log.info('WebSocket disconnected');
        setIsConnected(false);

        // Clear heartbeat
        if ((ws.current as any)?.heartbeatInterval) {
          clearInterval((ws.current as any).heartbeatInterval);
        }

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          log.info(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else {
          log.error('Max reconnection attempts reached');
        }
      };
    } catch (error) {
      log.error('Error creating WebSocket connection:', error);
    }
  }, [user]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        if ((ws.current as any).heartbeatInterval) {
          clearInterval((ws.current as any).heartbeatInterval);
        }
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((type: string, payload: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload }));
    } else {
      log.warn('Cannot send message, WebSocket not connected');
    }
  }, []);

  const subscribe = useCallback((type: string, callback: (payload: any) => void) => {
    if (!subscribers.current.has(type)) {
      subscribers.current.set(type, new Set());
    }
    subscribers.current.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      const typeSubscribers = subscribers.current.get(type);
      if (typeSubscribers) {
        typeSubscribers.delete(callback);
        if (typeSubscribers.size === 0) {
          subscribers.current.delete(type);
        }
      }
    };
  }, []);

  return {
    isConnected,
    sendMessage,
    subscribe,
  };
}
