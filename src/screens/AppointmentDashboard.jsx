import { useState, useEffect, useCallback, useRef } from 'react';
import './AppointmentDashboard.css';

// ── Storage key ───────────────────────────────────────────────────────────────
const APPTS_KEY = 'appointments_v1';

// ── Categories (genel amaçlı!) ────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'health',   label: '🏥 Sağlık',         color: '#6ee7b7' },
  { value: 'social',   label: '❤️ Buluşma',         color: '#f472b6' },
  { value: 'work',     label: '💼 İş / Toplantı',   color: '#60a5fa' },
  { value: 'personal', label: '🌟 Kişisel',         color: '#fbbf24' },
  { value: 'other',    label: '📌 Diğer',            color: '#a78bfa' },
];

const STATUS_MAP = {
  upcoming: { label: 'Yaklaşan',    className: 'badge-upcoming' },
  today:    { label: 'Bugün',       className: 'badge-today' },
  done:     { label: 'Tamamlandı',  className: 'badge-done' },
};

// Notification timing options (minutes before)
const NOTIFY_OPTIONS = [
  { value: 0,    label: 'Randevu anında' },
  { value: 15,   label: '15 dakika önce' },
  { value: 30,   label: '30 dakika önce' },
  { value: 60,   label: '1 saat önce' },
  { value: 1440, label: '1 gün önce' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(first = '', last = '') {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function getCategoryMeta(value) {
  return CATEGORIES.find(c => c.value === value) || CATEGORIES[4];
}

function loadAppointments() {
  try {
    const raw = localStorage.getItem(APPTS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAppointments(appts) {
  localStorage.setItem(APPTS_KEY, JSON.stringify(appts));
}

// Auto-detect status from datetime
function computeStatus(dateStr, timeStr) {
  if (!dateStr) return 'upcoming';
  const today = new Date();
  const apptDate = new Date(dateStr);
  const todayStr  = today.toISOString().split('T')[0];
  const apptStr   = apptDate.toISOString().split('T')[0];
  if (apptStr < todayStr) return 'done';
  if (apptStr === todayStr) return 'today';
  return 'upcoming';
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return { day: '--', month: '---' };
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('tr-TR', { month: 'short' });
  return { day, month };
}

// ── Notification helpers ──────────────────────────────────────────────────────
async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  const result = await Notification.requestPermission();
  return result;
}

function scheduleNotification(appt, minutesBefore) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return null;
  if (!appt.date || !appt.time) return null;

  const [h, m] = appt.time.split(':').map(Number);
  const apptDate = new Date(appt.date);
  apptDate.setHours(h, m, 0, 0);

  const notifyAt = new Date(apptDate.getTime() - minutesBefore * 60 * 1000);
  const now = new Date();
  const msUntil = notifyAt.getTime() - now.getTime();

  if (msUntil <= 0) return null; // past

  const cat = getCategoryMeta(appt.category);
  const timeoutId = setTimeout(() => {
    new Notification(`${cat.label} Randevu Hatırlatması`, {
      body: `${appt.title}${appt.with ? ` — ${appt.with}` : ''}\n⏰ ${appt.time}`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `appt-${appt.id}`,
    });
  }, msUntil);

  return timeoutId;
}

// ── Empty state defaults ──────────────────────────────────────────────────────
const DEFAULT_APPTS = [
  {
    id: 1,
    title: 'Diş Kontrolü',
    with: 'Dr. Ayşe Kara',
    date: new Date().toISOString().split('T')[0],
    time: '10:30',
    category: 'health',
    notifyBefore: 30,
    status: 'today',
  },
  {
    id: 2,
    title: 'Kafe Buluşması',
    with: 'Ece',
    date: (() => { const d = new Date(); d.setDate(d.getDate() + 5); return d.toISOString().split('T')[0]; })(),
    time: '17:00',
    category: 'social',
    notifyBefore: 60,
    status: 'upcoming',
  },
  {
    id: 3,
    title: 'Proje Toplantısı',
    with: 'Takım',
    date: (() => { const d = new Date(); d.setDate(d.getDate() + 10); return d.toISOString().split('T')[0]; })(),
    time: '09:00',
    category: 'work',
    notifyBefore: 15,
    status: 'upcoming',
  },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function AppointmentDashboard({ profile, onLogout }) {
  const [appointments, setAppointments] = useState(() => {
    const saved = loadAppointments();
    return saved ?? DEFAULT_APPTS;
  });
  const [showModal, setShowModal]         = useState(false);
  const [notifPerm, setNotifPerm]         = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [notifBanner, setNotifBanner]     = useState(false);
  const timerRefs = useRef({});

  const [newAppt, setNewAppt] = useState({
    title: '', with: '', date: '', time: '', category: 'other', notifyBefore: 30,
  });

  // Persist to localStorage whenever appointments change
  useEffect(() => {
    saveAppointments(appointments);
  }, [appointments]);

  // Auto-update statuses and schedule notifications on mount/change
  useEffect(() => {
    // Clear existing timers
    Object.values(timerRefs.current).forEach(clearTimeout);
    timerRefs.current = {};

    // Update statuses
    setAppointments(prev =>
      prev.map(a => ({ ...a, status: computeStatus(a.date, a.time) }))
    );

    // Schedule notifications if permission granted
    if (notifPerm === 'granted') {
      appointments.forEach(a => {
        const tid = scheduleNotification(a, a.notifyBefore ?? 30);
        if (tid) timerRefs.current[a.id] = tid;
      });
    }

    return () => Object.values(timerRefs.current).forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifPerm]);

  // Show notification permission banner once
  useEffect(() => {
    if (notifPerm === 'default') setNotifBanner(true);
  }, [notifPerm]);

  const handleRequestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setNotifPerm(result);
    setNotifBanner(false);

    if (result === 'granted') {
      // Schedule all existing appointments
      appointments.forEach(a => {
        const tid = scheduleNotification(a, a.notifyBefore ?? 30);
        if (tid) timerRefs.current[a.id] = tid;
      });
      new Notification('🎉 Bildirimler Aktif!', {
        body: 'Randevu hatırlatmaları artık açık. Kaçırmayacaksın!',
        icon: '/favicon.ico',
      });
    }
  }, [appointments]);

  const handleAddAppointment = useCallback(() => {
    if (!newAppt.title.trim()) return;

    const status = computeStatus(newAppt.date, newAppt.time);
    const appt = {
      id:           Date.now(),
      title:        newAppt.title,
      with:         newAppt.with,
      date:         newAppt.date,
      time:         newAppt.time,
      category:     newAppt.category,
      notifyBefore: parseInt(newAppt.notifyBefore, 10),
      status,
    };

    setAppointments(p => [appt, ...p]);

    // Schedule notification
    if (notifPerm === 'granted') {
      const tid = scheduleNotification(appt, appt.notifyBefore);
      if (tid) timerRefs.current[appt.id] = tid;
    }

    setNewAppt({ title: '', with: '', date: '', time: '', category: 'other', notifyBefore: 30 });
    setShowModal(false);
  }, [newAppt, notifPerm]);

  const handleDelete = useCallback((id) => {
    clearTimeout(timerRefs.current[id]);
    delete timerRefs.current[id];
    setAppointments(p => p.filter(a => a.id !== id));
  }, []);

  const handleMarkDone = useCallback((id) => {
    setAppointments(p => p.map(a => a.id === id ? { ...a, status: 'done' } : a));
  }, []);

  const stats = {
    total:    appointments.length,
    upcoming: appointments.filter(a => a.status === 'upcoming' || a.status === 'today').length,
    done:     appointments.filter(a => a.status === 'done').length,
  };

  const sorted = [...appointments].sort((a, b) => {
    const order = { today: 0, upcoming: 1, done: 2 };
    return (order[a.status] ?? 1) - (order[b.status] ?? 1);
  });

  return (
    <div className="dashboard-wrapper">
      {/* Notification banner */}
      {notifBanner && (
        <div className="notif-banner">
          <span>🔔 Randevu bildirimlerini etkinleştir</span>
          <button onClick={handleRequestPermission} className="notif-banner-btn">İzin Ver</button>
          <button onClick={() => setNotifBanner(false)} className="notif-banner-close">✕</button>
        </div>
      )}

      {/* Navbar */}
      <nav className="dash-nav">
        <div className="dash-nav-logo">Randevu<span>.</span></div>
        <div className="dash-nav-right">
          {notifPerm === 'granted' && (
            <div className="notif-status-dot" title="Bildirimler aktif">🔔</div>
          )}
          <div className="dash-user-badge">
            <div className="dash-avatar">{getInitials(profile?.firstName, profile?.lastName)}</div>
            <span className="dash-user-name">{profile?.firstName} {profile?.lastName}</span>
          </div>
          <button className="dash-btn-logout" onClick={onLogout}>Çıkış</button>
        </div>
      </nav>

      {/* Main */}
      <main className="dash-main">
        {/* Welcome */}
        <div className="dash-welcome">
          <div className="dash-welcome-eyebrow">📅 Randevu Takip</div>
          <h1 className="dash-welcome-title">Hoş geldin, {profile?.firstName}!</h1>
          <p className="dash-welcome-sub">Tüm randevularını tek bir yerden takip et.</p>
        </div>

        {/* Stats */}
        <div className="dash-stats">
          <div className="dash-stat-card">
            <div className="dash-stat-label">Toplam Randevu</div>
            <div className="dash-stat-value">{stats.total}</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-label">Yaklaşan</div>
            <div className="dash-stat-value green">{stats.upcoming}</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-label">Tamamlanan</div>
            <div className="dash-stat-value yellow">{stats.done}</div>
          </div>
        </div>

        {/* Appointments */}
        <div className="dash-section-header">
          <h2 className="dash-section-title">Randevularım</h2>
          <button className="dash-btn-add" onClick={() => setShowModal(true)}>+ Yeni Randevu</button>
        </div>

        <div className="dash-appointments">
          {sorted.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty-icon">📭</div>
              <p>Henüz randevu yok. İlk randevunu ekle!</p>
            </div>
          ) : (
            sorted.map(appt => {
              const s   = STATUS_MAP[appt.status] || STATUS_MAP.upcoming;
              const cat = getCategoryMeta(appt.category);
              const { day, month } = formatDisplayDate(appt.date);
              return (
                <div className="dash-appt-card" key={appt.id}>
                  <div className="dash-appt-date-block" style={{ borderColor: `${cat.color}40`, background: `${cat.color}12` }}>
                    <span className="dash-appt-day" style={{ color: cat.color }}>{day}</span>
                    <span className="dash-appt-month" style={{ color: `${cat.color}aa` }}>{month}</span>
                  </div>
                  <div className="dash-appt-cat-dot" title={cat.label}>{cat.label.split(' ')[0]}</div>
                  <div className="dash-appt-info">
                    <div className="dash-appt-title">{appt.title}</div>
                    <div className="dash-appt-meta">
                      {appt.with && <span>👤 {appt.with}</span>}
                      {appt.time && <span>⏰ {appt.time}</span>}
                      {appt.notifyBefore != null && <span>🔔 {NOTIFY_OPTIONS.find(o => o.value === appt.notifyBefore)?.label || `${appt.notifyBefore}dk önce`}</span>}
                    </div>
                  </div>
                  <span className={`dash-appt-badge ${s.className}`}>{s.label}</span>
                  <div className="dash-appt-actions">
                    {appt.status !== 'done' && (
                      <button className="appt-action-btn done-btn" onClick={() => handleMarkDone(appt.id)} title="Tamamlandı olarak işaretle">✓</button>
                    )}
                    <button className="appt-action-btn delete-btn" onClick={() => handleDelete(appt.id)} title="Sil">🗑</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Add Appointment Modal */}
      {showModal && (
        <div className="dash-modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="dash-modal">
            <h3>✨ Yeni Randevu</h3>

            <div className="dash-modal-field">
              <label className="dash-modal-label">Başlık *</label>
              <input
                className="dash-modal-input"
                placeholder="Örn: Kafe buluşması, Diş kontrolü, Sprint toplantısı…"
                value={newAppt.title}
                onChange={e => setNewAppt(p => ({ ...p, title: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="dash-modal-field">
              <label className="dash-modal-label">Kiminle / Nerede</label>
              <input
                className="dash-modal-input"
                placeholder="Kişi adı, yer veya online"
                value={newAppt.with}
                onChange={e => setNewAppt(p => ({ ...p, with: e.target.value }))}
              />
            </div>

            <div className="modal-row">
              <div className="dash-modal-field" style={{ flex: 1 }}>
                <label className="dash-modal-label">Tarih</label>
                <input
                  className="dash-modal-input"
                  type="date"
                  value={newAppt.date}
                  onChange={e => setNewAppt(p => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="dash-modal-field" style={{ flex: 1 }}>
                <label className="dash-modal-label">Saat</label>
                <input
                  className="dash-modal-input"
                  type="time"
                  value={newAppt.time}
                  onChange={e => setNewAppt(p => ({ ...p, time: e.target.value }))}
                />
              </div>
            </div>

            <div className="dash-modal-field">
              <label className="dash-modal-label">Kategori</label>
              <div className="modal-categories">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    className={`modal-cat-btn ${newAppt.category === cat.value ? 'selected' : ''}`}
                    style={newAppt.category === cat.value ? { borderColor: cat.color, color: cat.color, background: `${cat.color}18` } : {}}
                    onClick={() => setNewAppt(p => ({ ...p, category: cat.value }))}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="dash-modal-field">
              <label className="dash-modal-label">🔔 Bildirim</label>
              <select
                className="dash-modal-input dash-modal-select"
                value={newAppt.notifyBefore}
                onChange={e => setNewAppt(p => ({ ...p, notifyBefore: parseInt(e.target.value, 10) }))}
                disabled={notifPerm !== 'granted'}
              >
                {NOTIFY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {notifPerm !== 'granted' && (
                <span className="modal-notif-hint">
                  {notifPerm === 'denied'
                    ? '⚠️ Bildirim izni reddedildi. Tarayıcı ayarlarından açabilirsin.'
                    : '💡 Bildirim almak için '}
                  {notifPerm === 'default' && (
                    <button className="modal-enable-notif" onClick={handleRequestPermission}>izin ver</button>
                  )}
                </span>
              )}
            </div>

            <div className="dash-modal-actions">
              <button className="dash-modal-cancel" onClick={() => setShowModal(false)}>İptal</button>
              <button className="dash-modal-save" onClick={handleAddAppointment}>Kaydet ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
