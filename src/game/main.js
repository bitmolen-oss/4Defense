// Główny plik konfiguracyjny silnika Phaser 3
import { MainGame } from './scenes/MainGame.js';
import { PauseMenu } from './scenes/PauseMenu.js';
import { UIScene } from './scenes/UIScene.js';

// Konfiguracja gry
const config = {
  type: Phaser.AUTO,
  width: '100%',
  height: '100%',
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%'
  },
  scene: [MainGame, PauseMenu, UIScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false
  }
};

// Inicjalizacja gry
window.addEventListener('load', () => {
  const game = new Phaser.Game(config);
  
  // Obsługa zmiany rozmiaru okna
  window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
  });
  
  console.log('Silnik Phaser 3 zainicjalizowany');
});
