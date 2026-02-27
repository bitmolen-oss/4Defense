// Główny korzeń Reacta (Routing / Warunkowe renderowanie)
import { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { supabase, SupabaseService } from './services/supabaseClient';
import { eventBus, GAME_EVENTS } from './utils/eventBus';

// Komponenty UI
import Dashboard from './components/Dashboard/Dashboard';
import Auth from './components/Auth/Auth';
import LevelSelect from './components/LevelSelect/LevelSelect';
import Bank from './components/Bank/Bank';
import Shop from './components/Shop/Shop';
import Leaderboard from './components/Leaderboard/Leaderboard';
import Social from './components/Social/Social';
import Profile from './components/Profile/Profile';
import Lobby from './components/Lobby/Lobby';

// Style
import './App.css';

function App() {
  const { gameState, setGameState, setProfile, setWallet, setUpgrades } = useGameStore();

  // Inicjalizacja aplikacji i sprawdzenie stanu logowania
  useEffect(() => {
    const initializeApp = async () => {
      setGameState({ loading: true });

      try {
        // Sprawdź flagę "Zapamiętaj mnie" - jeśli nie jest true, wyloguj
        if (localStorage.getItem('chk_stay_logged_in') !== 'true') {
          await supabase.auth.signOut();
          setGameState({ 
            is_logged_in: false, 
            current_view: 'auth',
            loading: false 
          });
          return;
        }

        // Sprawdź sesję
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn('Błąd sprawdzania sesji:', sessionError);
        }
        
        const session = sessionData?.session;
        
        if (session?.user) {
          // Sesja istnieje - pobierz dane użytkownika
          const user = session.user;
          
          if (user && user.id) {
            // Pobierz dane profilu użytkownika
            const profileResult = await SupabaseService.getUserProfile(user.id);
            const walletResult = await SupabaseService.getUserWallet(user.id);
            const upgradesResult = await SupabaseService.getUserUpgrades(user.id);

            if (profileResult.success && walletResult.success && upgradesResult.success) {
              setProfile(profileResult.data);
              setWallet(walletResult.data);
              setUpgrades(upgradesResult.data);
              setGameState({ 
                is_logged_in: true, 
                current_view: 'dashboard',
                loading: false 
              });
            } else {
              console.warn('Błąd ładowania danych użytkownika, czyszczenie sesji');
              setProfile(null);
              setWallet(null);
              setUpgrades(null);
              setGameState({ 
                is_logged_in: false, 
                current_view: 'auth',
                loading: false 
              });
            }
          } else {
            setGameState({ 
              is_logged_in: false, 
              current_view: 'auth',
              loading: false 
            });
          }
        } else {
          // Brak sesji - pokaż panel logowania
          setGameState({ 
            is_logged_in: false, 
            current_view: 'auth',
            loading: false 
          });
        }
      } catch (error) {
        console.error('Błąd inicjalizacji aplikacji:', error);
        setProfile(null);
        setWallet(null);
        setUpgrades(null);
        setGameState({ 
          is_logged_in: false, 
          current_view: 'auth',
          loading: false 
        });
      }
    };

    initializeApp();

    // Nasłuchuj na zdarzenia z Phasera
    const handleGameEvent = (event) => {
      const { detail } = event;
      
      switch (event.type) {
        case 'game:started':
          setGameState({ in_game: true, game_mode: detail.gameMode });
          break;
        case 'game:ended':
          setGameState({ in_game: false, game_mode: null });
          // Zaktualizuj dane użytkownika po zakończeniu gry
          if (detail.userId) {
            updateUserDataAfterGame(detail.userId);
          }
          break;
        case 'coins:earned':
          // Zaktualizuj portfel o zarobione monety
          useGameStore.getState().updateWallet({
            coins_active: useGameStore.getState().wallet.coins_active + detail.amount
          });
          break;
        default:
          break;
      }
    };

    // Rejestracja event listenerów
    window.addEventListener('multiplayer_game_state', handleGameEvent);
    window.addEventListener('multiplayer_player_action', handleGameEvent);
    
    // Nasłuchuj na zdarzenia z menu Electrona
    if (window.electronAPI) {
      window.electronAPI.onMenuAction((event, action) => {
        switch (action) {
          case 'menu-new-profile':
            setGameState({ current_view: 'profile' });
            break;
          case 'menu-quick-start':
            setGameState({ current_view: 'level_select' });
            break;
          case 'menu-last-level':
            setGameState({ current_view: 'level_select' });
            break;
          case 'menu-save-state':
            // Implementacja zapisu stanu
            eventBus.emitGameEvent(GAME_EVENTS.SAVE_GAME_STATE);
            break;
          case 'menu-preferences':
            setGameState({ current_view: 'profile' });
            break;
          default:
            break;
        }
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener('multiplayer_game_state', handleGameEvent);
      window.removeEventListener('multiplayer_player_action', handleGameEvent);
      if (window.electronAPI) {
        window.electronAPI.removeAllMenuListeners();
      }
    };
  }, []);

  // Funkcja do aktualizacji danych użytkownika po grze
  const updateUserDataAfterGame = async (userId) => {
    try {
      const profileResult = await SupabaseService.getUserProfile(userId);
      const walletResult = await SupabaseService.getUserWallet(userId);
      const upgradesResult = await SupabaseService.getUserUpgrades(userId);

      if (profileResult.success) setProfile(profileResult.data);
      if (walletResult.success) setWallet(walletResult.data);
      if (upgradesResult.success) setUpgrades(upgradesResult.data);
    } catch (error) {
      console.error('Błąd aktualizacji danych po grze:', error);
    }
  };

  // Renderowanie odpowiedniego widoku
  const renderCurrentView = () => {
    if (gameState.loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Ładowanie 4 Defense...</p>
          </div>
        </div>
      );
    }

    if (gameState.error) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
          <div className="text-center bg-slate-900 border border-slate-700 rounded-lg p-8 shadow-lg">
            <h2 className="text-red-500 text-2xl font-bold mb-4">Błąd</h2>
            <p className="text-white mb-4">{gameState.error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold transition-all duration-200 ease-in-out hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0"
            >
              Odśwież
            </button>
          </div>
        </div>
      );
    }

    // Jeśli nie jest zalogowany -> pokaż Auth
    if (!gameState.is_logged_in) {
      return <Auth />;
    }

    // Główny routing aplikacji (użytkownik zalogowany)
    switch (gameState.current_view) {
      case 'dashboard':
        return <Dashboard />;
      case 'level_select':
        return <LevelSelect />;
      case 'bank':
        return <Bank />;
      case 'shop':
        return <Shop />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'social':
        return <Social />;
      case 'profile':
        return <Profile />;
      case 'lobby':
        return <Lobby />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {renderCurrentView()}
    </div>
  );
}

export default App;
