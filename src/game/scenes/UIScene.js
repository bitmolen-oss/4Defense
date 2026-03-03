// Scena interfejsu użytkownika dla wyboru wież - Panel Architekta
import { useGameStore } from '../../store/useGameStore.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // Panel jest domyślnie niewidoczny
    this.panelVisible = false;
    this.activeButton = null;
    
    // Stwórz Top Panel na górze ekranu
    this.createTopPanel();
    
    // Stwórz panel na dole ekranu, wyśrodkowany w poziomie
    this.createPanel();
    
    // Stwórz przyciski z ikonami geometrycznymi
    this.createIconButtons();
    
    // Nasłuchuj zdarzenia do pokazywania/ukrywania panelu
    this.events.on('togglePanel', () => {
      this.togglePanel();
    });
  }

  createTopPanel() {
    // Główny kontener panelu
    this.topPanel = this.add.container(0, 0);
    this.topPanel.setDepth(1000);
    
    const panelHeight = 60;
    
    // Tło panelu (dodane do kontenera)
    const background = this.add.graphics();
    background.fillStyle(0x333333, 0.95); // Ciemnoszare, 95% przezroczystości
    background.fillRect(0, 0, this.scale.width, panelHeight);
    background.lineStyle(1, 0x555555, 0.8);
    background.strokeRect(0, 0, this.scale.width, panelHeight);
    this.topPanel.add(background);
    
    // Teksty na panelu (dodane do kontenera)
    const textY = panelHeight / 2;
    
    // Lewa strona: Stan konta
    this.coinsText = this.add.text(60, textY, 'Monety: 0', {
      fontSize: '18px',
      fill: '#ffffff',
      backgroundColor: 'transparent'
    }).setOrigin(0, 0.5);
    this.topPanel.add(this.coinsText);
    
    // Środek: Fala
    this.waveText = this.add.text(this.scale.width / 2, textY, 'Fala: 1/10', {
      fontSize: '20px',
      fill: '#ffff00',
      backgroundColor: 'transparent',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    this.topPanel.add(this.waveText);
    
    // Prawa strona: Timer
    this.timerText = this.add.text(this.scale.width - 20, textY, 'Kolejna fala za: 30s', {
      fontSize: '18px',
      fill: '#ffffff',
      backgroundColor: 'transparent'
    }).setOrigin(1, 0.5);
    this.topPanel.add(this.timerText);
    
    // Stan panelu (widoczny/schowany)
    this.topPanelVisible = true;
    this.topPanelY = 0;
    this.topPanelHiddenY = -80; // Schowany całkowicie poza ekran
    
    // Niezależny, pływający przycisk strzałki (UCHWYT)
    this.toggleArrow = this.add.text(5, 0, '▲', {
      fontSize: '18px',
      fill: '#ffffff',
      backgroundColor: '#333333',
      padding: { left: 10, right: 10, top: 2, bottom: 2 }
    }).setInteractive({ useHandCursor: true }).setDepth(1001);
    
    // Interaktywność strzałki
    this.toggleArrow.on('pointerdown', () => {
      this.toggleTopPanel();
    });
  }

  createPanel() {
    const panelWidth = 400;
    const panelHeight = 80;
    const panelX = (this.scale.width - panelWidth) / 2; // Wyśrodkowany w poziomie
    const panelY = this.scale.height - panelHeight - 20; // Na dole ekranu
    
    // Tło panelu
    this.panel = this.add.graphics();
    this.panel.fillStyle(0x000000, 0.8); // Czarne, 80% przezroczystości
    this.panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
    this.panel.lineStyle(2, 0x444444, 0.8);
    this.panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
    
    // Ustaw interaktywność panelu, aby blokował kliknięcia pod spodem
    this.panel.setInteractive({ hitArea: new Phaser.Geom.Rectangle(panelX, panelY, panelWidth, panelHeight), hitAreaCallback: Phaser.Geom.Rectangle.Contains });
    
    // Panel domyślnie ukryty
    this.panel.setVisible(false);
    
    // Przechowaj pozycję panelu dla przycisków
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelWidth = panelWidth;
    this.panelHeight = panelHeight;
  }

  createIconButtons() {
    const buttonSize = 60;
    const buttonSpacing = 20;
    const totalWidth = (buttonSize * 3) + (buttonSpacing * 2);
    const startX = this.panelX + (this.panelWidth - totalWidth) / 2;
    const startY = this.panelY + (this.panelHeight - buttonSize) / 2;
    
    // Metoda pomocnicza do rysowania mini-brył UI
    const drawUiIsoBlock = (graphics, centerX, centerY, size, height, colorTop, colorLeft, colorRight) => {
      // Przesunięcie, aby środek bryły był w centerX, centerY
      const topY = centerY - (height / 2);
      const bottomY = centerY + (height / 2);
      
      // Wierzchołki (uproszczona izometria dla UI)
      const pTop = { x: centerX, y: topY - size/2 };
      const pRight = { x: centerX + size, y: topY };
      const pBottom = { x: centerX, y: topY + size/2 };
      const pLeft = { x: centerX - size, y: topY };
      
      const pBaseBottom = { x: centerX, y: bottomY + size/2 };
      const pBaseRight = { x: centerX + size, y: bottomY };
      const pBaseLeft = { x: centerX - size, y: bottomY };
      
      // Ściana Lewa
      graphics.fillStyle(colorLeft, 1);
      graphics.beginPath();
      graphics.moveTo(pLeft.x, pLeft.y);
      graphics.lineTo(pBottom.x, pBottom.y);
      graphics.lineTo(pBaseBottom.x, pBaseBottom.y);
      graphics.lineTo(pBaseLeft.x, pBaseLeft.y);
      graphics.closePath();
      graphics.fillPath();
      
      // Ściana Prawa
      graphics.fillStyle(colorRight, 1);
      graphics.beginPath();
      graphics.moveTo(pBottom.x, pBottom.y);
      graphics.lineTo(pRight.x, pRight.y);
      graphics.lineTo(pBaseRight.x, pBaseRight.y);
      graphics.lineTo(pBaseBottom.x, pBaseBottom.y);
      graphics.closePath();
      graphics.fillPath();
      
      // Dach
      graphics.fillStyle(colorTop, 1);
      graphics.beginPath();
      graphics.moveTo(pTop.x, pTop.y);
      graphics.lineTo(pRight.x, pRight.y);
      graphics.lineTo(pBottom.x, pBottom.y);
      graphics.lineTo(pLeft.x, pLeft.y);
      graphics.closePath();
      graphics.fillPath();
    };
    
    // Przycisk Standard (2x2) - pomarańczowa masywna kostka
    this.standardButton = this.createIconButton(
      startX, 
      startY, 
      buttonSize, 
      'standard',
      (graphics, x, y, size) => {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        // Standard (Proporcja 2x2x2: wysokość ściany to połowa całkowitej szerokości bryły)
        // size: 18 (szerokość 36), height: 18.
        drawUiIsoBlock(graphics, centerX, centerY, 18, 18, 0xff9933, 0xcc6600, 0x994400);
      }
    );
    
    // Przycisk Premium (1x1) - złoty wąski słupek
    this.premiumButton = this.createIconButton(
      startX + buttonSize + buttonSpacing, 
      startY, 
      buttonSize, 
      'premium',
      (graphics, x, y, size) => {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        // Premium (Proporcja 1x1x2.5: wysokość ściany to 1.25x całkowitej szerokości bryły)
        // size: 10 (szerokość 20), height: 25.
        drawUiIsoBlock(graphics, centerX, centerY, 10, 25, 0xffff66, 0xcccc00, 0x999900);
      }
    );
    
    // Przycisk Sprzedaj - czerwony X
    this.sellButton = this.createIconButton(
      startX + (buttonSize + buttonSpacing) * 2, 
      startY, 
      buttonSize, 
      'sell',
      (graphics, x, y, size) => {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const margin = 15;
        
        graphics.lineStyle(4, 0xff0000, 1);
        graphics.beginPath();
        graphics.moveTo(centerX - margin, centerY - margin);
        graphics.lineTo(centerX + margin, centerY + margin);
        graphics.moveTo(centerX + margin, centerY - margin);
        graphics.lineTo(centerX - margin, centerY + margin);
        graphics.strokePath();
      }
    );
  }

  createIconButton(x, y, size, toolType, iconDrawFunction) {
    // Tło przycisku
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x333333, 0.8);
    buttonBg.fillRoundedRect(0, 0, size, size, 5);
    
    // Ustaw interaktywność bezpośrednio na tle przycisku
    buttonBg.setInteractive({ hitArea: new Phaser.Geom.Rectangle(0, 0, size, size), hitAreaCallback: Phaser.Geom.Rectangle.Contains });
    
    // Ikona przycisku
    const icon = this.add.graphics();
    iconDrawFunction(icon, 0, 0, size);
    
    // Kontener przycisku
    const buttonContainer = this.add.container(x, y, [buttonBg, icon]);
    buttonContainer.setSize(size, size);
    // Nie ustawiamy interaktywności na kontenerze - tylko na tle
    
    // Zmiana koloru przy najechaniu
    buttonBg.on('pointerover', () => {
      if (this.activeButton !== buttonContainer) {
        buttonBg.clear();
        buttonBg.fillStyle(0x555555, 0.9);
        buttonBg.fillRoundedRect(0, 0, size, size, 5);
      }
    });
    
    buttonBg.on('pointerout', () => {
      if (this.activeButton !== buttonContainer) {
        buttonBg.clear();
        buttonBg.fillStyle(0x333333, 0.8);
        buttonBg.fillRoundedRect(0, 0, size, size, 5);
      }
    });
    
    // Kliknięcie przycisku
    buttonBg.on('pointerdown', () => {
      // Jeśli kliknięty przycisk jest już aktywny, odznacz go
      if (this.activeButton === buttonContainer) {
        this.setActiveButton(null);
        this.scene.get('MainGame').events.emit('toolSelected', null);
      } else {
        // Ustaw nowy aktywny przycisk
        this.setActiveButton(buttonContainer);
        this.scene.get('MainGame').events.emit('toolSelected', toolType);
      }
    });
    
    // Przyciski domyślnie ukryte
    buttonContainer.setVisible(false);
    
    return buttonContainer;
  }

  setActiveButton(button) {
    // Reset poprzedniego aktywnego przycisku
    if (this.activeButton) {
      const bg = this.activeButton.first;
      bg.clear();
      bg.fillStyle(0x333333, 0.8);
      bg.fillRoundedRect(0, 0, 60, 60, 5);
    }
    
    // Ustaw nowy aktywny przycisk
    this.activeButton = button;
    
    if (button) {
      const bg = button.first;
      bg.clear();
      bg.fillStyle(0x00aa00, 0.9); // Jasna zielona ramka dla aktywnego
      bg.fillRoundedRect(0, 0, 60, 60, 5);
      bg.lineStyle(2, 0x00ff00, 1);
      bg.strokeRoundedRect(0, 0, 60, 60, 5);
    }
  }

  togglePanel() {
    this.panelVisible = !this.panelVisible;
    
    // Pokaż/ukryj panel
    this.panel.setVisible(this.panelVisible);
    
    // Pokaż/ukryj przyciski
    this.standardButton.setVisible(this.panelVisible);
    this.premiumButton.setVisible(this.panelVisible);
    this.sellButton.setVisible(this.panelVisible);
    
    // Jeśli panel jest zamykany, resetuj wybrane narzędzie
    if (!this.panelVisible) {
      this.setActiveButton(null);
      this.scene.get('MainGame').events.emit('toolSelected', null);
    }
  }

  toggleTopPanel() {
    this.topPanelVisible = !this.topPanelVisible;
    const targetY = this.topPanelVisible ? this.topPanelY : this.topPanelHiddenY;
    
    // Zmień tekst niezależnego przycisku
    this.toggleArrow.setText(this.topPanelVisible ? '▲' : '▼');
    
    // Animacja przesuwania kontenera (strzałka jest niezależna!)
    this.tweens.add({
      targets: this.topPanel,
      y: targetY,
      duration: 300,
      ease: 'Power2'
    });
  }

  update(time, delta) {
    // Pobierz referencję do MainGame i WaveManager
    const mainGame = this.scene.get('MainGame');
    if (!mainGame || !mainGame.waveManager) return;
    
    const waveManager = mainGame.waveManager;
    
    // Aktualizuj tekst fali
    this.waveText.setText(`Fala: ${waveManager.currentWave}/10`);
    
    // Live Timer - odliczanie co do sekundy
    if (waveManager.isWaveActive) {
      this.timerText.setText('Fala w toku');
    } else if (waveManager.countdownTimer && waveManager.countdownTimer.getRemainingSeconds) {
      const remainingSeconds = Math.ceil(waveManager.countdownTimer.getRemainingSeconds());
      this.timerText.setText(`Kolejna fala za: ${remainingSeconds}s`);
    } else {
      this.timerText.setText('Kolejna fala za: 30s');
    }
    
    // Aktualizuj stan konta z Zustand
    const gameState = useGameStore.getState();
    this.coinsText.setText(`Monety: ${gameState.coins_active || 0}`);
  }
}
