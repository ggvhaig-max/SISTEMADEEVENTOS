import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user, profile, tenant, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !authLoading) {
      if (profile?.rol === 'superadmin') {
        navigate('/superadmin/dashboard');
      } else if (profile?.rol === 'vendedor') {
        navigate('/vendedor/dashboard');
      } else if (profile?.rol === 'cliente' && tenant) {
        navigate(`/${tenant.slug}/dashboard`);
      }
    }
  }, [user, profile, tenant, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      // Wait for AuthContext's onAuthStateChange to fetch profile and redirect
    } catch (err) {
      setError('Credenciales inválidas');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-500">SISTEMA DE EVENTOS</span>
          </div>
          <p className="text-slate-500">Panel de Administración</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-white/50 rounded-lg text-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="admin@ejemplo.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-white/50 rounded-lg text-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/register" className="text-orange-500 hover:text-blue-300 text-sm">
              ¿No tienes cuenta? Regístrate
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
