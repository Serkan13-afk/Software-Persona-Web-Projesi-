import { useState, useCallback } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../backend/firebase';
import './Auth.css';

// ── Firebase hata kodları → Türkçe mesaj ──────────────────────────────────────
function firebaseError(code) {
  const map = {
    'auth/user-not-found':       'Bu e-posta ile kayıtlı hesap bulunamadı.',
    'auth/wrong-password':       'Şifre yanlış. Lütfen tekrar deneyin.',
    'auth/invalid-credential':   'E-posta veya şifre hatalı.',
    'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanılıyor.',
    'auth/weak-password':        'Şifre en az 6 karakter olmalı.',
    'auth/invalid-email':        'Geçerli bir e-posta adresi girin.',
    'auth/too-many-requests':    'Çok fazla deneme. Lütfen biraz bekleyin.',
    'auth/network-request-failed': 'İnternet bağlantınızı kontrol edin.',
  };
  return map[code] ?? 'Bir hata oluştu. Lütfen tekrar deneyin.';
}

// ── helpers ───────────────────────────────────────────────────────────────────
function calcPasswordStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-4
}

const STRENGTH_LABELS = ['', 'Zayıf', 'Orta', 'İyi', 'Güçlü'];
const STRENGTH_KEYS   = ['', 'weak', 'fair', 'good', 'strong'];

// ── Left decorative panel ─────────────────────────────────────────────────────
function AuthLeft() {
  return (
    <aside className="auth-left" aria-hidden="true">
      <div className="auth-left-logo">
        <span className="auth-brand-name">
          Randevu<span className="auth-brand-dot">.</span>
        </span>
        <span className="auth-brand-tag">Yönetim Sistemi</span>
      </div>

      <div className="auth-left-visual">
        <h2 className="auth-left-headline">
          İşinizi<br />
          <em>Akıllıca</em><br />
          Yönetin.
        </h2>
        <div className="auth-left-divider" />
        <p className="auth-left-quote">
          Modern işletmelerin ihtiyaç duyduğu tek platformda buluşun. Zaman israfına son.
        </p>
      </div>

      <div className="auth-stats">
        <div className="auth-stat-item">
          <span className="auth-stat-number">12K+</span>
          <span className="auth-stat-label">Aktif İşletme</span>
        </div>
        <div className="auth-stat-item">
          <span className="auth-stat-number">99.9%</span>
          <span className="auth-stat-label">Çalışma Süresi</span>
        </div>
        <div className="auth-stat-item">
          <span className="auth-stat-number">4.9★</span>
          <span className="auth-stat-label">Kullanıcı Puanı</span>
        </div>
      </div>
    </aside>
  );
}

// ── Icon components ───────────────────────────────────────────────────────────
const IconMail = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" width="15" height="15">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const IconLock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" width="15" height="15">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" width="15" height="15">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const IconPhone = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" width="15" height="15">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

const IconBuilding = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" width="15" height="15">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
);

// ── Google / GitHub SVG icons ─────────────────────────────────────────────────
const IconGoogle = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const IconGithub = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

// ── Password Strength Indicator ───────────────────────────────────────────────
function PasswordStrength({ password }) {
  const score = calcPasswordStrength(password);
  if (!password) return null;

  return (
    <div className="pw-strength">
      <div className="pw-strength-bars">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`pw-bar ${i <= score ? `filled-${STRENGTH_KEYS[score]}` : ''}`}
          />
        ))}
      </div>
      <span className="pw-strength-label">{STRENGTH_LABELS[score]}</span>
    </div>
  );
}

