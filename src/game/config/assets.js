// Definicje placeholderów graficznych (Greyboxing)
// W przyszłości wystarczy podmienić te definicje na prawdziwe assety

export const ASSETS = {
  // === KOLORY I STYLE ===
  COLORS: {
    // Podstawowe kolory
    BACKGROUND: '#1a1a2e',
    GRID: '#16213e',
    GRID_LINES: '#0f3460',
    
    // Gracz
    PLAYER_TOWER: '#00ff41',
    PLAYER_FORTRESS: '#0099ff',
    PLAYER_GATE: '#0066cc',
    PLAYER_WORKER: '#ffaa00',
    
    // Przeciwnicy
    ENEMY_MINION: '#ff3333',
    ENEMY_BOSS: '#cc0000',
    
    // UI
    UI_BACKGROUND: '#2d2d44',
    UI_BORDER: '#4a4a6a',
    UI_TEXT: '#ffffff',
    UI_ACCENT: '#00ff41',
    
    // Zony mapy
    ZONE_OUTER: '#1a1a2e',
    ZONE_INNER: '#16213e',
    PATH: '#8b4513',
  },
  
  // === OBIEKTY GRY (Placeholdery) ===
  
  // Wieże
  TOWER: {
    STANDARD: {
      width: 32,
      height: 32,
      color: '#00ff41',
      borderColor: '#00cc33',
      rangeColor: 'rgba(0, 255, 65, 0.2)',
    },
    PREMIUM: {
      width: 40,
      height: 40,
      color: '#ffaa00',
      borderColor: '#ff8800',
      rangeColor: 'rgba(255, 170, 0, 0.3)',
    },
  },
  
  // Jednostki
  MINION: {
    BASIC: {
      width: 20,
      height: 20,
      color: '#ff3333',
      borderColor: '#cc0000',
      speed: 50, // px/s
    },
    FAST: {
      width: 16,
      height: 16,
      color: '#ff6666',
      borderColor: '#ff3333',
      speed: 80,
    },
    TANK: {
      width: 28,
      height: 28,
      color: '#cc0000',
      borderColor: '#990000',
      speed: 30,
    },
  },
  
  // Robotnicy
  WORKER: {
    width: 24,
    height: 24,
    color: '#ffaa00',
    borderColor: '#ff8800',
    speed: 100, // px/s
  },
  
  // Budynki
  FORTRESS: {
    width: 64,
    height: 64,
    color: '#0099ff',
    borderColor: '#0066cc',
  },
  
  GATE: {
    width: 48,
    height: 48,
    color: '#0066cc',
    borderColor: '#004499',
  },
  
  // Pociski
  PROJECTILE: {
    BULLET: {
      width: 4,
      height: 4,
      color: '#ffff00',
      speed: 400, // px/s
    },
    LASER: {
      width: 2,
      height: 20,
      color: '#ff00ff',
      speed: 800,
    },
    MISSILE: {
      width: 8,
      height: 8,
      color: '#ff6600',
      speed: 200,
    },
  },
  
  // === FUNKCJE GENERUJĄCE ASSETY ===
  
  // Generuj prostokąt (wieże, budynki)
  generateRectangle(scene, x, y, config) {
    const graphics = scene.add.graphics();
    graphics.fillStyle(config.color);
    graphics.fillRect(x - config.width/2, y - config.height/2, config.width, config.height);
    
    if (config.borderColor) {
      graphics.lineStyle(2, config.borderColor);
      graphics.strokeRect(x - config.width/2, y - config.height/2, config.width, config.height);
    }
    
    return graphics;
  },
  
  // Generuj koło (jednostki, pociski)
  generateCircle(scene, x, y, config) {
    const graphics = scene.add.graphics();
    graphics.fillStyle(config.color);
    graphics.fillCircle(x, y, config.width/2);
    
    if (config.borderColor) {
      graphics.lineStyle(2, config.borderColor);
      graphics.strokeCircle(x, y, config.width/2);
    }
    
    return graphics;
  },
  
  // Generuj ścieżkę
  generatePath(scene, pathPoints) {
    const graphics = scene.add.graphics();
    graphics.lineStyle(4, ASSETS.COLORS.PATH);
    
    if (pathPoints.length > 0) {
      graphics.moveTo(pathPoints[0].x, pathPoints[0].y);
      
      for (let i = 1; i < pathPoints.length; i++) {
        graphics.lineTo(pathPoints[i].x, pathPoints[i].y);
      }
    }
    
    return graphics;
  },
  
  // Generuj siatkę
  generateGrid(scene, cols, rows, cellSize) {
    const graphics = scene.add.graphics();
    graphics.lineStyle(1, ASSETS.COLORS.GRID_LINES, 0.3);
    
    // Linie pionowe
    for (let x = 0; x <= cols; x++) {
      graphics.moveTo(x * cellSize, 0);
      graphics.lineTo(x * cellSize, rows * cellSize);
    }
    
    // Linie poziome
    for (let y = 0; y <= rows; y++) {
      graphics.moveTo(0, y * cellSize);
      graphics.lineTo(cols * cellSize, y * cellSize);
    }
    
    return graphics;
  },
  
  // Generuj zasięg wieży
  generateRangeIndicator(scene, x, y, range) {
    const graphics = scene.add.graphics();
    graphics.fillStyle(ASSETS.COLORS.PLAYER_TOWER, 0.2);
    graphics.fillCircle(x, y, range);
    graphics.lineStyle(1, ASSETS.COLORS.PLAYER_TOWER, 0.5);
    graphics.strokeCircle(x, y, range);
    return graphics;
  },
  
  // Generuj pasek HP
  generateHealthBar(scene, x, y, width, height, currentHP, maxHP) {
    const graphics = scene.add.graphics();
    
    // Tło paska
    graphics.fillStyle(0x333333);
    graphics.fillRect(x - width/2, y - height/2, width, height);
    
    // HP bar
    const hpPercentage = Math.max(0, currentHP / maxHP);
    const hpColor = hpPercentage > 0.5 ? 0x00ff00 : hpPercentage > 0.25 ? 0xffff00 : 0xff0000;
    
    graphics.fillStyle(hpColor);
    graphics.fillRect(x - width/2, y - height/2, width * hpPercentage, height);
    
    // Obramowanie
    graphics.lineStyle(1, 0xffffff);
    graphics.strokeRect(x - width/2, y - height/2, width, height);
    
    return graphics;
  },
  
  // Generuj ikonę budowy
  generateBuildIcon(scene, x, y, type) {
    const config = ASSETS.TOWER[type];
    if (!config) return null;
    
    const graphics = scene.add.graphics();
    graphics.fillStyle(config.color, 0.7);
    graphics.fillRect(x - config.width/2, y - config.height/2, config.width, config.height);
    
    graphics.lineStyle(2, config.borderColor, 0.9);
    graphics.strokeRect(x - config.width/2, y - config.height/2, config.width, config.height);
    
    // Dodaj ikonę narzędzia
    graphics.fillStyle(0xffffff);
    graphics.fillRect(x - 2, y - 8, 4, 16);
    graphics.fillRect(x - 8, y - 2, 16, 4);
    
    return graphics;
  },
};
