// Główny panel i statystyki
import { useGameStore } from '../../store/useGameStore';
import { SupabaseService } from '../../services/supabaseClient';

const Dashboard = () => {
  const { profile, wallet, upgrades, setGameState, setProfile, setWallet, setUpgrades } = useGameStore();

  const handleLogout = async () => {
    try {
      const result = await SupabaseService.signOut();
      if (result.success) {
        // Wyczyść stan aplikacji
        setProfile(null);
        setWallet(null);
        setUpgrades(null);
        
        // NIE czyść preferencji checkboxów ani zapisanych danych logowania
        // Użytkownik chce zachować swoje ustawienia
        
        setGameState({ 
          is_logged_in: false, 
          current_view: 'auth',
          loading: false 
        });
      } else {
        console.error('Błąd wylogowania:', result.error);
      }
    } catch (error) {
      console.error('Błąd wylogowania:', error);
    }
  };

  const handleLaunchGame = () => {
    if (window.electronAPI && window.electronAPI.launchGame) {
      window.electronAPI.launchGame();
    } else {
      console.error('electronAPI.launchGame nie jest dostępny');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Witaj, {profile.username || 'Gracz'}!
        </h1>
        <p className="text-gray-400">
          Poziom {profile.player_level} • {profile.exp_points} EXP
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Portfel */}
        <div className="game-panel">
          <h3 className="text-lg font-semibold mb-2 text-primary-400">Portfel</h3>
          <div className="space-y-2">
            <div>
              <span className="text-gray-400">Monety:</span>
              <span className="ml-2 text-white font-bold">{wallet.coins_active.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-400">Bank:</span>
              <span className="ml-2 text-white font-bold">{wallet.bank_balance.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-400">Kryształy:</span>
              <span className="ml-2 text-accent-400 font-bold">{wallet.crystals.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Statystyki obrony */}
        <div className="game-panel">
          <h3 className="text-lg font-semibold mb-2 text-primary-400">Obrona</h3>
          <div className="space-y-2">
            <div>
              <span className="text-gray-400">Bramy:</span>
              <span className="ml-2 text-white font-bold">{upgrades.gates_owned}</span>
            </div>
            <div>
              <span className="text-gray-400">HP Twierdzy:</span>
              <span className="ml-2 text-white font-bold">
                {100 * Math.pow(upgrades.fortress_hp_lvl, 2).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Wieże Premium:</span>
              <span className="ml-2 text-accent-400 font-bold">{upgrades.premium_tower_slots}/8</span>
            </div>
          </div>
        </div>

        {/* Ulepszenia wież */}
        <div className="game-panel">
          <h3 className="text-lg font-semibold mb-2 text-primary-400">Wieże</h3>
          <div className="space-y-2">
            <div>
              <span className="text-gray-400">Siła:</span>
              <span className="ml-2 text-white font-bold">Lv. {upgrades.tower_damage_lvl}</span>
            </div>
            <div>
              <span className="text-gray-400">Szybkość:</span>
              <span className="ml-2 text-white font-bold">Lv. {upgrades.tower_speed_lvl}</span>
            </div>
            <div>
              <span className="text-gray-400">Zasięg:</span>
              <span className="ml-2 text-white font-bold">Lv. {upgrades.tower_range_lvl}</span>
            </div>
          </div>
        </div>

        {/* Postęp PvP */}
        <div className="game-panel">
          <h3 className="text-lg font-semibold mb-2 text-primary-400">PvP</h3>
          <div className="space-y-2">
            <div>
              <span className="text-gray-400">ELO:</span>
              <span className="ml-2 text-white font-bold">{profile.pvp_rating}</span>
            </div>
            <div>
              <span className="text-gray-400">Wygrane:</span>
              <span className="ml-2 text-success-400 font-bold">{profile.pvp_wins}</span>
            </div>
            <div>
              <span className="text-gray-400">Przegrane:</span>
              <span className="ml-2 text-error-400 font-bold">{profile.pvp_losses}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Szybkie akcje */}
      <div className="flex flex-wrap gap-4 mb-4">
        <button className="game-button" onClick={handleLaunchGame}>
          Rozpocznij grę
        </button>
        <button className="game-button">
          Sklep
        </button>
        <button className="game-button">
          Bank
        </button>
        <button className="game-button" disabled={profile.player_level < 10}>
          PvP {profile.player_level < 10 && '(Lv. 10)'}
        </button>
        <button 
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold transition-all duration-200 ease-in-out hover:-translate-y-0.5 active:translate-y-0"
        >
          WYLOGUJ
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
