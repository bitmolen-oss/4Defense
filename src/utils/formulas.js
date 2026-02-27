// Centralny plik ze wszystkimi wzorami matematycznymi z GDD
// KRYTYCZNE: Wszystkie obliczenia gry muszą przechodzić przez ten plik!

export const FORMULAS = {
  // === SKALOWANIE PRZECIWNIKÓW ===
  
  // HP Przeciwnika: HP = P^2
  enemyHP: (level) => Math.pow(level, 2),
  
  // Mnożnik prędkości przeciwnika: 0.95 + (P × 0.05)
  enemySpeedMultiplier: (level) => 0.95 + (level * 0.05),
  
  // Nagroda za zabicie: Monety = P × 5
  enemyReward: (level) => level * 5,
  
  // Ilość potworów w fali: 10 + (F - 1) × I
  // gdzie I = 3 + ⌊P / 10⌋
  waveEnemyCount: (level, wave) => {
    const increment = 3 + Math.floor(level / 10);
    return 10 + (wave - 1) * increment;
  },
  
  // === SKALOWANIE WIEŻ STANDARDOWYCH ===
  
  // Siła wieży: 1 × U^2
  towerDamage: (upgradeLevel) => Math.pow(upgradeLevel, 2),
  
  // Czas strzału: 10.1 - (U × 0.1)
  towerFireRate: (upgradeLevel) => 10.1 - (upgradeLevel * 0.1),
  
  // Zasięg wieży: 95 + (U × 5)
  towerRange: (upgradeLevel) => 95 + (upgradeLevel * 5),
  
  // Koszt ulepszenia wieży: 10 × U^2.5
  towerUpgradeCost: (upgradeLevel) => Math.floor(10 * Math.pow(upgradeLevel, 2.5)),
  
  // === SKALOWANIE BRAM ===
  
  // HP Bramy: 100 × U^2
  gateHP: (upgradeLevel) => 100 * Math.pow(upgradeLevel, 2),
  
  // Koszt ulepszenia bramy: 20 × U^2.5
  gateUpgradeCost: (upgradeLevel) => Math.floor(20 * Math.pow(upgradeLevel, 2.5)),
  
  // === SKALOWANIE TWIERDZY ===
  
  // HP Twierdzy: 100 × U^2
  fortressHP: (upgradeLevel) => 100 * Math.pow(upgradeLevel, 2),
  
  // Koszt ulepszenia twierdzy: 5 × U^2 (w kryształach)
  fortressUpgradeCost: (upgradeLevel) => 5 * Math.pow(upgradeLevel, 2),
  
  // === WIEŻE PREMIUM ===
  
  // Siła wieży premium: 1000 × P^2
  premiumTowerDamage: (level) => 1000 * Math.pow(level, 2),
  
  // Szybkość strzału premium: 5.1 - (P × 0.05) (min. 0.1s)
  premiumTowerFireRate: (level) => Math.max(0.1, 5.1 - (level * 0.05)),
  
  // Koszt odblokowania slotu premium: 100 × 2^(S-1)
  premiumSlotUnlockCost: (slotNumber) => 100 * Math.pow(2, slotNumber - 1),
  
  // Koszt budowy wieży premium: 50 × 2^(W-1) kryształy LUB 10000 × 2^(W-1) monet
  premiumTowerBuildCost: (towerNumber, currency = 'crystals') => {
    const multiplier = Math.pow(2, towerNumber - 1);
    return currency === 'crystals' 
      ? 50 * multiplier 
      : 10000 * multiplier;
  },
  
  // === EKONOMIA I BANK ===
  
  // Limit banku: 10000 × U
  bankLimit: (upgradeLevel) => 10000 * upgradeLevel,
  
  // Koszt ulepszenia limitu banku: 10 × U^1.5
  bankLimitUpgradeCost: (upgradeLevel) => Math.floor(10 * Math.pow(upgradeLevel, 1.5)),
  
  // Kwota kredytu ratunkowego: 100 × U
  creditAmount: (upgradeLevel) => 100 * upgradeLevel,
  
  // Koszt ulepszenia kredytu: 5 × U^1.5
  creditUpgradeCost: (upgradeLevel) => Math.floor(5 * Math.pow(upgradeLevel, 1.5)),
  
  // === KOSZT BUDOWY WIEŻY W TRAKCIE MECZU PvE ===
  
  // Koszt wieży: 5 × ⌈Średni poziom ulepszeń⌉ × P
  towerBuildCost: (avgUpgradeLevel, mapLevel) => {
    const roundedAvg = Math.ceil(avgUpgradeLevel);
    return 5 * roundedAvg * mapLevel;
  },
  
  // === WYMAGANY WKŁAD WŁASNY DO STARTU MECZU ===
  
  // Minimum monet: koszt wieży × 2
  minimumActiveCoins: (avgUpgradeLevel, mapLevel) => {
    const towerCost = FORMULAS.towerBuildCost(avgUpgradeLevel, mapLevel);
    return towerCost * 2;
  },
  
  // === POMOCNICZE FUNKCJE ===
  
  // Oblicz średni poziom ulepszeń wieży
  calculateAverageUpgradeLevel: (damageLevel, speedLevel, rangeLevel) => {
    return (damageLevel + speedLevel + rangeLevel) / 3;
  },
  
  // Oblicz ELO po meczu PvP (prosty system)
  calculateELOChange: (playerRating, opponentRating, won, is3v3 = false) => {
    const K = is3v3 ? 20 : 32; // K-factor dla 3v3 jest mniejszy
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    const actualScore = won ? 1 : 0;
    return Math.round(K * (actualScore - expectedScore));
  },
  
  // Oblicz EXP za mecz
  calculateExpGained: (gameMode, result, duration, level) => {
    let baseExp = 0;
    
    if (gameMode === 'PvE') {
      baseExp = result === 'WIN' ? 100 : 20;
    } else if (gameMode === 'PvP_1v1') {
      baseExp = result === 'WIN' ? 80 : 40;
    } else if (gameMode === 'PvP_3v3') {
      baseExp = result === 'WIN' ? 60 : 30;
    }
    
    // Bonus za długość meczu (maksymalnie +50%)
    const durationBonus = Math.min(duration / 1800, 0.5); // 30 minut = 50% bonus
    
    return Math.floor(baseExp * (1 + durationBonus));
  }
};
