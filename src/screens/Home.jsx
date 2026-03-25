import './Home.css'

export default function Home() {
  return (
    <div className="home-container">
      <header className="home-header">
        <div className="auth-buttons">
          <button className="btn-login">GİRİŞ</button>
          <button className="btn-register">KAYIT</button>
        </div>
      </header>
      
      <main className="home-main">
        <div className="content-tension">
          <h1 className="manifesto-title">
            <span className="line-1">RANDEVU</span>
            <span className="line-2">YÖNETİMİ.</span>
            <span className="line-3">YENİDEN.</span>
          </h1>
          <p className="manifesto-text">
            Karmaşık tasarımlara, gereksiz menülere son. Sadece en çok ihtiyaç duyduğunuz işlevleri sunan keskin, hızlı ve profesyonel randevu takip sistemi. Modern SaaS klişelerinden sıyrılın. Zamanı net kontrol edin.
          </p>
        </div>
      </main>

      <div className="noise-overlay"></div>
    </div>
  )
}
