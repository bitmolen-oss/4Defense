// Usługa WebSocket (Realtime) do synchronizacji gry PvP
import { supabase } from './supabaseClient';

export class MultiplayerSync {
  constructor() {
    this.channels = new Map();
    this.roomId = null;
    this.userId = null;
    this.isHost = false;
  }
  
  // Połączenie z pokojem gry
  async connectToRoom(roomId, userId, isHost = false) {
    this.roomId = roomId;
    this.userId = userId;
    this.isHost = isHost;
    
    try {
      const channel = supabase
        .channel(`room_${roomId}`)
        .on('broadcast', { event: 'game_state' }, (payload) => {
          this.handleGameStateUpdate(payload);
        })
        .on('broadcast', { event: 'player_action' }, (payload) => {
          this.handlePlayerAction(payload);
        })
        .on('broadcast', { event: 'chat_message' }, (payload) => {
          this.handleChatMessage(payload);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Połączono z pokojem: ${roomId}`);
            this.onConnected();
          }
        });
      
      this.channels.set(roomId, channel);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Rozłączenie z pokoju
  disconnectFromRoom(roomId = null) {
    const targetRoomId = roomId || this.roomId;
    const channel = this.channels.get(targetRoomId);
    
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(targetRoomId);
      console.log(`Rozłączono z pokoju: ${targetRoomId}`);
    }
    
    if (!roomId) {
      this.roomId = null;
      this.userId = null;
      this.isHost = false;
    }
  }
  
  // Wysyłanie stanu gry (tylko host)
  broadcastGameState(gameState) {
    if (!this.isHost || !this.roomId) return;
    
    const channel = this.channels.get(this.roomId);
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'game_state',
        payload: {
          timestamp: Date.now(),
          state: gameState,
          sender: this.userId,
        },
      });
    }
  }
  
  // Wysyłanie akcji gracza
  broadcastPlayerAction(action, data) {
    if (!this.roomId) return;
    
    const channel = this.channels.get(this.roomId);
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'player_action',
        payload: {
          action,
          data,
          sender: this.userId,
          timestamp: Date.now(),
        },
      });
    }
  }
  
  // Wysyłanie wiadomości czatu
  sendChatMessage(message) {
    if (!this.roomId) return;
    
    const channel = this.channels.get(this.roomId);
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'chat_message',
        payload: {
          message,
          sender: this.userId,
          timestamp: Date.now(),
        },
      });
    }
  }
  
  // Obsługa otrzymanych aktualizacji stanu gry
  handleGameStateUpdate(payload) {
    if (payload.payload.sender === this.userId) return; // Ignoruj własne wiadomości
    
    const gameState = payload.payload.state;
    
    // Emituj zdarzenie do React/Phaser
    window.dispatchEvent(new CustomEvent('multiplayer_game_state', {
      detail: gameState
    }));
  }
  
  // Obsługa akcji gracza
  handlePlayerAction(payload) {
    if (payload.payload.sender === this.userId) return;
    
    const { action, data } = payload.payload;
    
    // Emituj zdarzenie do React/Phaser
    window.dispatchEvent(new CustomEvent('multiplayer_player_action', {
      detail: { action, data, sender: payload.payload.sender }
    }));
  }
  
  // Obsługa wiadomości czatu
  handleChatMessage(payload) {
    const { message, sender, timestamp } = payload.payload;
    
    // Emituj zdarzenie do UI
    window.dispatchEvent(new CustomEvent('multiplayer_chat_message', {
      detail: { message, sender, timestamp }
    }));
  }
  
  // Callbacki (do zdefiniowania w komponentach)
  onConnected() {
    console.log('Połączono z serwerem multiplayer');
  }
  
  onDisconnected() {
    console.log('Rozłączono z serwerem multiplayer');
  }
  
  onError(error) {
    console.error('Błąd multiplayer:', error);
  }
  
  // Metody pomocnicze
  isConnected() {
    return this.roomId !== null && this.channels.has(this.roomId);
  }
  
  getRoomId() {
    return this.roomId;
  }
  
  isHostPlayer() {
    return this.isHost;
  }
}

// Singleton dla łatwego dostępu
export const multiplayerSync = new MultiplayerSync();

// Eksport typów akcji
export const PLAYER_ACTIONS = {
  TOWER_BUILT: 'tower_built',
  TOWER_SOLD: 'tower_sold',
  TOWER_UPGRADED: 'tower_upgraded',
  WORKER_SPAWNED: 'worker_spawned',
  WORKER_MOVED: 'worker_moved',
  WORKER_REPAIRING: 'worker_repairing',
  UPGRADE_PURCHASED: 'upgrade_purchased',
  WAVE_STARTED: 'wave_started',
  PAUSE_GAME: 'pause_game',
  RESUME_GAME: 'resume_game',
  SURRENDER: 'surrender',
};
