import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchUsers,
  fetchAvailableProjects,
  createUser,
  updateUser,
  deleteUser,
} from '../api';
import { Users, Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';

export default function GestioneUtenti() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    email: '',
    password: '',
    ruolo: 'cliente',
    nome: '',
    cognome: '',
    enabled_projects: ['dashboard'],
  });

  const load = () => {
    setLoading(true);
    Promise.all([fetchUsers(), fetchAvailableProjects()])
      .then(([u, p]) => {
        setUsers(u);
        setAvailableProjects(p.filter((x) => x.slug !== 'dashboard'));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!currentUser) return;
    const isAdminOrTecnico = currentUser.ruolo === 'admin' || currentUser.ruolo === 'tecnico';
    if (!isAdminOrTecnico) {
      navigate('/', { replace: true });
      return;
    }
    load();
  }, [currentUser?.ruolo, navigate]);

  const openCreate = () => {
    setForm({
      email: '',
      password: '',
      ruolo: 'cliente',
      nome: '',
      cognome: '',
      enabled_projects: ['dashboard'],
    });
    setModal('create');
    setError('');
  };

  const openEdit = (u) => {
    setForm({
      id: u.id,
      email: u.email,
      password: '',
      ruolo: u.ruolo,
      nome: u.nome,
      cognome: u.cognome,
      enabled_projects: u.enabled_projects || ['dashboard'],
    });
    setModal('edit');
    setError('');
  };

  const toggleProject = (slug) => {
    const next = form.enabled_projects.includes(slug)
      ? form.enabled_projects.filter((s) => s !== slug)
      : [...form.enabled_projects, slug];
    if (next.length === 0) next.push('dashboard');
    setForm((f) => ({ ...f, enabled_projects: next }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (modal === 'create') {
        await createUser({
          email: form.email,
          password: form.password,
          ruolo: form.ruolo,
          nome: form.nome,
          cognome: form.cognome,
          enabled_projects: form.enabled_projects,
        });
      } else {
        await updateUser(form.id, {
          email: form.email,
          password: form.password || undefined,
          ruolo: form.ruolo,
          nome: form.nome,
          cognome: form.cognome,
          enabled_projects: form.enabled_projects,
        });
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questo utente?')) return;
    try {
      await deleteUser(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft size={20} />
            Dashboard
          </button>
          <h1 className="text-xl font-semibold text-slate-800">Gestione utenti</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
        )}
        <div className="flex justify-end mb-6">
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus size={18} />
            Nuovo utente
          </button>
        </div>

        {loading ? (
          <p className="text-slate-500">Caricamento...</p>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                    Nome / Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Ruolo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                    Progetti
                  </th>
                  <th className="w-24 py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">
                        {u.nome} {u.cognome}
                      </div>
                      <div className="text-sm text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          u.ruolo === 'admin' || u.ruolo === 'tecnico'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.ruolo}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {(u.enabled_projects || ['dashboard']).join(', ')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded"
                        >
                          <Pencil size={16} />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            type="button"
                            onClick={() => handleDelete(u.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold">
                {modal === 'create' ? 'Nuovo utente' : 'Modifica utente'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                <input
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cognome</label>
                <input
                  value={form.cognome}
                  onChange={(e) => setForm((f) => ({ ...f, cognome: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ruolo</label>
                <select
                  value={form.ruolo}
                  onChange={(e) => setForm((f) => ({ ...f, ruolo: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="cliente">Cliente</option>
                  <option value="tecnico">Tecnico</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {modal === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required={modal === 'create'}
                    minLength={6}
                  />
                </div>
              )}
              {modal === 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nuova password (lascia vuoto per non cambiare)
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Opzionale"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Progetti abilitati
                </label>
                <div className="flex flex-wrap gap-3">
                  {availableProjects.map((p) => {
                    const checked = (form.enabled_projects || []).includes(p.slug);
                    return (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProject(p.slug)}
                          className="rounded border-slate-300 text-indigo-600"
                        />
                        <span className="text-sm">{p.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {modal === 'create' ? 'Crea' : 'Salva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
