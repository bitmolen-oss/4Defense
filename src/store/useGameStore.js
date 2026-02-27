// Zarządzanie stanem gry za pomocą Zustand
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Stan początkowy gracza
const initialState = {
  // Dane profilu
  profile: {
    id: null,
    username: '',
    avatar_url: 'default_avatar.png',
    player_level: 1,
    exp_points: 0,
    pvp_wins: 0,
    pvp_losses: 0,
    pvp_rating: 1000,
  },
  
  // Portfel i ekonomia
  wallet: {
    coins_active: 0,
    bank_balance: 0,
    bank_limit: 10000,
    crystals: 0,
    last_credit_claim: null,
  },
  
  // Ulepszenia i postęp
  upgrades: {
    tower_damage_lvl: 1,
    tower_speed_lvl: 1,
    tower_range_lvl: 1,
    fortress_hp_lvl: 1,
    gates_owned: 1,
    gate_1_hp_lvl: 1,
    gate_2_hp_lvl: 1,
    gate_3_hp_lvl: 1,
    gate_4_hp_lvl: 1,
    premium_tower_slots: 0,
    bank_limit_lvl: 1,
    credit_amount_lvl: 1,
    highest_unlocked_level: 1,
  },
  
  // Stan gry
  gameState: {
    is_logged_in: false,
    current_view: 'dashboard', // dashboard, level_select, bank, shop, leaderboard, social, profile, lobby
    game_mode: null, // PvE, PvP_1v1, PvP_3v3
    in_game: false,
    loading: false,
    error: null,
  },
  
  // Stan PvP
  pvpState: {
    in_lobby: false,
    lobby_id: null,
    team_members: [],
    opponent_team: [],
    match_found: false,
    countdown_active: false,
  },
};

export const useGameStore = create(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Akcje profilu
      setProfile: (profile) => set({ profile }),
      updateProfile: (updates) => set((state) => ({
        profile: { ...state.profile, ...updates }
      })),
      
      // Akcje portfela
      setWallet: (wallet) => set({ wallet }),
      updateWallet: (updates) => set((state) => ({
        wallet: { ...state.wallet, ...updates }
      })),
      
      // Akcje ulepszeń
      setUpgrades: (upgrades) => set({ upgrades }),
      updateUpgrades: (updates) => set((state) => ({
        upgrades: { ...state.upgrades, ...updates }
      })),
      
      // Akcje stanu gry
      setGameState: (updates) => set((state) => ({
        gameState: { ...state.gameState, ...updates }
      })),
      
      setLoading: (loading) => set((state) => ({
        gameState: { ...state.gameState, loading }
      })),
      
      setError: (error) => set((state) => ({
        gameState: { ...state.gameState, error }
      })),
      
      clearError: () => set((state) => ({
        gameState: { ...state.gameState, error: null }
      })),
      
      // Akcje PvP
      setPvpState: (updates) => set((state) => ({
        pvpState: { ...state.pvpState, ...updates }
      })),
      
      // Reset stanu
      resetStore: () => set(initialState),
      
      // Gettery pomocnicze
      getTotalCoins: () => {
        const { wallet } = get();
        return wallet.coins_active + wallet.bank_balance;
      },
      
      canAffordUpgrade: (cost, currency = 'coins') => {
        const { wallet } = get();
        if (currency === 'coins') {
          return wallet.coins_active >= cost;
        } else if (currency === 'crystals') {
          return wallet.crystals >= cost;
        }
        return false;
      },
      
      getAverageTowerLevel: () => {
        const { upgrades } = get();
        return (upgrades.tower_damage_lvl + upgrades.tower_speed_lvl + upgrades.tower_range_lvl) / 3;
      },
      
      isLevelUnlocked: (level) => {
        const { upgrades } = get();
        return upgrades.highest_unlocked_level >= level;
      },
      
      canStartLevel: (level) => {
        const { upgrades, wallet } = get();
        
        // Sprawdź czy poziom jest odblokowany
        if (!get().isLevelUnlocked(level)) return false;
        
        // Sprawdź wymagania dotyczące bram
        const requiredGates = Math.ceil(level / 25);
        if (upgrades.gates_owned < requiredGates) return false;
        
        // Sprawdź minimalny wkład własny
        const avgLevel = get().getAverageTowerLevel();
        const minCoins = Math.ceil(5 * avgLevel * level * 2); // uproszczony wzór
        return wallet.coins_active >= minCoins;
      },
    }),
    {
      name: '4d-game-store',
    }
  )
);
