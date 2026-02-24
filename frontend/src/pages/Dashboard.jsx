import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchProjects } from '../api';
import {
  LayoutDashboard,
  Clock,
  LogOut,
  Users,
  ChevronRight,
} from 'lucide-react';

const iconMap = {
  LayoutDashboard,
  Clock,
};

function ProjectCard({ project, onClick }) {
  const Icon = iconMap[project.icon] || LayoutDashboard;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex items-center gap-4"
    >
      <div className="p-3 bg-indigo-50 rounded-lg">
        <Icon className="w-8 h-8 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-800">{project.name}</h3>
        {project.description && (
          <p className="text-sm text-slate-500 mt-0.5">{project.description}</p>
        )}
      </div>
      <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
    </button>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleProjectClick = (project) => {
    if (project.slug === 'dashboard') return;
    if (project.slug === 'orari-turni') {
      navigate('/orari-turni');
      return;
    }
    if (project.url) window.location.href = project.url;
  };

  const isAdminOrTecnico = user?.ruolo === 'admin' || user?.ruolo === 'tecnico';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Paradiso</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">
            {user?.nome} {user?.cognome}
            <span className="ml-2 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs">
              {user?.ruolo}
            </span>
          </span>
          {isAdminOrTecnico && (
            <button
              type="button"
              onClick={() => navigate('/utenti')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Users size={18} />
              Utenti
            </button>
          )}
          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut size={18} />
            Esci
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">I tuoi progetti</h2>
        <p className="text-slate-500 mb-8">
          Scegli un progetto per continuare. Solo i progetti a te assegnati sono visibili.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
        )}
        {loading ? (
          <div className="text-slate-500">Caricamento...</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1">
            {projects
              .filter((p) => p.slug !== 'dashboard')
              .map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => handleProjectClick(project)}
                />
              ))}
          </div>
        )}
        {!loading && !error && projects.length === 0 && (
          <p className="text-slate-500">Nessun progetto assegnato.</p>
        )}
      </main>
    </div>
  );
}
