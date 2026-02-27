// Główna scena gry - implementacja siatki izometrycznej
import { ASSETS } from '../config/assets.js';

export class MainGame extends Phaser.Scene {
  constructor() {
    super({ key: 'MainGame' });
  }

  create() {
    // Ustaw tło
    this.cameras.main.setBackgroundColor(ASSETS.COLORS.BACKGROUND);

    // Konfiguracja siatki izometrycznej
    const GRID_SIZE = 20; // 20x20 kratek
    const TILE_WIDTH = 64;
    const TILE_HEIGHT = 32;
    
    // Oblicz środek ekranu
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    
    // Oblicz przesunięcie aby siatka była wyśrodkowana
    const startX = centerX - (GRID_SIZE * TILE_WIDTH) / 2;
    const startY = centerY - (GRID_SIZE * TILE_HEIGHT) / 2;

    // Stwórz obiekt Graphics do rysowania siatki
    const graphics = this.add.graphics();
    
    // Ustaw bardzo jasny, kontrastowy kolor linii
    graphics.lineStyle(2, 0x00ff00, 0.8);
    
    // Rysuj siatkę izometryczną - romby (kafelki)
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        // Oblicz pozycję środka kafelka
        const tileCenterX = startX + col * TILE_WIDTH + TILE_WIDTH / 2;
        const tileCenterY = startY + row * TILE_HEIGHT + TILE_HEIGHT / 2;
        
        // Oblicz wierzchołki rombu (kafelka izometrycznego)
        const topX = tileCenterX;
        const topY = tileCenterY - TILE_HEIGHT / 2;
        
        const rightX = tileCenterX + TILE_WIDTH / 2;
        const rightY = tileCenterY;
        
        const bottomX = tileCenterX;
        const bottomY = tileCenterY + TILE_HEIGHT / 2;
        
        const leftX = tileCenterX - TILE_WIDTH / 2;
        const leftY = tileCenterY;
        
        // Narysuj romb (kafelek)
        graphics.beginPath();
        graphics.moveTo(topX, topY);
        graphics.lineTo(rightX, rightY);
        graphics.lineTo(bottomX, bottomY);
        graphics.lineTo(leftX, leftY);
        graphics.closePath();
        graphics.strokePath();
      }
    }
    
    // Dodaj tekst informacyjny
    this.add.text(centerX, 50, 'IZOMETRYCZNA SIATKA - 4 DEFENSE', {
      fontSize: '24px',
      fill: ASSETS.COLORS.UI_TEXT,
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5);
    
    // Dodaj informacje o rozmiarze siatki
    this.add.text(centerX, 80, `Siatka: ${GRID_SIZE}x${GRID_SIZE} | Kafelki: ${TILE_WIDTH}x${TILE_HEIGHT}px`, {
      fontSize: '16px',
      fill: ASSETS.COLORS.UI_ACCENT,
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5);
    
    console.log(`Siatka izometryczna wygenerowana: ${GRID_SIZE}x${GRID_SIZE} kratek`);
    console.log(`Rozmiar płótna: ${this.scale.width}x${this.scale.height}`);
    console.log(`Pozycja startowa: ${startX}, ${startY}`);
  }
}
