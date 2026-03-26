import { useState } from 'react';
import './ProfileWizard.css';

const STEPS = [
  { id: 1, eyebrow: 'Adım 1 / 3', title: 'Adın ne?', sub: 'Sana nasıl hitap edelim?' },
  { id: 2, eyebrow: 'Adım 2 / 3', title: 'Soyadın ne?', sub: 'Profilini tamamlamak için devam et.' },
  { id: 3, eyebrow: 'Adım 3 / 3', title: 'Cinsiyetin?', sub: 'İstersen "Belirtmek istemiyorum" seçebilirsin.' },
];

const GENDER_OPTIONS = [
  { value: 'male',   label: 'Erkek',   emoji: '👨' },
  { value: 'female', label: 'Kadın',   emoji: '👩' },
  { value: 'other',  label: 'Belirtmek istemiyorum', emoji: '🙂', full: true },
];

export default function ProfileWizard({ onComplete }) {
  const [step, setStep]       = useState(0); // 0-indexed
  const [profile, setProfile] = useState({ firstName: '', lastName: '', gender: '' });
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  const current = STEPS[step];

  const handleNext = () => {
    setError('');

    if (step === 0) {
      if (!profile.firstName.trim()) { setError('Lütfen adını gir.'); return; }
    }
    if (step === 1) {
      if (!profile.lastName.trim()) { setError('Lütfen soyadını gir.'); return; }
    }
    if (step === 2) {
      if (!profile.gender) { setError('Lütfen bir seçenek belirle.'); return; }
      // Save & complete
      localStorage.setItem('userProfile', JSON.stringify(profile));
      setDone(true);
      setTimeout(() => onComplete(profile), 1200);
      return;
    }

    setStep(s => s + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(s => s - 1);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleNext();
  };

  if (done) {
    return (
      <div className="wizard-overlay">
        <div className="wizard-card">
          <div className="wizard-success">
            <div className="wizard-success-icon">✓</div>
            <h2>Harika, {profile.firstName}!</h2>
            <p>Profil oluşturuldu. Randevu ekranına yönlendiriliyorsunuz…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wizard-overlay">
      <div className="wizard-card">
        {/* Brand */}
        <div className="wizard-brand">
          Randevu<span className="wizard-brand-dot">.</span>
        </div>

        {/* Step indicator */}
        <div className="wizard-steps">
          {STEPS.map((s, i) => (
            <>
              <div
                key={s.id}
                className={`wizard-step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}
              >
                {i < step ? '✓' : i + 1}
            </div>
              {i < STEPS.length - 1 && (
                <div key={`line-${i}`} className={`wizard-step-line ${i < step ? 'done' : ''}`} />
              )}
            </>
          ))}
        </div>

        {/* Header */}
        <div className="wizard-header">
          <div className="wizard-eyebrow">{current.eyebrow}</div>
          <h1 className="wizard-title">{current.title}</h1>
          <p className="wizard-sub">{current.sub}</p>
        </div>

        {/* Step content */}
        <div className="wizard-step-content" key={step}>
          {step === 0 && (
            <div className="wizard-input-wrap">
              <input
                id="wizard-firstname"
                className={`wizard-input ${error ? 'error' : ''}`}
                type="text"
                placeholder="Ahmet"
                autoFocus
                value={profile.firstName}
                onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
                onKeyDown={handleKey}
              />
              {error && <span className="wizard-error">{error}</span>}
            </div>
          )}

          {step === 1 && (
            <div className="wizard-input-wrap">
              <input
                id="wizard-lastname"
                className={`wizard-input ${error ? 'error' : ''}`}
                type="text"
                placeholder="Yılmaz"
                autoFocus
                value={profile.lastName}
                onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
                onKeyDown={handleKey}
              />
              {error && <span className="wizard-error">{error}</span>}
            </div>
          )}

          {step === 2 && (
            <>
              <div className="gender-options">
                {GENDER_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`gender-option ${opt.full ? 'gender-option-full' : ''} ${profile.gender === opt.value ? 'selected' : ''}`}
                    onClick={() => { setProfile(p => ({ ...p, gender: opt.value })); setError(''); }}
                  >
                    <span className="gender-emoji">{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
              {error && <span className="wizard-error">{error}</span>}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="wizard-actions">
          {step > 0 && (
            <button className="wizard-btn-back" type="button" onClick={handleBack}>
              ← Geri
            </button>
          )}
          <button className="wizard-btn-next" type="button" onClick={handleNext}>
            {step === STEPS.length - 1 ? 'Tamamla ✓' : 'İleri →'}
          </button>
        </div>
      </div>
    </div>
  );
}