// ── Login Form ────────────────────────────────────────────────────────────────
function LoginForm({ onSwitch }) {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [errors, setErrors]   = useState({});
  const [showPw, setShowPw]   = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = useCallback(() => {
    const e = {};
    if (!form.email.trim())                           e.email    = 'E-posta zorunludur.';
    else if (!/\S+@\S+\.\S+/.test(form.email))       e.email    = 'Geçerli bir e-posta girin.';
    if (!form.password)                               e.password = 'Şifre zorunludur.';
    else if (form.password.length < 6)               e.password = 'En az 6 karakter olmalı.';
    return e;
  }, [form]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (!auth) { setErrors({ firebase: 'Giriş servisi şu an kullanılamıyor.' }); return; }
    setErrors({});
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      setSuccess(true);
    } catch (err) {
      setErrors({ firebase: firebaseError(err.code) });
    } finally {
      setLoading(false);
    }
  }, [validate, form]);

  if (success) {
    return (
      <div className="auth-success-overlay">
        <div className="success-icon">✓</div>
        <h3 className="success-title">Hoş Geldiniz!</h3>
        <p className="success-msg">Başarıyla giriş yaptınız.<br />Yönlendiriliyorsunuz…</p>
      </div>
    );
  }

  return (
    <form id="login-form" className="auth-form" onSubmit={handleSubmit} noValidate>
      {/* Email */}
      <div className="field-group">
        <label className="field-label" htmlFor="login-email">E-Posta</label>
        <div className="field-input-wrap">
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            className={`field-input ${errors.email ? 'error' : ''}`}
            placeholder="ornek@sirket.com"
            value={form.email}
            onChange={ev => setForm(p => ({ ...p, email: ev.target.value }))}
          />
          <span className="field-icon"><IconMail /></span>
        </div>
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>

      {/* Password */}
      <div className="field-group">
        <label className="field-label" htmlFor="login-password">Şifre</label>
        <div className="field-input-wrap">
          <input
            id="login-password"
            type={showPw ? 'text' : 'password'}
            autoComplete="current-password"
            className={`field-input ${errors.password ? 'error' : ''}`}
            placeholder="••••••••"
            value={form.password}
            onChange={ev => setForm(p => ({ ...p, password: ev.target.value }))}
          />
          <span className="field-icon"><IconLock /></span>
          <button
            type="button"
            className="field-toggle"
            aria-label={showPw ? 'Şifreyi gizle' : 'Şifreyi göster'}
            onClick={() => setShowPw(p => !p)}
          >
            {showPw ? '🙈' : '👁'}
          </button>
        </div>
        {errors.password && <span className="field-error">{errors.password}</span>}
      </div>

      {/* Options */}
      <div className="auth-options">
        <label className="checkbox-group">
          <input
            type="checkbox"
            checked={remember}
            onChange={ev => setRemember(ev.target.checked)}
          />
          <span className="checkbox-label">Beni hatırla</span>
        </label>
        <a href="#" className="auth-forgot">Şifremi unuttum</a>
      </div>

      {/* Firebase genel hata */}
      {errors.firebase && (
        <div className="field-error" style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px', marginTop: '-4px' }}>
          {errors.firebase}
        </div>
      )}

      {/* Submit */}

      <button id="login-submit" type="submit" className="btn-auth-submit" disabled={loading}>
        <span>{loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}</span>
        {!loading && <span className="btn-arrow">→</span>}
      </button>

      {/* Social */}
      <div className="auth-divider">
        <div className="auth-divider-line" />
        <span className="auth-divider-text">ya da</span>
        <div className="auth-divider-line" />
      </div>
      <div className="auth-socials">
        <button type="button" className="btn-social" id="login-google">
          <IconGoogle />Google
        </button>
        <button type="button" className="btn-social" id="login-github">
          <IconGithub />GitHub
        </button>
      </div>

      {/* Switch */}
      <div className="auth-switch">
        Hesabın yok mu?{' '}
        <button type="button" className="auth-switch-link" onClick={onSwitch}>
          Kayıt Ol
        </button>
      </div>
    </form>
  );
}

