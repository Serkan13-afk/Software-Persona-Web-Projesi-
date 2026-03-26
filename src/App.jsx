import { useState, useEffect } from 'react';
import Home from './screens/Home';
import ProfileWizard from './screens/ProfileWizard';
import AppointmentDashboard from './screens/AppointmentDashboard';

function App() {
  // 'home' | 'wizard' | 'dashboard'
  const [page, setPage]       = useState('home');
  const [profile, setProfile] = useState(null);
  const [showWizard, setShowWizard] = useState(false);

  // On mount: check localStorage for saved profile
  useEffect(() => {
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
        setPage('dashboard');
      } catch {
        localStorage.removeItem('userProfile');
      }
    }
  }, []);

  const handleWizardComplete = (newProfile) => {
    setProfile(newProfile);
    setShowWizard(false);
    setPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('userProfile');
    setProfile(null);
    setPage('home');
    setShowWizard(false);
  };

  if (page === 'dashboard' && profile) {
    return <AppointmentDashboard profile={profile} onLogout={handleLogout} />;
  }

  return (
    <>
      <Home onCreateProfile={() => setShowWizard(true)} />
      {showWizard && (
        <ProfileWizard onComplete={handleWizardComplete} />
      )}
    </>
  );
}

export default App;
