import { useEffect, useState } from 'react';
import './Home.css';

export default function Home({ onCreateProfile }) {
  const [scrolled, setScrolled] = useState(false);

  // Senkronize scroll (navbar arka planı)
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="modern-container">
      {/* Navbar Section */}
      <nav className={`modern-nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-content">
          <div className="nav-logo">
            <span className="logo-icon"></span>
            Randevu<span className="logo-dot">.</span>
          </div>
          <div className="nav-auth">
            <button className="btn-primary" onClick={onCreateProfile}>Profilini Oluştur</button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-bg-glow"></div>
          <div className="hero-content">
            <div className="badge animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              ✨ Yeni Nesil Randevu Asistanı
            </div>
            <h1 className="hero-title animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Zamanınızı <span className="text-gradient">Zekice</span> Yönetin
            </h1>
            <p className="hero-subtitle animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              İşletmeniz için tasarlanmış modern, hızlı ve kusursuz deneyim sunan randevu platformu. Müşterilerinizi bekletmeyin, işinize odaklanın.
            </p>
            <div className="hero-actions animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <button className="btn-primary btn-large" onClick={onCreateProfile}>Profilini Oluştur →</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
