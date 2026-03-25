import { useEffect, useState } from 'react';
import './Home.css';

export default function Home() {
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
          <div className="nav-links">
            <a href="#features">Özellikler</a>
            <a href="#how-it-works">Çözümler</a>
            <a href="#pricing">Fiyatlandırma</a>
          </div>
          <div className="nav-auth">
            <button className="btn-ghost">Giriş Yap</button>
            <button className="btn-primary">Kayıt Ol</button>
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
              <button className="btn-primary btn-large">Hemen Ücretsiz Başla</button>
              <button className="btn-secondary btn-large">Demo İncele</button>
            </div>
          </div>
          
          <div className="hero-visual animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="mockup-window">
              <div className="mockup-header">
                <span className="dot close"></span>
                <span className="dot min"></span>
                <span className="dot max"></span>
              </div>
              <div className="mockup-body">
                <div className="mockup-sidebar">
                  <div className="sim-line w-full"></div>
                  <div className="sim-line w-half"></div>
                  <div className="sim-line w-full mt-auto"></div>
                </div>
                <div className="mockup-content">
                  <div className="mockup-topbar">
                    <div className="sim-circle"></div>
                  </div>
                  <div className="mockup-cards">
                    <div className="sim-card"></div>
                    <div className="sim-card"></div>
                    <div className="sim-card"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features-section">
          <div className="section-header">
            <h2>Neden Biz?</h2>
            <p>Modern işletmelerin tüm ihtiyaçları tek bir platformda.</p>
          </div>
          
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon icon-speed">⚡</div>
              <h3>Işık Hızında</h3>
              <p>Performans odaklı altyapımız ile randevularınızı sıfır gecikme ile oluşturun ve yönetin.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon icon-security">🔒</div>
              <h3>Üst Düzey Güvenlik</h3>
              <p>Müşteri datasını uçtan uca şifreliyoruz. Kimse verilerinize sizin dışınızda erişemez.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon icon-mobile">📱</div>
              <h3>Mobil Uyumlu</h3>
              <p>İster masaüstü bilgisayardan ister yoldayken telefondan her cihaza kusursuz uyum sağlar.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="modern-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="nav-logo">
              Randevu<span className="logo-dot">.</span>
            </div>
            <p className="brand-desc">İşini büyütmek isteyen modern işletmelerin akıllı asistanı.</p>
          </div>
          <div className="footer-links-container">
            <div className="footer-col">
              <h4>Ürün</h4>
              <a href="#">Özellikler</a>
              <a href="#">Entegrasyonlar</a>
              <a href="#">Fiyatlandırma</a>
            </div>
            <div className="footer-col">
              <h4>Destek</h4>
              <a href="#">Yardım Merkezi</a>
              <a href="#">İletişim</a>
              <a href="#">Sistem Durumu</a>
            </div>
            <div className="footer-col">
              <h4>Yasal</h4>
              <a href="#">Gizlilik Politikası</a>
              <a href="#">Kullanım Şartları</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Randevu Yönetimi. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
