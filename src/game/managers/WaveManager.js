// Centralny plik ze wszystkimi wzorami matematycznymi z GDD
// Zasada architektoniczna: ZERO hardcodowania liczb w klasach Phasera czy Reacta
import { FORMULAS } from '../../utils/formulas.js';
import { Enemy } from '../classes/Enemy.js';

export class WaveManager {
  constructor(scene) {
    this.scene = scene;
    this.currentWave = 1; // Domyślnie 1, max 10
    this.isWaveActive = false;
    this.countdownTime = 10000; // 10 sekund w milisekundach
    this.spawnDelay = 500; // 0.5 sekundy między potworami
    this.monstersToSpawn = 0;
    this.monstersSpawned = 0;
    this.level = 1; // Poziom gry P (docelowo z Panelu)
    this.paths = []; // Bezpieczna kopia ścieżek (niezależna od sceny)
  }

  /**
   * Inicjalizuje ścieżki - tworzy bezpieczną kopię niezależną od sceny
   */
  initPaths(pathsArray) {
    console.log('WaveManager: Inicjalizuję ścieżki, liczba:', pathsArray.length);
    this.paths = [...pathsArray]; // Głęboka kopia tablicy ścieżek
  }

  /**
   * Rozpoczyna odliczanie 30 sekund do następnej fali
   */
  startCountdown() {
    console.log(`Rozpoczynam odliczanie 30 sekund do fali ${this.currentWave}...`);

    // Zapisz referencję do timera dla UIScene
    this.countdownTimer = this.scene.time.delayedCall(this.countdownTime, () => {
      this.spawnWave();
      this.countdownTimer = null; // Wyczyść po zakończeniu
    });
  }

  /**
   * Rozpoczyna wypuszczanie potworów z obecnej fali
   */
  spawnWave() {
    if (this.isWaveActive) {
      console.log('Fala już jest aktywna!');
      return;
    }

    console.log(`Rozpoczynam falę ${this.currentWave}!`);
    this.isWaveActive = true;
    this.monstersSpawned = 0;

    // Pobierz liczbę potworów z formulas.js
    this.monstersToSpawn = FORMULAS.getWaveMonsterCount(
      this.level, 
      this.currentWave, 
      this.scene.unlockedGates
    );

    console.log(`Do zrespienia: ${this.monstersToSpawn} potworów`);

    // Wypuszczaj potworów co 0.5 sekundy
    this.spawnTimer = this.scene.time.addEvent({
      delay: this.spawnDelay,
      repeat: this.monstersToSpawn - 1, // -1 bo first callback wykonuje się natychmiast
      callback: () => {
        this.spawnSingleEnemy();
      }
    });

    // Pierwszy potwór natychmiast
    this.spawnSingleEnemy();
  }

  /**
   * Wypuszcza pojedynczego potwora na losowej ścieżce
   */
  spawnSingleEnemy() {
    if (this.monstersSpawned >= this.monstersToSpawn) {
      return;
    }

    // Używaj bezpiecznej kopii ścieżek zamiast zmiennej ze sceny
    const paths = this.paths;
    
    // Sprawdź czy są dostępne ścieżki
    if (!paths || paths.length === 0) {
      console.error('Brak dostępnych ścieżek dla potworów!');
      return;
    }

    // Wybierz ścieżkę używając operatora modulo dla równomiernego rozdziału
    const pathIndex = this.monstersSpawned % paths.length;
    const selectedPath = paths[pathIndex];

    // Stwórz prawdziwego potwora zamiast dummy
    const stats = {
      level: this.level,
      hp: FORMULAS.enemyHP(this.level),
      speed: 50 * FORMULAS.enemySpeedMultiplier(this.level),
      reward: FORMULAS.enemyReward(this.level)
    };
    
    const enemy = new Enemy(this.scene, selectedPath, stats);
    this.scene.add.existing(enemy);
    this.scene.enemies.push(enemy);
    
    this.monstersSpawned++;
    
    console.log(`Wypuszczono potwora ${this.monstersSpawned}/${this.monstersToSpawn} na ścieżce ${pathIndex}`);

    // Jeśli to był ostatni potwór, zakończ timer
    if (this.monstersSpawned >= this.monstersToSpawn) {
      this.spawnTimer.remove();
      console.log('Wszystkie potwory z fali zostały wypuszczone');
    }
  }

  /**
   * Sprawdza czy fala się zakończyła
   */
  checkWaveCompletion() {
    // Jeśli nie ma aktywnej fali, nie rób nic
    if (!this.isWaveActive) {
      return;
    }

    // Sprawdź czy wszystkie potwory zostały już fizycznie zrespione
    if (this.monstersSpawned < this.monstersToSpawn) {
      return; // Jeszcze nie wszystkie potwory zostały stworzone
    }

    // Sprawdź czy wszystkie potwory zostały pokonane (tablica enemies jest pusta)
    if (this.scene.enemies.length === 0) {
      console.log(`Fala ${this.currentWave} zakończona!`);
      this.isWaveActive = false;

      // Zwiększ numer fali (jeśli jest mniejszy niż 10)
      if (this.currentWave < 10) {
        this.currentWave++;
        console.log(`Następna fala: ${this.currentWave}`);
        
        // Rozpocznij odliczanie do następnej fali
        this.startCountdown();
      } else {
        console.log('Gratulacje! Wszystkie 10 fal ukończone!');
        // Tutaj można dodać logikę końca gry (wygrana)
      }
    }
  }
}