// ── Register Form ─────────────────────────────────────────────────────────────
function RegisterForm({ onSwitch }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', company: '',
    phone: '', email: '', password: '', confirmPw: '',
  });
  const [errors, setErrors]   = useState({});
  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = useCallback(() => {
    const e = {};
    if (!form.firstName.trim())                          e.firstName  = 'Ad zorunludur.';
    if (!form.lastName.trim())                           e.lastName   = 'Soyad zorunludur.';
    if (!form.email.trim())                              e.email      = 'E-posta zorunludur.';
    else if (!/\S+@\S+\.\S+/.test(form.email))          e.email      = 'Geçerli bir e-posta girin.';
    if (!form.password)                                  e.password   = 'Şifre zorunludur.';
    else if (form.password.length < 8)                  e.password   = 'En az 8 karakter olmalı.';
    if (form.confirmPw !== form.password)                e.confirmPw  = 'Şifreler eşleşmiyor.';
    if (!agreeTerms)                                     e.terms      = 'Şartları kabul etmelisiniz.';
    return e;
  }, [form, agreeTerms]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (!auth) { setErrors({ firebase: 'Kayıt servisi şu an kullanılamıyor.' }); return; }
    setErrors({});
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, form.email, form.password);
      setSuccess(true);
    } catch (err) {
      setErrors({ firebase: firebaseError(err.code) });
    } finally {
      setLoading(false);
    }
  }, [validate, form]);

  if (success) {
    return (
      <div className="auth-success-overlay">
        <div className="success-icon">✓</div>
        <h3 className="success-title">Hesap Oluşturuldu!</h3>
        <p className="success-msg">Hoş geldiniz, {form.firstName}!<br />Onay e-postanızı kontrol edin.</p>
      </div>
    );
  }

  return (
    <form id="register-form" className="auth-form" onSubmit={handleSubmit} noValidate>
      {/* Name row */}
      <div className="form-row">
        <div className="field-group">
          <label className="field-label" htmlFor="reg-fname">Ad</label>
          <div className="field-input-wrap">
            <input
              id="reg-fname"
              type="text"
              autoComplete="given-name"
              className={`field-input ${errors.firstName ? 'error' : ''}`}
              placeholder="Ahmet"
              value={form.firstName}
              onChange={ev => setForm(p => ({ ...p, firstName: ev.target.value }))}
            />
            <span className="field-icon"><IconUser /></span>
          </div>
          {errors.firstName && <span className="field-error">{errors.firstName}</span>}
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="reg-lname">Soyad</label>
          <div className="field-input-wrap">
            <input
              id="reg-lname"
              type="text"
              autoComplete="family-name"
              className={`field-input ${errors.lastName ? 'error' : ''}`}
              placeholder="Yılmaz"
              value={form.lastName}
              onChange={ev => setForm(p => ({ ...p, lastName: ev.target.value }))}
            />
            <span className="field-icon"><IconUser /></span>
          </div>
          {errors.lastName && <span className="field-error">{errors.lastName}</span>}
        </div>
      </div>

      {/* Company + Phone row */}
      <div className="form-row">
        <div className="field-group">
          <label className="field-label" htmlFor="reg-company">İşletme Adı</label>
          <div className="field-input-wrap">
            <input
              id="reg-company"
              type="text"
              autoComplete="organization"
              className="field-input"
              placeholder="Şirket Ltd."
              value={form.company}
              onChange={ev => setForm(p => ({ ...p, company: ev.target.value }))}
            />
            <span className="field-icon"><IconBuilding /></span>
          </div>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="reg-phone">Telefon</label>
          <div className="field-input-wrap">
            <input
              id="reg-phone"
              type="tel"
              autoComplete="tel"
              className="field-input"
              placeholder="+90 5XX XXX XX XX"
              value={form.phone}
              onChange={ev => setForm(p => ({ ...p, phone: ev.target.value }))}
            />
            <span className="field-icon"><IconPhone /></span>
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="field-group">
        <label className="field-label" htmlFor="reg-email">E-Posta</label>
        <div className="field-input-wrap">
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            className={`field-input ${errors.email ? 'error' : ''}`}
            placeholder="ornek@sirket.com"
            value={form.email}
            onChange={ev => setForm(p => ({ ...p, email: ev.target.value }))}
          />
          <span className="field-icon"><IconMail /></span>
        </div>
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>

      {/* Password */}
      <div className="field-group">
        <label className="field-label" htmlFor="reg-password">Şifre</label>
        <div className="field-input-wrap">
          <input
            id="reg-password"
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            className={`field-input ${errors.password ? 'error' : ''}`}
            placeholder="En az 8 karakter"
            value={form.password}
            onChange={ev => setForm(p => ({ ...p, password: ev.target.value }))}
          />
          <span className="field-icon"><IconLock /></span>
          <button
            type="button"
            className="field-toggle"
            aria-label={showPw ? 'Şifreyi gizle' : 'Şifreyi göster'}
            onClick={() => setShowPw(p => !p)}
          >
            {showPw ? '🙈' : '👁'}
          </button>
        </div>
        <PasswordStrength password={form.password} />
        {errors.password && <span className="field-error">{errors.password}</span>}
      </div>

      {/* Confirm Password */}
      <div className="field-group">
        <label className="field-label" htmlFor="reg-confirm">Şifre Tekrar</label>
        <div className="field-input-wrap">
          <input
            id="reg-confirm"
            type={showCpw ? 'text' : 'password'}
            autoComplete="new-password"
            className={`field-input ${errors.confirmPw ? 'error' : ''}`}
            placeholder="••••••••"
            value={form.confirmPw}
            onChange={ev => setForm(p => ({ ...p, confirmPw: ev.target.value }))}
          />
          <span className="field-icon"><IconLock /></span>
          <button
            type="button"
            className="field-toggle"
            aria-label={showCpw ? 'Şifreyi gizle' : 'Şifreyi göster'}
            onClick={() => setShowCpw(p => !p)}
          >
            {showCpw ? '🙈' : '👁'}
          </button>
        </div>
        {errors.confirmPw && <span className="field-error">{errors.confirmPw}</span>}
      </div>

      {/* Terms */}
      <div className="field-group">
        <label className="checkbox-group">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={ev => setAgreeTerms(ev.target.checked)}
          />
          <span className="checkbox-label">
            <a href="#" className="auth-forgot">Kullanım Şartları</a>
            {' '}ve{' '}
            <a href="#" className="auth-forgot">Gizlilik Politikası</a>
            'nı okudum, kabul ediyorum.
          </span>
        </label>
        {errors.terms && <span className="field-error">{errors.terms}</span>}
      </div>

      {/* Firebase genel hata */}
      {errors.firebase && (
        <div className="field-error" style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px', marginTop: '-4px' }}>
          {errors.firebase}
        </div>
      )}

      {/* Submit */}

      <button id="register-submit" type="submit" className="btn-auth-submit" disabled={loading}>
        <span>{loading ? 'Hesap oluşturuluyor…' : 'Hesap Oluştur'}</span>
        {!loading && <span className="btn-arrow">→</span>}
      </button>

      {/* Social */}
      <div className="auth-divider">
        <div className="auth-divider-line" />
        <span className="auth-divider-text">ya da hızlı kayıt</span>
        <div className="auth-divider-line" />
      </div>
      <div className="auth-socials">
        <button type="button" className="btn-social" id="reg-google">
          <IconGoogle />Google
        </button>
        <button type="button" className="btn-social" id="reg-github">
          <IconGithub />GitHub
        </button>
      </div>

      {/* Switch */}
      <div className="auth-switch">
        Zaten hesabın var mı?{' '}
        <button type="button" className="auth-switch-link" onClick={onSwitch}>
          Giriş Yap
        </button>
      </div>
    </form>
  );
}

