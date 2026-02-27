// Główna scena gry - implementacja siatki izometrycznej
import { ASSETS } from '../config/assets.js';

export class MainGame extends Phaser.Scene {
  constructor() {
    super({ key: 'MainGame' });
  }

  create() {
    // Ustaw tło
    this.cameras.main.setBackgroundColor(ASSETS.COLORS.BACKGROUND);

    // Ujednolicenie Punktu Startowego (Origin)
    this.mapOriginX = 0; // Szczyt naszej diamentowej mapy
    this.mapOriginY = 0;
    this.tileW = 64;
    this.tileH = 32;
    this.halfW = this.tileW / 2;
    this.halfH = this.tileH / 2;
    this.mapSize = 80; // Powiększenie z 40x40 do 80x80

    // Dynamiczne Granice Kamery (Bounds)
    const paddingX = 16;
    const paddingY = 4; // Absolutne minimum
    const minX = -this.mapSize * this.halfW - paddingX;
    const minY = -paddingY;
    const boundWidth = this.mapSize * this.tileW + (paddingX * 2);
    const boundHeight = this.mapSize * this.tileH + (paddingY * 2);
    this.cameras.main.setBounds(minX, minY, boundWidth, boundHeight);

    // Zoomowanie Scrollem (Mouse Wheel)
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
        const currentZoom = this.cameras.main.zoom;
        let newZoom = currentZoom - deltaY * 0.001; // Im mniejszy mnożnik, tym płynniejszy zoom
        newZoom = Phaser.Math.Clamp(newZoom, 0.5, 1.5); // Minimalny i maksymalny zoom
        this.cameras.main.setZoom(newZoom);
    });

    // Resetowanie Zoomu (Middle Mouse Button)
    this.input.on('pointerdown', (pointer) => {
        if (pointer.middleButtonDown()) {
            this.cameras.main.setZoom(1); // Reset do domyślnej skali
        }
    });

    // Stwórz obiekt Graphics do rysowania siatki
    this.gridGraphics = this.add.graphics();
    
    // Ustaw bardzo jasny, kontrastowy kolor linii
    this.gridGraphics.lineStyle(2, 0x00ff00, 0.8);
    
    // Rysuj siatkę izometryczną - używając ujednoliconego origin
    for (let x = 0; x < this.mapSize; x++) {
      for (let y = 0; y < this.mapSize; y++) {
        // Oblicz środek kafelka WYŁĄCZNIE tak
        const isoX = this.mapOriginX + (x - y) * this.halfW;
        const isoY = this.mapOriginY + (x + y) * this.halfH;
        
        // Oblicz wierzchołki rombu względem isoX i isoY
        const topX = isoX;
        const topY = isoY - this.halfH;
        
        const rightX = isoX + this.halfW;
        const rightY = isoY;
        
        const bottomX = isoX;
        const bottomY = isoY + this.halfH;
        
        const leftX = isoX - this.halfW;
        const leftY = isoY;
        
        // Narysuj romb (kafelek)
        this.gridGraphics.beginPath();
        this.gridGraphics.moveTo(topX, topY);
        this.gridGraphics.lineTo(rightX, rightY);
        this.gridGraphics.lineTo(bottomX, bottomY);
        this.gridGraphics.lineTo(leftX, leftY);
        this.gridGraphics.closePath();
        this.gridGraphics.strokePath();
      }
    }
    
    // Stwórz obiekt do podświetlania kafelka
    this.hoverIndicator = this.add.graphics();
    this.hoverTileX = -1;
    this.hoverTileY = -1;
    
    // Prędkość kamery (piksele na sekundę)
    this.cameraSpeed = 400; // Zwiększona z 200 na 400 (100% szybciej)
    
    // Zadeklaruj klawisze WASD
    this.keys = this.input.keyboard.addKeys('W,A,S,D');
    
    // Nasłuchiwanie ESC
    this.input.keyboard.on('keydown-ESC', () => {
        this.scene.pause();
        this.scene.launch('PauseMenu');
    });
    
    // Wyliczenie środka izometrycznej mapy
    const centerX = this.mapOriginX;
    const centerY = this.mapOriginY + (this.mapSize * this.halfH);
    // Ustawienie kamery idealnie na środku przy starcie gry
    this.cameras.main.centerOn(centerX, centerY);
    
    console.log(`Siatka izometryczna wygenerowana: ${this.mapSize}x${this.mapSize} kratek`);
    console.log(`Rozmiar płótna: ${this.scale.width}x${this.scale.height}`);
    console.log(`Origin mapy: (${this.mapOriginX}, ${this.mapOriginY})`);
    console.log(`Granice kamery: X=${minX}, Y=${minY}, W=${boundWidth}, H=${boundHeight}`);
    console.log(`Środek kamery: (${centerX}, ${centerY})`);
  }

  update(time, delta) {
    const pointer = this.input.activePointer;
    const scrollAmount = (this.cameraSpeed * delta) / 1000; // Normalizuj do FPS
    
    // Sterowanie WASD
    if (this.keys.W.isDown) {
      this.cameras.main.scrollY -= scrollAmount;
    }
    if (this.keys.S.isDown) {
      this.cameras.main.scrollY += scrollAmount;
    }
    if (this.keys.A.isDown) {
      this.cameras.main.scrollX -= scrollAmount;
    }
    if (this.keys.D.isDown) {
      this.cameras.main.scrollX += scrollAmount;
    }
    
    // Edge Panning - używaj współrzędnych ekranu (pointer.x, pointer.y)
    const edgeThreshold = 40;
    
    // Lewa krawędź
    if (pointer.x < edgeThreshold) {
      this.cameras.main.scrollX -= scrollAmount;
    }
    // Prawa krawędź
    else if (pointer.x > this.scale.width - edgeThreshold) {
      this.cameras.main.scrollX += scrollAmount;
    }
    
    // Górna krawędź
    if (pointer.y < edgeThreshold) {
      this.cameras.main.scrollY -= scrollAmount;
    }
    // Dolna krawędź
    else if (pointer.y > this.scale.height - edgeThreshold) {
      this.cameras.main.scrollY += scrollAmount;
    }
    
    // Aktualizuj podświetlanie kafelka
    this.updateHoverTile(pointer.worldX, pointer.worldY);
  }

  updateHoverTile(worldX, worldY) {
    // Naprawa Hovera - TEN SAM punkt startowy do matematyki myszki
    const dx = worldX - this.mapOriginX;
    const dy = worldY - this.mapOriginY;
    
    const tileX = Math.floor((dy / this.halfH + dx / this.halfW) / 2);
    const tileY = Math.floor((dy / this.halfH - dx / this.halfW) / 2);
    
    // Warunek podświetlenia
    if (tileX >= 0 && tileX < this.mapSize && tileY >= 0 && tileY < this.mapSize) {
      // Jeśli kafelek się zmienił, zaktualizuj podświetlenie
      if (tileX !== this.hoverTileX || tileY !== this.hoverTileY) {
        this.hoverTileX = tileX;
        this.hoverTileY = tileY;
        this.drawHoverTile();
      }
    } else {
      // Wyczyść podświetlenie jeśli poza siatką
      if (this.hoverTileX !== -1 || this.hoverTileY !== -1) {
        this.hoverTileX = -1;
        this.hoverTileY = -1;
        this.hoverIndicator.clear();
      }
    }
  }

  drawHoverTile() {
    // Wyczyść poprzednie podświetlenie
    this.hoverIndicator.clear();
    
    if (this.hoverTileX === -1 || this.hoverTileY === -1) return;
    
    // Pozycja podświetlenia (identyczna jak rysowanie)
    const hoverX = this.mapOriginX + (this.hoverTileX - this.hoverTileY) * this.halfW;
    const hoverY = this.mapOriginY + (this.hoverTileX + this.hoverTileY) * this.halfH;
    
    // Oblicz wierzchołki rombu względem hoverX i hoverY
    const topX = hoverX;
    const topY = hoverY - this.halfH;
    
    const rightX = hoverX + this.halfW;
    const rightY = hoverY;
    
    const bottomX = hoverX;
    const bottomY = hoverY + this.halfH;
    
    const leftX = hoverX - this.halfW;
    const leftY = hoverY;
    
    // Narysuj wypełniony romb (podświetlenie)
    this.hoverIndicator.fillStyle(0xffff00, 0.3); // Żółty z przezroczystością
    this.hoverIndicator.beginPath();
    this.hoverIndicator.moveTo(topX, topY);
    this.hoverIndicator.lineTo(rightX, rightY);
    this.hoverIndicator.lineTo(bottomX, bottomY);
    this.hoverIndicator.lineTo(leftX, leftY);
    this.hoverIndicator.closePath();
    this.hoverIndicator.fillPath();
    
    // Dodaj obramowanie
    this.hoverIndicator.lineStyle(2, 0xffffff, 0.8);
    this.hoverIndicator.strokePath();
  }
}
