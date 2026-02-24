import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Placeholder per il modulo Orari e Turni.
 * Qui andrà la logica (o redirect a app dedicata) come in TicketApp.
 */
export default function OrariTurni() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft size={20} />
          Torna alla Dashboard
        </button>
        <h1 className="text-xl font-semibold text-slate-800">Orari e Turni</h1>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          Modulo Orari e Turni in fase di implementazione. Struttura pronta per l’integrazione.
        </div>
      </main>
    </div>
  );
}
