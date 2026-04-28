import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAuthHeader } from '../api';
import TimesheetManager from '../components/TimesheetManager';

export default function OrariTurni() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const canManageUsers = currentUser?.ruolo === 'admin' || currentUser?.ruolo === 'tecnico';
  const [notification, setNotification] = useState({ message: '', type: 'info', visible: false });
  const notifTimeoutRef = React.useRef(null);

  const showNotification = (message, type = 'info', duration = 4000) => {
    if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    setNotification({ message, type, visible: true });
    notifTimeoutRef.current = setTimeout(() => {
      setNotification((n) => ({ ...n, visible: false }));
      notifTimeoutRef.current = null;
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast notifiche */}
      {notification.visible && notification.message && (
        <div
          className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-lg shadow-lg border text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200 ${
            notification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : notification.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-slate-800 border-slate-600 text-white'
          }`}
          role="alert"
        >
          {notification.message}
        </div>
      )}

      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft size={20} />
          Torna alla Dashboard
        </button>
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-slate-800">Orari e Turni</h1>
          {canManageUsers && (
            <button
              type="button"
              onClick={() => navigate('/utenti')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Users size={18} />
              Utenti
            </button>
          )}
        </div>
      </header>
      <main className="min-h-[calc(100vh-120px)]">
        <TimesheetManager
          currentUser={currentUser}
          getAuthHeader={getAuthHeader}
          showNotification={showNotification}
        />
      </main>
    </div>
  );
}