// ── Main AuthPage component ───────────────────────────────────────────────────
export default function AuthPage({ initialTab = 'login', onBack = () => {} }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'login' | 'register'


  return (
    <div className="auth-wrapper">
      <AuthLeft />

      <section className="auth-right" role="main">
        <div className="auth-form-container">
          {/* Header */}
          <div className="auth-form-header">
            <button
              type="button"
              onClick={onBack}
              className="auth-back-btn"
              aria-label="Ana sayfaya dön"
            >
              ← Ana Sayfa
            </button>
            <div className="auth-form-eyebrow">
              {activeTab === 'login' ? 'Hesaba Giriş' : 'Yeni Hesap'}
            </div>
            <h1 className="auth-form-title">
              {activeTab === 'login' ? 'Tekrar\nHoş Geldiniz' : 'Hemen\nBaşlayın'}
            </h1>
            <p className="auth-form-subtitle">
              {activeTab === 'login'
                ? 'Randevu yönetiminize güvenle devam edin.'
                : '14 gün ücretsiz deneyin. Kredi kartı gerekmez.'}
            </p>
          </div>


          {/* Tab switcher */}
          <div className="auth-tabs" role="tablist" aria-label="Hesap işlemleri">
            <button
              role="tab"
              aria-selected={activeTab === 'login'}
              className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
              id="tab-login"
              onClick={() => setActiveTab('login')}
            >
              Giriş Yap
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'register'}
              className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
              id="tab-register"
              onClick={() => setActiveTab('register')}
            >
              Kayıt Ol
            </button>
          </div>

          {/* Form */}
          {activeTab === 'login'
            ? <LoginForm    onSwitch={() => setActiveTab('register')} />
            : <RegisterForm onSwitch={() => setActiveTab('login')} />
          }
        </div>
      </section>
    </div>
  );
}
