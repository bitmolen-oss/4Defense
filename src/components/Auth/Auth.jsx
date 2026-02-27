// Logowanie i Rejestracja (Supabase)
import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { SupabaseService } from '../../services/supabaseClient';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberCredentials, setRememberCredentials] = useState(false);

  const { setGameState, setProfile, setWallet, setUpgrades } = useGameStore();

  // Wczytaj stane checkboxów i zapisane dane przy starcie
  useEffect(() => {
    const chkRememberData = localStorage.getItem('chk_remember_data') === 'true';
    const chkStayLoggedIn = localStorage.getItem('chk_stay_logged_in') === 'true';
    const savedEmail = localStorage.getItem('saved_email');
    const savedPassword = localStorage.getItem('saved_password');
    
    // Przywróć stany checkboxów
    setRememberCredentials(chkRememberData);
    setRememberMe(chkStayLoggedIn);
    
    // Przywróć dane logowania jeśli zaznaczono
    if (chkRememberData && savedEmail) {
      setEmail(savedEmail);
      if (savedPassword) {
        setPassword(savedPassword);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isLogin) {
        result = await SupabaseService.signIn(email, password);
      } else {
        result = await SupabaseService.signUp(email, password, username);
      }

      if (result.success) {
        // Zapisz stany checkboxów
        localStorage.setItem('chk_remember_data', rememberCredentials.toString());
        localStorage.setItem('chk_stay_logged_in', rememberMe.toString());
        
        // Zarządzaj zapamiętanymi danymi logowania
        if (rememberCredentials) {
          localStorage.setItem('saved_email', email);
          localStorage.setItem('saved_password', password);
        } else {
          localStorage.removeItem('saved_email');
          localStorage.removeItem('saved_password');
        }
        if (!isLogin) {
          setError('Konto utworzone! Sprawdź email w celu aktywacji.');
          setLoading(false);
          return;
        }

        const user = result.data.user;
        
        // Pobierz dane użytkownika
        const profileResult = await SupabaseService.getUserProfile(user.id);
        const walletResult = await SupabaseService.getUserWallet(user.id);
        const upgradesResult = await SupabaseService.getUserUpgrades(user.id);

        if (profileResult.success && walletResult.success && upgradesResult.success) {
          setProfile(profileResult.data);
          setWallet(walletResult.data);
          setUpgrades(upgradesResult.data);
          setGameState({ 
            is_logged_in: true, 
            current_view: 'dashboard' 
          });
        } else {
          throw new Error('Błąd ładowania danych użytkownika');
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-game-background">
      <div className="game-panel w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">4 Defense</h1>
          <p className="text-gray-400">
            {isLogin ? 'Zaloguj się do swojego konta' : 'Utwórz nowe konto'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-500/20 border border-error-500/50 rounded-md">
            <p className="text-error-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                Nazwa użytkownika
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-game-grid border border-game-grid-lines rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Wpisz nazwę użytkownika"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-game-grid border border-game-grid-lines rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Wpisz email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Hasło
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-game-grid border border-game-grid-lines rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Wpisz hasło"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full game-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Ładowanie...' : (isLogin ? 'Zaloguj się' : 'Zarejestruj się')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setUsername('');
              if (!rememberCredentials) {
                setEmail('');
                setPassword('');
              }
            }}
            className="text-primary-400 hover:text-primary-300 text-sm"
          >
            {isLogin 
              ? 'Nie masz konta? Zarejestruj się' 
              : 'Masz już konto? Zaloguj się'
            }
          </button>
        </div>

        {/* Checkboxy opcji */}
        <div className="mt-4 space-y-2">
          <label className="flex items-center text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mr-2 rounded border-gray-600 bg-gray-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
            />
            Zapamiętaj mnie (pozostań zalogowanym)
          </label>
          
          <label className="flex items-center text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberCredentials}
              onChange={(e) => setRememberCredentials(e.target.checked)}
              className="mr-2 rounded border-gray-600 bg-gray-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
            />
            Zapamiętaj dane logowania
          </label>
        </div>
      </div>
    </div>
  );
};

export default Auth;
