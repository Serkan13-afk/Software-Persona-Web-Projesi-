import { useState } from 'react';
import Home from './screens/Home';
import AuthPage from './screens/AuthPage';

function App() {
  const [page, setPage]         = useState('home');   // 'home' | 'auth'
  const [initialTab, setInitialTab] = useState('login'); // 'login' | 'register'

  const goToAuth = (tab) => {
    setInitialTab(tab);
    setPage('auth');
  };

  if (page === 'auth') {
    return <AuthPage initialTab={initialTab} onBack={() => setPage('home')} />;
  }

  return (
    <Home
      onNavigateToLogin={() => goToAuth('login')}
      onNavigateToRegister={() => goToAuth('register')}
    />
  );
}

export default App;

