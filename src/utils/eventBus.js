// Globalny emiter zdarzeń do komunikacji React <-> Phaser
class EventBus {
  constructor() {
    this.events = new Map();
    this.maxListeners = 50;
  }
  
  // Dodaj listener
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    
    const listeners = this.events.get(event);
    if (listeners.length >= this.maxListeners) {
      console.warn(`EventBus: Too many listeners for event "${event}"`);
    }
    
    listeners.push(callback);
  }
  
  // Usuń listener
  off(event, callback) {
    if (!this.events.has(event)) return;
    
    const listeners = this.events.get(event);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
    
    if (listeners.length === 0) {
      this.events.delete(event);
    }
  }
  
  // Emituj zdarzenie
  emit(event, data = {}) {
    if (!this.events.has(event)) return;
    
    const listeners = this.events.get(event);
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`EventBus: Error in listener for event "${event}":`, error);
      }
    });
  }
  
  // Emituj zdarzenie gry
  emitGameEvent(event, data = {}) {
    this.emit(event, data);
  }
  
  // Nasłuchuj na zdarzenie gry
  onGameEvent(event, callback) {
    this.on(event, callback);
  }
  
  // Usuń listener gry
  offGameEvent(event, callback) {
    this.off(event, callback);
  }
  
  // Czyść wszystkie listenery
  clearAllListeners() {
    this.events.clear();
  }
  
  // Ustaw maksymalną liczbę listenerów
  setMaxListeners(max) {
    this.maxListeners = max;
  }
}

// Eksportuj singleton
export const eventBus = new EventBus();

// Predefiniowane zdarzenia
export const GAME_EVENTS = {
  // Zdarzenia z Phasera do Reacta
  GAME_STARTED: 'game:started',
  GAME_ENDED: 'game:ended',
  WAVE_COMPLETED: 'wave:completed',
  TOWER_BUILT: 'tower:built',
  TOWER_SOLD: 'tower:sold',
  ENEMY_KILLED: 'enemy:killed',
  COINS_EARNED: 'coins:earned',
  ESCAPE_ACTIVATED: 'escape:activated',
  
  // Zdarzenia z Reacta do Phasera
  START_GAME: 'start:game',
  PAUSE_GAME: 'pause:game',
  RESUME_GAME: 'resume:game',
  BUILD_TOWER: 'build:tower',
  SELL_TOWER: 'sell:tower',
  UPGRADE_TOWER: 'upgrade:tower',
  
  // Zdarzenia sieciowe (PvP)
  PLAYER_CONNECTED: 'player:connected',
  PLAYER_DISCONNECTED: 'player:disconnected',
  MATCH_FOUND: 'match:found',
  MATCH_CANCELLED: 'match:cancelled',
  
  // Zdarzenia UI
  SHOW_NOTIFICATION: 'ui:notification',
  HIDE_NOTIFICATION: 'ui:hide_notification',
  UPDATE_HUD: 'ui:update_hud',
  SHOW_LOBBY: 'ui:show_lobby',
  HIDE_LOBBY: 'ui:hide_lobby',
};
