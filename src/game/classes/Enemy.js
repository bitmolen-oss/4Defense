// Klasa Przeciwnika - implementacja izometrycznego potwora
export class Enemy extends Phaser.GameObjects.Graphics {
  constructor(scene, path) {
    super(scene);
    
    this.scene = scene;
    this.path = path; // Tablica punktów {x, y} w koordynatach siatki
    this.currentPathIndex = 0;
    this.speed = 50; // pikseli na sekundę
    
    // Ustawienie pozycji startowej z pierwszego punktu ścieżki
    if (path && path.length > 0) {
      const startPoint = path[0];
      this.x = scene.mapOriginX + (startPoint.x - startPoint.y) * scene.halfW;
      this.y = scene.mapOriginY + (startPoint.x + startPoint.y) * scene.halfH;
      console.log('Spawnuje potwora na koordynatach siatki:', startPoint);
    }
    
    // Ustawienie Z-Index by potwór nie schował się pod kafelkami 3D
    this.setDepth(1000); // Rysowanie nad całą mapą
    
    // Rysuj przeciwnika jako izometryczną czerwoną kulę
    this.drawEnemy();
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
  }
}
