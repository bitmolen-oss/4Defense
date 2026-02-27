// Stałe techniczne gry 4 Defense
export const GAME_CONSTANTS = {
  // Rozdzielczość okna gry
  WINDOW_WIDTH: 1280,
  WINDOW_HEIGHT: 720,
  
  // Siatka mapy (izometryczna)
  GRID_SIZE: 64,
  GRID_COLS: 40,
  GRID_ROWS: 30,
  
  // Strefy mapy
  ZONES: {
    OUTER: 'outer',      // Przedmurze
    INNER: 'inner',      // Wnętrze Twierdzy
  },
  
  // Kolizje i fizyka
  COLLISION_LAYERS: {
    TOWER: 1,
    MINION: 2,
    WORKER: 3,
    PROJECTILE: 4,
  },
  
  // Czasy i opóźnienia
  TIMING: {
    WAVE_SPAWN_DELAY: 500,    // 0.5s między potworami
    WAVE_PREP_TIME: 30000,    // 30s przygotowań
    TOWER_BUILD_TIME: 3000,   // 3s budowy wieży
    WORKER_SPAWN_TIME: 3000,  // 3s rekrutacji robotnika
  },
  
  // Ekonomiczne stałe
  ECONOMY: {
    PASSIVE_INCOME_PVP: 5,    // 5 monet/s w PvP
    TOWER_SELL_RETURN: 0.5,   // 50% zwrot przy sprzedaży
    ESCAPE_COST_CRYSTALS: 100, // Koszt ucieczki w kryształach
  }
};
