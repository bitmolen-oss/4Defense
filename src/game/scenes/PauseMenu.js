// Scena pauzy - menu z opcjami wrócenia do gry i wyjścia
export class PauseMenu extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseMenu' });
  }

  create() {
    // Półprzezroczyste czarne tło na cały ekran
    const background = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.7
    );
    background.setScrollFactor(0); // Tło nie przesuwa się z kamerą

    // Tytuł "PAUZA"
    const title = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 100,
      'PAUZA',
      {
        fontSize: '48px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        align: 'center'
      }
    ).setOrigin(0.5);
    title.setScrollFactor(0);

    // Przycisk "Wróć do gry"
    const resumeButton = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'Wróć do gry',
      {
        fontSize: '24px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        align: 'center'
      }
    ).setOrigin(0.5);
    resumeButton.setScrollFactor(0);
    resumeButton.setInteractive({ useHandCursor: true });

    // Hover effect dla "Wróć do gry"
    resumeButton.on('pointerover', () => {
      resumeButton.setStyle({ fill: '#ffff00' });
    });
    resumeButton.on('pointerout', () => {
      resumeButton.setStyle({ fill: '#ffffff' });
    });

    // Click event dla "Wróć do gry"
    resumeButton.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume('MainGame');
    });

    // Przycisk "Wyjdź do Launchera"
    const exitButton = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 60,
      'Wyjdź do Launchera',
      {
        fontSize: '24px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        align: 'center'
      }
    ).setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      exitButton.setStyle({ fill: '#ff6666' });
    })
    .on('pointerout', () => {
      exitButton.setStyle({ fill: '#ffffff' });
    })
    .on('pointerdown', () => {
      // Twardy reset sceny przed wyjściem
      this.scene.stop('MainGame'); // Zabija całkowicie stan mapy
      this.scene.stop('PauseMenu'); // Zamyka menu pauzy
      
      if (window.electronAPI && window.electronAPI.closeGame) {
        window.electronAPI.closeGame();
      } else {
        window.close(); // Fallback ratunkowy, gdyby IPC zawiodło
      }
    });

    // Toggle ESC - wróć do gry
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.stop();
      this.scene.resume('MainGame');
    });

    console.log('Menu pauzy zainicjalizowane');
  }
}
