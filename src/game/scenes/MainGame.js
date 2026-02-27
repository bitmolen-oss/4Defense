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
    const paddingY = 20; // Zmniejszone dla mniejszej pustej przestrzeni nad mapą
    const minX = -this.mapSize * this.halfW - paddingX;
    const minY = -paddingY;
    const boundWidth = this.mapSize * this.tileW + (paddingX * 2);
    const boundHeight = this.mapSize * this.tileH + (paddingY * 2) - 40 + 32; // Dodatkowy margines na dole
    this.cameras.main.setBounds(minX, minY, boundWidth, boundHeight);

    // Struktura Danych Mapy (Grid) - całość to trawa (wartość 0)
    this.mapGrid = [];
    for (let x = 0; x < this.mapSize; x++) {
      this.mapGrid[x] = [];
      for (let y = 0; y < this.mapSize; y++) {
        this.mapGrid[x][y] = 0; // 0 = trawa
      }
    }

    // Budowa Architektury Centralnej
    this.buildCentralFortress();

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
        
        // Pobierz typ kafelka
        const tileType = this.mapGrid[x][y];
        
        // Ustaw styl rysowania w zależności od typu kafelka
        switch (tileType) {
          case 0: // Trawa
            this.gridGraphics.lineStyle(2, 0x00ff00, 0.8); // Zielony kontur
            break;
          case 2: // Twierdza
            this.gridGraphics.fillStyle(0xffd700, 1); // Złoty wypełnienie
            this.gridGraphics.lineStyle(1, 0xffaa00, 0.8); // Ciemniejszy złoty kontur
            break;
          case 3: // Bramy
            this.gridGraphics.fillStyle(0x0088ff, 1); // Jasnoniebieski wypełnienie
            this.gridGraphics.lineStyle(1, 0x0066cc, 0.8); // Ciemniejszy niebieski kontur
            break;
          case 4: // Rdzeń
            this.gridGraphics.fillStyle(0x800080, 1); // Fioletowy wypełnienie
            this.gridGraphics.lineStyle(1, 0x600060, 0.8); // Ciemniejszy fioletowy kontur
            break;
          case 5: // Drogi Wewnętrzne
            this.gridGraphics.fillStyle(0xaaaaaa, 1); // Jasnoszary wypełnienie
            this.gridGraphics.lineStyle(1, 0x888888, 0.8); // Ciemniejszy szary kontur
            break;
          case 6: // Mury
            this.gridGraphics.fillStyle(0x555555, 1); // Ciemnoszary/kamienny wypełnienie
            this.gridGraphics.lineStyle(1, 0x333333, 0.8); // Ciemniejszy kamienny kontur
            break;
          default:
            this.gridGraphics.lineStyle(2, 0x00ff00, 0.8); // Domyślny zielony
        }
        
        // Narysuj romb (kafelek)
        this.gridGraphics.beginPath();
        this.gridGraphics.moveTo(topX, topY);
        this.gridGraphics.lineTo(rightX, rightY);
        this.gridGraphics.lineTo(bottomX, bottomY);
        this.gridGraphics.lineTo(leftX, leftY);
        this.gridGraphics.closePath();
        
        // Wypełnij i obrysuj
        if (tileType !== 0) {
          this.gridGraphics.fillPath();
        }
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

  buildCentralFortress() {
    // KROK 1: Cała twierdza 10x10 (X: 35-44, Y: 35-44) otrzymuje wartość 2 (Złoty)
    for (let x = 35; x <= 44; x++) {
      for (let y = 35; y <= 44; y++) {
        if (x >= 0 && x < this.mapSize && y >= 0 && y < this.mapSize) {
          this.mapGrid[x][y] = 2; // 2 = Twierdza
        }
      }
    }

    // KROK 2: Mury. Jeśli kafelek znajduje się na samym brzegu twierdzy, zmień na wartość 6
    for (let x = 35; x <= 44; x++) {
      for (let y = 35; y <= 44; y++) {
        if (x >= 0 && x < this.mapSize && y >= 0 && y < this.mapSize) {
          // Sprawdź czy to brzeg twierdzy
          if (x === 35 || x === 44 || y === 35 || y === 44) {
            this.mapGrid[x][y] = 6; // 6 = Mur
          }
        }
      }
    }

    // KROK 3: Bramy (wartość 3). Nadpisz odpowiednie kafelki na środkach boków
    // Północna: X: 39-40, Y: 35
    this.mapGrid[39][35] = 3;
    this.mapGrid[40][35] = 3;
    
    // Południowa: X: 39-40, Y: 44
    this.mapGrid[39][44] = 3;
    this.mapGrid[40][44] = 3;
    
    // Zachodnia: X: 35, Y: 39-40
    this.mapGrid[35][39] = 3;
    this.mapGrid[35][40] = 3;
    
    // Wschodnia: X: 44, Y: 39-40
    this.mapGrid[44][39] = 3;
    this.mapGrid[44][40] = 3;

    // KROK 4: Drogi Wewnętrzne (wartość 5). Proste ścieżki łączące bramy z rdzeniem
    // Od Północy: X: 39-40, Y: 36-38
    for (let y = 36; y <= 38; y++) {
      this.mapGrid[39][y] = 5;
      this.mapGrid[40][y] = 5;
    }
    
    // Od Południa: X: 39-40, Y: 41-43
    for (let y = 41; y <= 43; y++) {
      this.mapGrid[39][y] = 5;
      this.mapGrid[40][y] = 5;
    }
    
    // Od Zachodu: X: 36-38, Y: 39-40
    for (let x = 36; x <= 38; x++) {
      this.mapGrid[x][39] = 5;
      this.mapGrid[x][40] = 5;
    }
    
    // Od Wschodu: X: 41-43, Y: 39-40
    for (let x = 41; x <= 43; x++) {
      this.mapGrid[x][39] = 5;
      this.mapGrid[x][40] = 5;
    }

    // KROK 5: Rdzeń (wartość 4). Kwadrat 2x2 na samym środku: X: 39 do 40, Y: 39 do 40
    for (let x = 39; x <= 40; x++) {
      for (let y = 39; y <= 40; y++) {
        if (x >= 0 && x < this.mapSize && y >= 0 && y < this.mapSize) {
          this.mapGrid[x][y] = 4; // 4 = Rdzeń
        }
      }
    }

    console.log('Centralna twierdza z murami zbudowana');
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
    
    // Sprawdź typ kafelka dla koloru podświetlenia
    const tileType = this.mapGrid[this.hoverTileX][this.hoverTileY];
    
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
    
    // Zaktualizuj kolory podświetlania według UX
    if (tileType === 0) {
      // Zwykły teren pod wieże (Trawa) - SZARY
      this.hoverIndicator.fillStyle(0x888888, 0.5);
      this.hoverIndicator.lineStyle(2, 0x666666, 0.8);
    } else if (tileType === 2) {
      // Teren Premium (Złota Twierdza) - ZIELONY
      this.hoverIndicator.fillStyle(0x00ff00, 0.5);
      this.hoverIndicator.lineStyle(2, 0x00cc00, 0.8);
    } else {
      // Teren Niedostępny (3, 4, 5, 6 oraz przyszłe drogi 1) - CZERWONY
      this.hoverIndicator.fillStyle(0xff0000, 0.5);
      this.hoverIndicator.lineStyle(2, 0xff6666, 0.8);
    }
    
    // Narysuj wypełniony romb (podświetlenie)
    this.hoverIndicator.beginPath();
    this.hoverIndicator.moveTo(topX, topY);
    this.hoverIndicator.lineTo(rightX, rightY);
    this.hoverIndicator.lineTo(bottomX, bottomY);
    this.hoverIndicator.lineTo(leftX, leftY);
    this.hoverIndicator.closePath();
    this.hoverIndicator.fillPath();
    this.hoverIndicator.strokePath();
  }
}
