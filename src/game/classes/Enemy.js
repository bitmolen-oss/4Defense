// Klasa Przeciwnika - implementacja izometrycznego potwora
import { FORMULAS } from '../../utils/formulas.js';

export class Enemy extends Phaser.GameObjects.Graphics {
  constructor(scene, path, stats = {}) {
    super(scene);
    
    this.scene = scene;
    this.path = path; // Tablica punktów {x, y} w koordynatach siatki
    this.currentPathIndex = 0;
    
    // Statystyki z formulas.js lub domyślne
    const level = stats.level || 1;
    this.hp = stats.hp || FORMULAS.enemyHP(level);
    this.maxHp = this.hp;
    this.speed = stats.speed || (50 * FORMULAS.enemySpeedMultiplier(level)); // Bazowa 50 px/s * mnożnik
    this.reward = stats.reward || FORMULAS.enemyReward(level);
    
    // Ustawienie pozycji startowej z pierwszego punktu ścieżki
    if (path && path.length > 0) {
      const startPoint = path[0];
      this.x = scene.mapOriginX + (startPoint.x - startPoint.y) * scene.halfW;
      this.y = scene.mapOriginY + (startPoint.x + startPoint.y) * scene.halfH;
      console.log('Spawnuje potwora na koordynatach siatki:', startPoint);
    }
    
    // Dynamiczne Z-sorting (potwór porusza się w przestrzeni 3D)
    this.setDepth(this.y);
    
    // System X-Ray (KRYTYCZNE wg Notatek Technicznych)
    this.xrayGraphics = scene.add.graphics();
    this.xrayGraphics.setAlpha(0.4); // Lekka przezroczystość dla efektu ducha
    this.xrayGraphics.setDepth(999999); // Zawsze na wierzchu mapy
    scene.add.existing(this.xrayGraphics);
    
    // Rysuj przeciwnika jako czerwoną kulę (greyboxing)
    this.drawEnemy();
    
    // Rysuj również ducha X-Ray
    this.drawXRayGhost();
  }
  
  drawEnemy() {
    // Ciało potwora - izometryczna czerwona kula
    this.fillStyle(0xff0000, 1);
    this.fillEllipse(0, -10, 16, 24); // Wrażenie perspektywy izometrycznej
    
    // Lekkie cieniowanie dla efektu 3D
    this.fillStyle(0xcc0000, 1);
    this.fillEllipse(-2, -8, 8, 12); // Ciemniejsza strona
    
    // Oczy - małe żółte punkty
    this.fillStyle(0xffff00, 1);
    this.fillEllipse(-4, -12, 2, 2);
    this.fillEllipse(4, -12, 2, 2);
  }
  
  drawXRayGhost() {
    // Rysujemy identycznego potwora jako ducha, ale z przezroczystością
    this.xrayGraphics.fillStyle(0xff0000, 1);
    this.xrayGraphics.fillEllipse(0, -10, 16, 24);
    
    // Lekkie cieniowanie dla efektu 3D
    this.xrayGraphics.fillStyle(0xcc0000, 1);
    this.xrayGraphics.fillEllipse(-2, -8, 8, 12);
    
    // Oczy - małe żółte punkty
    this.xrayGraphics.fillStyle(0xffff00, 1);
    this.xrayGraphics.fillEllipse(-4, -12, 2, 2);
    this.xrayGraphics.fillEllipse(4, -12, 2, 2);
  }
  
  update(time, delta) {
    if (this.currentPathIndex >= this.path.length) {
      // Dotarł do końca ścieżki - zniszcz potwora
      this.destroy();
      return;
    }
    
    const targetPoint = this.path[this.currentPathIndex];
    const targetIsoX = this.scene.mapOriginX + (targetPoint.x - targetPoint.y) * this.scene.halfW;
    const targetIsoY = this.scene.mapOriginY + (targetPoint.x + targetPoint.y) * this.scene.halfH;
    
    // Oblicz dystans do celu
    const dx = targetIsoX - this.x;
    const dy = targetIsoY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 2) {
      // Dotarł do punktu ścieżki - przejdź do następnego
      this.currentPathIndex++;
      if (this.currentPathIndex >= this.path.length) {
        // Koniec ścieżki - zniszcz potwora
        this.destroy();
        return;
      }
    } else {
      // Przesuwaj się w kierunku celu
      const moveDistance = this.speed * (delta / 1000); // Konwersja delta na sekundy
      const moveX = (dx / distance) * moveDistance;
      const moveY = (dy / distance) * moveDistance;
      
      this.x += moveX;
      this.y += moveY;
    }
    
    // Aktualizacja Z-Indexu dla iluzji 3D
    this.setDepth(this.y);
    
    // Synchronizuj pozycję ducha z oryginalnym potworem
    this.xrayGraphics.setPosition(this.x, this.y);
  }
  
  destroy() {
    // Upewnij się, że duch jest również zniszczony!
    if (this.xrayGraphics) {
      this.xrayGraphics.destroy();
    }
    super.destroy();
  }
}
