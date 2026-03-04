// Klasa Wieży Obronnej - implementacja wieży standardowej
import { FORMULAS } from '../../utils/formulas.js';
import { useGameStore } from '../../store/useGameStore.js';

export class Tower extends Phaser.GameObjects.Graphics {
  constructor(scene, x, y) {
    super(scene);
    
    this.scene = scene;
    this.x = x;
    this.y = y;
    
    // Pobierz poziomy ulepszeń ze stanu
    const gameState = useGameStore.getState();
    const upgrades = gameState.upgrades || {
      tower_damage_lvl: 1,
      tower_speed_lvl: 1,
      tower_range_lvl: 1
    };
    
    // Oblicz statystyki na podstawie ulepszeń
    this.damage = FORMULAS.towerDamage(upgrades.tower_damage_lvl);
    this.shootInterval = FORMULAS.towerSpeedSeconds(upgrades.tower_speed_lvl) * 1000; // Konwersja na milisekundy
    this.range = FORMULAS.towerRange(upgrades.tower_range_lvl);
    
    // Cooldown strzału zamiast timera
    this.nextFireTime = 0; // Wieża gotowa do strzału od razu
    
    // Wizualizacja zasięgu
    this.rangeIndicator = scene.add.graphics();
    this.rangeIndicator.setDepth(10); // Nad drogami, ale pod wieżami
    this.rangeIndicator.lineStyle(2, 0xffffff, 0.5);
    // Precyzyjne wycentrowanie izometryczne
    const centerY = this.y + (scene.halfH || 16); // Dodajemy halfH aby wycentrować izometrycznie
    this.rangeIndicator.strokeEllipse(this.x, centerY, this.range * 2, this.range); 
    this.rangeIndicator.setVisible(false); // Domyślnie ukryte
    
    // Pasek przeładowania
    this.reloadBar = scene.add.graphics();
    this.reloadBar.setDepth(999999); // Na 100% nad wszystkim innym
    
    // Rysuj wieżę jako niebieski kwadrat (greyboxing)
    this.drawTower();
    
    // Dodaj do sceny
    scene.add.existing(this);
  }
  
  drawTower() {
    // Podstawa wieży - niebieski kwadrat
    this.fillStyle(0x0066cc, 1);
    this.fillRect(-16, -16, 32, 32);
    
    // Lekki efekt 3D
    this.fillStyle(0x004499, 1);
    this.fillRect(-16, -16, 32, 4); // Górna krawędź
    this.fillStyle(0x003366, 1);
    this.fillRect(-16, 12, 32, 4); // Dolna krawędź
    
    // Dynamiczne Z-sorting
    this.setDepth(this.y);
  }
  
  update(time, delta) {
    // Sprawdź czy wieża jest gotowa do strzału
    const isReady = time >= this.nextFireTime;
    
    if (isReady) {
      // Znajdź najbliższego wroga w zasięgu
      const nearestEnemy = this.findNearestEnemy();
      
      if (nearestEnemy) {
        const distance = this.getDistance(nearestEnemy);
        if (distance <= this.range) {
          // Wykonaj strzał
          this.fireAtEnemy(nearestEnemy);
          
          // Zresetuj cooldown
          this.nextFireTime = time + this.shootInterval;
        }
      }
    }
    
    // Rysuj pasek przeładowania tylko gdy flaga jest włączona
    if (this.scene.showAllReloads) {
      this.reloadBar.clear();
      
      // Oblicz postęp (ładująca się bateria - 0 = pusty, 1 = pełny)
      let progress = 1;
      if (time < this.nextFireTime) {
        progress = 1 - ((this.nextFireTime - time) / this.shootInterval);
        progress = Math.max(0, Math.min(1, progress)); // Zabezpieczenie przed wartościami 0-1
      }
      
      // Tło paska (ciemnoszare) - wyraźne nad wieżą
      this.reloadBar.fillStyle(0x333333, 0.8);
      this.reloadBar.fillRect(this.x - 20, this.y - 50, 40, 6);
      
      // Zapełnienie (zielone) - wyraźne nad wieżą
      this.reloadBar.fillStyle(0x00ff00, 1);
      this.reloadBar.fillRect(this.x - 20, this.y - 50, 40 * progress, 6);
    } else {
      // Wyczyść pasek gdy GUI jest wyłączone
      this.reloadBar.clear();
    }
    
    // Reagowanie na GUI - pokaz/ukryj zasięg
    if (this.scene.showAllRanges) {
      this.rangeIndicator.clear();
      this.rangeIndicator.lineStyle(2, 0xffffff, 0.5);
      // Precyzyjne wycentrowanie izometryczne
      const centerY = this.y + (this.scene.halfH || 16); // Dodajemy halfH aby wycentrować izometrycznie
      this.rangeIndicator.strokeEllipse(this.x, centerY, this.range * 2, this.range);
      this.rangeIndicator.setVisible(true);
    } else {
      this.rangeIndicator.setVisible(false);
    }
  }
  
  fireAtEnemy(enemy) {
    // Hitscan - zadaj obrażenia natychmiast
    enemy.hp -= this.damage;
    
    // Wizualizacja pocisku
    this.createProjectile(enemy);
    
    // Sprawdź śmierć wroga
    if (enemy.hp <= 0 && !enemy.isDead) {
      enemy.isDead = true;
      
      // Dodaj nagrodę monetarną
      const gameState = useGameStore.getState();
      if (gameState.addActiveCoins) {
        gameState.addActiveCoins(enemy.reward);
      }
      
      // Usuń wroga
      enemy.destroy();
      
      // Usuń z tablicy enemies
      const index = this.scene.enemies.indexOf(enemy);
      if (index > -1) {
        this.scene.enemies.splice(index, 1);
      }
    }
  }
  
  findNearestEnemy() {
    if (!this.scene.enemies || this.scene.enemies.length === 0) return null;
    
    let nearestEnemy = null;
    let minDistance = Infinity;
    
    for (const enemy of this.scene.enemies) {
      if (enemy.isDead) continue;
      
      const distance = this.getDistance(enemy);
      if (distance < minDistance) {
        minDistance = distance;
        nearestEnemy = enemy;
      }
    }
    
    return nearestEnemy;
  }
  
  getDistance(enemy) {
    // Prawdziwy środek wieży to podstawa, nie środek sprite
    const towerBaseX = this.x;
    const towerBaseY = this.y + (this.scene.halfH || 16);
    
    const dx = Math.abs(towerBaseX - enemy.x);
    const dy = Math.abs(towerBaseY - enemy.y);
    
    // W izometrii 2:1, różnica Y jest wizualnie o połowę mniejsza, więc do wzoru dystansu mnożymy ją x2
    const distance = Math.sqrt(dx * dx + (dy * 2) * (dy * 2));
    
    return distance;
  }
  
  createProjectile(targetEnemy) {
    // Stwórz duży pocisk (żółta kula startująca ze szczytu wieży)
    const bullet = this.scene.add.circle(this.x, this.y - 20, 5, 0xffff00);
    
    // Ustaw absolutny priorytet renderowania
    bullet.setDepth(999999);
    
    // Animacja pocisku do celu
    this.scene.tweens.add({
      targets: bullet,
      x: targetEnemy.x,
      y: targetEnemy.y,
      duration: 150,
      onComplete: () => {
        bullet.destroy();
      }
    });
  }
  
  destroy() {
    // Usuń elementy wizualne
    if (this.rangeIndicator) {
      this.rangeIndicator.destroy();
    }
    if (this.reloadBar) {
      this.reloadBar.destroy();
    }
    
    super.destroy();
  }
}
