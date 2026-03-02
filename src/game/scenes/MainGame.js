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
    for (let y = 0; y < this.mapSize; y++) {
      this.mapGrid[y] = [];
      for (let x = 0; x < this.mapSize; x++) {
        this.mapGrid[y][x] = 0; // 0 = trawa
      }
    }

    // Budowa Architektury Centralnej
    this.buildCentralFortress();

    // Generowanie wszystkich dróg proceduralnych
    this.generateAllProceduralPaths();

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
    
    // Wywołaj metodę rysującą mapę
    this.redrawMap();
    
    // Uruchom scenę UI równolegle
    this.scene.launch('UIScene');
    
    // Zmienna aktywnego narzędzia (zamiast buildMode)
    this.activeTool = null; // może przyjmować: null, 'standard', 'premium', 'sell'
    
    // Symulacja danych z Panelu (docelowo 1 na start)
    this.unlockedGates = 4; // Symulacja danych z Panelu (docelowo 1 na start)
    
    // Generator Tekstury Konfetti
    let g = this.make.graphics({x:0, y:0, add:false});
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 6, 6);
    g.generateTexture('confettiParticle', 6, 6);
    g.destroy();
    
    // Obsługa klawisza B - przełączanie panelu UI
    this.input.keyboard.on('keydown-B', () => { 
        // Wyślij sygnał do UIScene, aby pokazała lub ukryła panel budowy
        this.scene.get('UIScene').events.emit('togglePanel');
    });
    
    // Odbieraj sygnały z UI
    this.events.on('toolSelected', (tool) => { 
        this.activeTool = tool; 
        console.log("Wybrano narzędzie: " + tool);
    });
    
    // Logika stawiania wieży (myszka)
    this.input.on('pointerdown', (pointer) => {
        if (!pointer.leftButtonDown() || !this.activeTool) return;
        
        // Blokada stawiania wieży pod UI
        if (pointer.y > this.scale.height - 120) {
          return; // Nie stawiaj wież gdy kursor jest nad panelem UI
        }

        if (this.hoverTileX !== -1 && this.hoverTileY !== -1) {
            let tx = this.hoverTileX;
            let ty = this.hoverTileY;
            
            // Sprzedaż wieży
            if (this.activeTool === 'sell') {
                let tileType = this.mapGrid[ty][tx];
                
                // ZAKAZ SPRZEDAŻY WIEŻ PREMIUM
                if (tileType === 11) {
                    return; // Zignoruj kliknięcie, wież premium nie można sprzedać
                }
                
                // NISZCZENIE BRAMY (Ryzyko za Nagrodę)
                if (tileType === 3) {
                    let tilesToDestroy = [{x: tx, y: ty}];
                    if (tx > 0 && this.mapGrid[ty][tx-1] === 3) tilesToDestroy.push({x: tx-1, y: ty});
                    if (tx + 1 < this.mapSize && this.mapGrid[ty][tx+1] === 3) tilesToDestroy.push({x: tx+1, y: ty});
                    if (ty > 0 && this.mapGrid[ty-1][tx] === 3) tilesToDestroy.push({x: tx, y: ty-1});
                    if (ty + 1 < this.mapSize && this.mapGrid[ty+1][tx] === 3) tilesToDestroy.push({x: tx, y: ty+1});
                    
                    let centerIsoX = 0, centerIsoY = 0;
                    tilesToDestroy.forEach(t => {
                        this.mapGrid[t.y][t.x] = 1; // Brama zmienia się w płaską drogę wpuszczającą potwory
                        centerIsoX += this.mapOriginX + (t.x - t.y) * this.halfW;
                        centerIsoY += this.mapOriginY + (t.x + t.y) * this.halfH;
                    });
                    
                    centerIsoX /= tilesToDestroy.length;
                    centerIsoY /= tilesToDestroy.length;
                    
                    this.triggerConfetti(centerIsoX, centerIsoY);
                    this.redrawMap();
                    return;
                }
                
                // SPRZEDAŻ STANDARDOWEJ WIEŻY (Usuwamy cały blok 2x2)
                if (tileType === 10) {
                    // Znajdź lewy górny róg (origin) tej wieży
                    let originX = tx;
                    let originY = ty;
                    if (tx > 0 && this.mapGrid[ty][tx-1] === 10) originX = tx - 1;
                    if (ty > 0 && this.mapGrid[ty-1][tx] === 10) originY = ty - 1;
                    
                    // Bezpieczne czyszczenie obszaru 2x2 (zamiana na trawę)
                    if (originY + 1 < this.mapSize && originX + 1 < this.mapSize) {
                        this.mapGrid[originY][originX] = 0;
                        this.mapGrid[originY][originX+1] = 0;
                        this.mapGrid[originY+1][originX] = 0;
                        this.mapGrid[originY+1][originX+1] = 0;
                    }
                    
                    this.redrawMap();
                }
                return;
            }
            
            // Złożony Limit Wież Premium (Zgodny z GDD)
            if (this.activeTool === 'premium') {
                // 1. BLOKADA ŚRODKÓW (Anti-Griefing):
                // Zapobiega postawieniu wieży na środku 3x3, co zablokowałoby całą ćwiartkę.
                if ((tx === 37 && ty === 37) || 
                    (tx === 42 && ty === 37) || 
                    (tx === 37 && ty === 42) || 
                    (tx === 42 && ty === 42)) {
                    console.log('Nie można budować na środku ćwiartki - blokada!');
                    return; 
                }
                
                // 2. Sprawdź, czy ćwiartka jest odblokowana przez zniszczenie przypisanej bramy
                if (!this.isQuadrantUnlocked(tx, ty)) {
                    console.log('Musisz zniszczyć przypisaną bramę, aby budować w tej ćwiartce!');
                    return;
                }
                
                // 3. Sprawdź, czy w tej ćwiartce nie ma już 2 wież (limit pojemności)
                if (this.countPremiumInQuadrant(tx, ty) >= 2) {
                    console.log('Osiągnięto limit 2 wież w tej ćwiartce!');
                    return;
                }
            }
            
            // Stawianie wieży
            let size = (this.activeTool === 'standard') ? 2 : 1;
            let towerValue = (this.activeTool === 'standard') ? 10 : 11;
            
            if (this.isValidPlacement(tx, ty, size)) {
                // Zaktualizuj mapę
                for (let x = tx; x < tx + size; x++) {
                    for (let y = ty; y < ty + size; y++) {
                        this.mapGrid[y][x] = towerValue;
                    }
                }
                
                // Odśwież mapę
                this.redrawMap();
                console.log("Postawiono " + this.activeTool + " wieżę na pozycji (" + tx + ", " + ty + ")");
            } else {
                console.log("Nie można postawić wieży na pozycji (" + tx + ", " + ty + ")");
            }
        }
    });
    
    // Stwórz obiekt do podświetlania kafelka
    this.hoverIndicator = this.add.graphics();
    this.hoverTileX = -1;
    this.hoverTileY = -1;
    
    // Prędkość kamery (piksele na sekundę)
    this.cameraSpeed = 400; // Zwiększona z 200 na 400 (100% szybciej)
    
    // Zadeklaruj klawisze WASD
    this.keys = this.input.keyboard.addKeys('W,A,S,D');
    
    // Nasłuchiwanie ESC - pauza menu
    this.input.keyboard.on('keydown-ESC', () => {
        this.scene.pause();
        this.scene.launch('PauseMenu');
    });

    // Guzik wyjścia do Launchera (Poddanie gry) - klawisz Q
    this.input.keyboard.on('keydown-Q', () => {
        if (window.electronAPI && window.electronAPI.closeGame) {
            window.electronAPI.closeGame();
        }
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

  drawIsoBlock(graphics, isoX, isoY, height, colorTop, colorLeft, colorRight) {
    const halfW = this.halfW;
    const halfH = this.halfH;
    // Punkty bazy (na ziemi)
    const bottomX = isoX;
    const bottomY = isoY + halfH;
    const leftX = isoX - halfW;
    const leftY = isoY;
    const rightX = isoX + halfW;
    const rightY = isoY;
    // Punkty dachu (przesunięte w górę o 'height')
    const topTopX = isoX;
    const topTopY = isoY - halfH - height;
    const topRightX = isoX + halfW;
    const topRightY = isoY - height;
    const topBottomX = isoX;
    const topBottomY = isoY + halfH - height;
    const topLeftX = isoX - halfW;
    const topLeftY = isoY - height;
    // Lewa ściana
    graphics.fillStyle(colorLeft, 1);
    graphics.lineStyle(1, colorLeft, 1); // DODANE
    graphics.beginPath();
    graphics.moveTo(topLeftX, topLeftY);
    graphics.lineTo(topBottomX, topBottomY);
    graphics.lineTo(bottomX, bottomY);
    graphics.lineTo(leftX, leftY);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    // Prawa ściana
    graphics.fillStyle(colorRight, 1);
    graphics.lineStyle(1, colorRight, 1); // DODANE
    graphics.beginPath();
    graphics.moveTo(topBottomX, topBottomY);
    graphics.lineTo(topRightX, topRightY);
    graphics.lineTo(rightX, rightY);
    graphics.lineTo(bottomX, bottomY);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    // Górna ściana (Dach)
    graphics.fillStyle(colorTop, 1);
    graphics.lineStyle(1, colorTop, 1); // DODANE
    graphics.beginPath();
    graphics.moveTo(topTopX, topTopY);
    graphics.lineTo(topRightX, topRightY);
    graphics.lineTo(topBottomX, topBottomY);
    graphics.lineTo(topLeftX, topLeftY);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
  }

  drawLevitatingCrystal(graphics, isoX, isoY) {
    const floatY = isoY - 25; // 25px lewitacji nad ziemią
    const h = 35; // Wysokość górnej i dolnej połówki
    const w = 18; // Szerokość
    const centerOffset = 8; // Wypukłość środka 3D
    
    const topP = {x: isoX, y: floatY - h};
    const bottomP = {x: isoX, y: floatY + h};
    const leftP = {x: isoX - w, y: floatY};
    const rightP = {x: isoX + w, y: floatY};
    const centerP = {x: isoX, y: floatY + centerOffset};
    
    // Górna lewa ściana
    graphics.fillStyle(0xbb33ff, 1); graphics.lineStyle(1, 0xbb33ff, 1);
    graphics.beginPath(); graphics.moveTo(topP.x, topP.y); graphics.lineTo(leftP.x, leftP.y); graphics.lineTo(centerP.x, centerP.y); graphics.closePath(); graphics.fillPath(); graphics.strokePath();
    // Górna prawa ściana
    graphics.fillStyle(0x9900ff, 1); graphics.lineStyle(1, 0x9900ff, 1);
    graphics.beginPath(); graphics.moveTo(topP.x, topP.y); graphics.lineTo(rightP.x, rightP.y); graphics.lineTo(centerP.x, centerP.y); graphics.closePath(); graphics.fillPath(); graphics.strokePath();
    // Dolna lewa ściana
    graphics.fillStyle(0x6600cc, 1); graphics.lineStyle(1, 0x6600cc, 1);
    graphics.beginPath(); graphics.moveTo(bottomP.x, bottomP.y); graphics.lineTo(leftP.x, leftP.y); graphics.lineTo(centerP.x, centerP.y); graphics.closePath(); graphics.fillPath(); graphics.strokePath();
    // Dolna prawa ściana
    graphics.fillStyle(0x440099, 1); graphics.lineStyle(1, 0x440099, 1);
    graphics.beginPath(); graphics.moveTo(bottomP.x, bottomP.y); graphics.lineTo(rightP.x, rightP.y); graphics.lineTo(centerP.x, centerP.y); graphics.closePath(); graphics.fillPath(); graphics.strokePath();
  }

  triggerConfetti(isoX, isoY) {
    const emitter = this.add.particles(isoX, isoY, 'confettiParticle', {
        speed: { min: 100, max: 250 },
        angle: { min: 200, max: 340 },
        scale: { start: 1, end: 0 },
        tint: [ 0xff0000, 0x00ff00, 0x0088ff, 0xffff00, 0xff00ff ],
        lifespan: 1200,
        gravityY: 300,
        quantity: 40,
        emitting: false
    });
    emitter.explode(40);
    this.time.delayedCall(1500, () => { emitter.destroy(); });
  }

  countPremiumInQuadrant(tx, ty) {
    let startX = 0, endX = 0, startY = 0, endY = 0;
    
    // Przypisanie X do połówki
    if (tx >= 36 && tx <= 38) { startX = 36; endX = 38; }
    else if (tx >= 41 && tx <= 43) { startX = 41; endX = 43; }
    
    // Przypisanie Y do połówki
    if (ty >= 36 && ty <= 38) { startY = 36; endY = 38; }
    else if (ty >= 41 && ty <= 43) { startY = 41; endY = 43; }
    
    // Jeśli kliknięto poza złotymi ćwiartkami, zignoruj
    if (startX === 0 || startY === 0) return 0;
    
    let count = 0;
    for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
            if (this.mapGrid[y][x] === 11) count++;
        }
    }
    return count;
  }

  isQuadrantUnlocked(tx, ty) {
    let quad = '';
    // Ustalanie ćwiartki na podstawie koordynatów złotych pól
    if (tx >= 36 && tx <= 38 && ty >= 36 && ty <= 38) quad = 'NW';
    else if (tx >= 41 && tx <= 43 && ty >= 36 && ty <= 38) quad = 'NE';
    else if (tx >= 36 && tx <= 38 && ty >= 41 && ty <= 43) quad = 'SW';
    else if (tx >= 41 && tx <= 43 && ty >= 41 && ty <= 43) quad = 'SE';
    
    if (quad === '') return false; // Kliknięcie poza złotymi strefami
    
    let gateExists = false;
    
    // NOWE MAPOWANIE ZGODNE Z PRZEBIEGIEM DRÓG:
    if (quad === 'SW') {
        // Lewa Brama odblokowuje Lewą-Dolną (SW)
        for(let x=30; x<=35; x++) for(let y=39; y<=40; y++) if(this.mapGrid[y][x] === 3) gateExists = true;
    } else if (quad === 'NW') {
        // Górna Brama odblokowuje Lewą-Górną (NW)
        for(let x=39; x<=40; x++) for(let y=30; y<=35; y++) if(this.mapGrid[y][x] === 3) gateExists = true;
    } else if (quad === 'SE') {
        // Dolna Brama odblokowuje Prawą-Dolną (SE)
        for(let x=39; x<=40; x++) for(let y=44; y<=50; y++) if(this.mapGrid[y][x] === 3) gateExists = true;
    } else if (quad === 'NE') {
        // Prawa Brama odblokowuje Prawą-Górną (NE)
        for(let x=44; x<=50; x++) for(let y=39; y<=40; y++) if(this.mapGrid[y][x] === 3) gateExists = true;
    }

    // Ćwiartka jest odblokowana TYLKO wtedy, gdy przypisana jej brama NIE istnieje (została zniszczona)
    return !gateExists; 
  }

  isValidPlacement(tx, ty, size) {
    // Sprawdź granice mapy
    if (tx < 0 || ty < 0 || tx + size > this.mapSize || ty + size > this.mapSize) {
      return false;
    }
    
    // Sprawdź typ terenu i zajętość
    for (let x = tx; x < tx + size; x++) {
      for (let y = ty; y < ty + size; y++) {
        const tileType = this.mapGrid[y][x];
        
        // Standardowa wieża wymaga trawy (0)
        if (this.activeTool === 'standard' && tileType !== 0) {
          return false;
        }
        
        // Premium wieża wymaga złota (2)
        if (this.activeTool === 'premium' && tileType !== 2) {
          return false;
        }
        
        // Sprawdź czy pole nie jest zajęte przez inną wieżę
        if (tileType === 10 || tileType === 11) {
          return false;
        }
      }
    }
    
    // Sprawdź odstępy (margines 1 kratki dookoła)
    for (let x = tx - 1; x <= tx + size; x++) {
      for (let y = ty - 1; y <= ty + size; y++) {
        if (x >= 0 && x < this.mapSize && y >= 0 && y < this.mapSize) {
          const tileType = this.mapGrid[y][x];
          // Jeśli w sąsiedztwie znajduje się inna wieża, zwróć false
          if (tileType === 10 || tileType === 11) {
            return false;
          }
        }
      }
    }
    
    // Limit 2 wież na daną ćwiartkę
    if (this.activeTool === 'premium') {
        if (this.countPremiumInQuadrant(tx, ty) >= 2) {
            return false; // Zwróć false / zablokuj budowę
        }
    }
    
    return true;
  }

  redrawMap() {
    // Wyczyść poprzednią mapę
    this.gridGraphics.clear();
    
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
        const tileType = this.mapGrid[y][x];
        
        // Flaga dla brył 3D
        let is3D = false;
        
        // Ustaw styl rysowania w zależności od typu kafelka
        switch (tileType) {
          case 0: // Trawa
            this.gridGraphics.lineStyle(2, 0x00ff00, 0.8); // Zielony kontur
            break;
          case 1: // Droga Zewnętrzna
            this.gridGraphics.fillStyle(0x333333, 1); // Ciemnoszary wypełnienie
            this.gridGraphics.lineStyle(1, 0x222222, 0.8); // Ciemniejszy szary kontur
            break;
          case 2: // Twierdza
            this.gridGraphics.fillStyle(0xffd700, 1); // Złoty wypełnienie
            this.gridGraphics.lineStyle(1, 0xffaa00, 0.8); // Ciemniejszy złoty kontur
            break;
          case 3: // Bramy (Jasnoniebieski)
            is3D = true;
            // Wysokość 1.5 kafelka
            this.drawIsoBlock(this.gridGraphics, isoX, isoY, this.tileH * 1.5, 0x0088ff, 0x0066cc, 0x004499);
            break;
          case 4: // Rdzeń
            is3D = true;
            // Płaska fioletowa baza na każdym z 4 kafelków
            this.gridGraphics.fillStyle(0x4a0080, 1);
            this.gridGraphics.lineStyle(1, 0x4a0080, 1); // Brak wycieku
            this.gridGraphics.beginPath();
            this.gridGraphics.moveTo(topX, topY);
            this.gridGraphics.lineTo(rightX, rightY);
            this.gridGraphics.lineTo(bottomX, bottomY);
            this.gridGraphics.lineTo(leftX, leftY);
            this.gridGraphics.closePath();
            this.gridGraphics.fillPath();
            this.gridGraphics.strokePath();
            
            // Kryształ rysujemy TYLKO raz, gdy pętla dotrze do kafelka najbardziej z przodu (X:40, Y:40)
            if (x === 40 && y === 40) {
                // Środek izometryczny obszaru 2x2 rdzenia to dokładnie górny wierzchołek kafelka 40x40
                let crystalX = isoX;
                let crystalY = isoY - this.halfH; 
                this.drawLevitatingCrystal(this.gridGraphics, crystalX, crystalY);
            }
            break;
          case 5: // Drogi Wewnętrzne
            this.gridGraphics.fillStyle(0xaaaaaa, 1); // Jasnoszary wypełnienie
            this.gridGraphics.lineStyle(1, 0x888888, 0.8); // Ciemniejszy szary kontur
            break;
          case 6: // Mury (Szary Kamień)
            is3D = true;
            // Wysokość 1.5 kafelka
            this.drawIsoBlock(this.gridGraphics, isoX, isoY, this.tileH * 1.5, 0x777777, 0x555555, 0x333333);
            break;
          case 10: // Wieża Standardowa (Ceglana/Pomarańczowa)
            is3D = true;
            // Wysokość = 2 kafelki
            this.drawIsoBlock(this.gridGraphics, isoX, isoY, this.tileH * 2, 0xff9933, 0xcc6600, 0x994400);
            break;
          case 11: // Wieża Premium (Złoty monolit)
            is3D = true;
            // Wysokość = 2.5 kafelka (wyższa i smuklejsza)
            this.drawIsoBlock(this.gridGraphics, isoX, isoY, this.tileH * 2.5, 0xffff66, 0xcccc00, 0x999900);
            break;
          default:
            this.gridGraphics.lineStyle(2, 0x00ff00, 0.8); // Domyślny zielony
        }
        
        // Rysuj płaski romb tylko dla nie-3D kafelków
        if (!is3D) {
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
    }
  }

  buildCentralFortress() {
    // KROK 1: Cała twierdza 10x10 (X: 35-44, Y: 35-44) otrzymuje wartość 2 (Złoty)
    for (let x = 35; x <= 44; x++) {
      for (let y = 35; y <= 44; y++) {
        if (x >= 0 && x < this.mapSize && y >= 0 && y < this.mapSize) {
          this.mapGrid[y][x] = 2; // 2 = Twierdza
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
    this.mapGrid[35][39] = 3;
    this.mapGrid[35][40] = 3;
    
    // Południowa: X: 39-40, Y: 44
    this.mapGrid[44][39] = 3;
    this.mapGrid[44][40] = 3;
    
    // Zachodnia: X: 35, Y: 39-40
    this.mapGrid[39][35] = 3;
    this.mapGrid[40][35] = 3;
    
    // Wschodnia: X: 44, Y: 39-40
    this.mapGrid[39][44] = 3;
    this.mapGrid[40][44] = 3;

    // KROK 4: Drogi Wewnętrzne (wartość 5). Proste ścieżki łączące bramy z rdzeniem
    // Od Północy: X: 39-40, Y: 36-38
    for (let y = 36; y <= 38; y++) {
      this.mapGrid[y][39] = 5;
      this.mapGrid[y][40] = 5;
    }
    
    // Od Południa: X: 39-40, Y: 41-43
    for (let y = 41; y <= 43; y++) {
      this.mapGrid[y][39] = 5;
      this.mapGrid[y][40] = 5;
    }
    
    // Od Zachodu: X: 36-38, Y: 39-40
    for (let x = 36; x <= 38; x++) {
      this.mapGrid[39][x] = 5;
      this.mapGrid[40][x] = 5;
    }
    
    // Od Wschodu: X: 41-43, Y: 39-40
    for (let x = 41; x <= 43; x++) {
      this.mapGrid[39][x] = 5;
      this.mapGrid[40][x] = 5;
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

  generateAllProceduralPaths() {
    // Natywny generator losowy dla wyraźniejszych zmian układu
    const getRnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    // Droga 1: Lewy-Górny (Północna Brama)
    let q1xL = getRnd(4, 10);
    let q1xR = getRnd(24, 30);
    this.drawThickPath([
        {x: 0, y: 4}, {x: q1xR, y: 4}, {x: q1xR, y: 10}, 
        {x: q1xL, y: 10}, {x: q1xL, y: 16}, {x: q1xR, y: 16}, 
        {x: q1xR, y: 22}, {x: q1xL, y: 22}, {x: q1xL, y: 28}, 
        {x: 39, y: 28}, {x: 39, y: 34} // Prostopadły finisz, zero styku z murem
    ]);
    // Droga 2: Prawy-Górny (Wschodnia Brama)
    let q2xL = getRnd(48, 54);
    let q2xR = getRnd(68, 74);
    this.drawThickPath([
        {x: 78, y: 4}, {x: q2xL, y: 4}, {x: q2xL, y: 10}, 
        {x: q2xR, y: 10}, {x: q2xR, y: 16}, {x: q2xL, y: 16}, 
        {x: q2xL, y: 22}, {x: q2xR, y: 22}, {x: q2xR, y: 39}, 
        {x: 45, y: 39} // Prostopadły finisz z daleka
    ]);
    // Droga 3: Lewy-Dolny (Zachodnia Brama)
    let q3yT = getRnd(48, 54);
    let q3yB = getRnd(68, 74);
    this.drawThickPath([
        {x: 4, y: 78}, {x: 4, y: q3yT}, {x: 10, y: q3yT}, 
        {x: 10, y: q3yB}, {x: 16, y: q3yB}, {x: 16, y: q3yT}, 
        {x: 22, y: q3yT}, {x: 22, y: q3yB}, {x: 28, y: q3yB}, 
        {x: 28, y: 39}, {x: 34, y: 39} // Prostopadły finisz z daleka
    ]);
    // Droga 4: Prawy-Dolny (Południowa Brama)
    let q4yT = getRnd(48, 54);
    let q4yB = getRnd(68, 74);
    this.drawThickPath([
        {x: 74, y: 78}, {x: 74, y: q4yT}, {x: 68, y: q4yT}, 
        {x: 68, y: q4yB}, {x: 62, y: q4yB}, {x: 62, y: q4yT}, 
        {x: 56, y: q4yT}, {x: 56, y: q4yB}, {x: 39, y: q4yB}, 
        {x: 39, y: 45} // Prostopadły finisz, zero styku z murem
    ]);
  }

  drawThickPath(waypoints) {
    for (let i = 0; i < waypoints.length - 1; i++) {
        let start = waypoints[i];
        let end = waypoints[i+1];
        let currX = start.x;
        let currY = start.y;
        
        while (currX !== end.x || currY !== end.y) {
            this.place2x2Block(currX, currY);
            if (currX !== end.x) {
                currX += (end.x > currX ? 1 : -1);
            } else if (currY !== end.y) {
                currY += (end.y > currY ? 1 : -1);
            }
        }
        this.place2x2Block(end.x, end.y);
    }
  }

  place2x2Block(x, y) {
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        let targetX = x + i;
        let targetY = y + j;
        // Sprawdzenie granic mapy
        if (targetX >= 0 && targetX < this.mapSize && targetY >= 0 && targetY < this.mapSize) {
          // Nadpisujemy TYLKO trawę (0)
          if (this.mapGrid[targetY][targetX] === 0) {
            this.mapGrid[targetY][targetX] = 1;
          }
        }
      }
    }
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
    
    // Sprawdź granice mapy
    if (tileX >= 0 && tileX < this.mapSize && tileY >= 0 && tileY < this.mapSize) {
      const tileType = this.mapGrid[tileY][tileX];
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
    
    // Blokada podświetlania mapy pod UI
    const pointer = this.input.activePointer;
    if (pointer.y > this.scale.height - 120 && this.activeTool !== null) {
      return; // Nie podświetlaj mapy gdy kursor jest nad panelem UI
    }
    
    // Jeśli wybrano narzędzie budowy lub sprzedaży
    if (this.activeTool === 'standard' || this.activeTool === 'premium' || this.activeTool === 'sell') {
      const tx = this.hoverTileX;
      const ty = this.hoverTileY;
      
      // Sprzedaż - podświetlaj wieże na czerwono
      if (this.activeTool === 'sell') {
        const tileType = this.mapGrid[ty][tx];
        if (tileType === 10 || tileType === 11) {
          const hoverX = this.mapOriginX + (tx - ty) * this.halfW;
          const hoverY = this.mapOriginY + (tx + ty) * this.halfH;
          
          // Narysuj półprzezroczystą czerwoną wieżę
          if (tileType === 10) {
            this.drawIsoBlock(this.hoverIndicator, hoverX, hoverY, this.tileH * 2, 0xff0000, 0xcc0000, 0x990000);
          } else if (tileType === 11) {
            this.drawIsoBlock(this.hoverIndicator, hoverX, hoverY, this.tileH * 2.5, 0xff0000, 0xcc0000, 0x990000);
          }
        }
        return;
      }
      
      // Budowa - pokaż ducha wieży
      let size = (this.activeTool === 'standard') ? 2 : 1;
      let isValid = this.isValidPlacement(tx, ty, size);
      
      // Złożony Limit Wież Premium (Zgodny z GDD)
      if (this.activeTool === 'premium') {
        // 1. BLOKADA ŚRODKÓW (Anti-Griefing):
        // Zapobiega postawieniu wieży na środku 3x3, co zablokowałoby całą ćwiartkę.
        if ((tx === 37 && ty === 37) || 
            (tx === 42 && ty === 37) || 
            (tx === 37 && ty === 42) || 
            (tx === 42 && ty === 42)) {
          isValid = false; // Podświetl ducha na czerwono
        }
        
        // 2. Sprawdź, czy ćwiartka jest odblokowana przez zniszczenie przypisanej bramy
        if (!this.isQuadrantUnlocked(tx, ty)) {
          isValid = false; // Podświetl ducha na czerwono
        }
        
        // 3. Sprawdź, czy w tej ćwiartce nie ma już 2 wież (limit pojemności)
        if (this.countPremiumInQuadrant(tx, ty) >= 2) {
          isValid = false; // Podświetl ducha na czerwono
        }
      }
      
      let color = isValid ? 0x00ff00 : 0xff0000; // Zielony jeśli można, czerwony jeśli nie
      
      // Narysuj ducha wieży 2x2 dla standardowej
      if (this.activeTool === 'standard') {
        // Rysuj 4 przylegające słupki w konfiguracji 2x2
        for (let dx = 0; dx < 2; dx++) {
          for (let dy = 0; dy < 2; dy++) {
            const ghostX = this.mapOriginX + ((tx + dx) - (ty + dy)) * this.halfW;
            const ghostY = this.mapOriginY + ((tx + dx) + (ty + dy)) * this.halfH;
            this.drawIsoBlock(this.hoverIndicator, ghostX, ghostY, this.tileH * 2, color, color * 0.8, color * 0.6);
          }
        }
      } else if (this.activeTool === 'premium') {
        // Premium pozostaje pojedynczy 1x1
        const hoverX = this.mapOriginX + (tx - ty) * this.halfW;
        const hoverY = this.mapOriginY + (tx + ty) * this.halfH;
        this.drawIsoBlock(this.hoverIndicator, hoverX, hoverY, this.tileH * 2.5, color, color * 0.8, color * 0.6);
      }
      
      return;
    }
    
    // Domyślne podświetlanie kafelka (gdy nie wybrano narzędzia)
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
