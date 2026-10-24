import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Loader2, Eye, EyeOff, AlertCircle, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type ErrorType = 'credentials' | 'locked' | 'network' | 'unknown' | null;

function getErrorType(msg: string): ErrorType {
  const m = msg.toLowerCase();
  if (m.includes('locked')) return 'locked';
  if (m.includes('invalid email or password')) return 'credentials';
  if (m.includes('failed to fetch') || m.includes('network')) return 'network';
  return 'unknown';
}

const ERROR_CONFIGS: Record<NonNullable<ErrorType>, { icon: string; title: string; color: string; bg: string; border: string }> = {
  credentials: { icon: '🔑', title: 'Invalid credentials', color: 'text-red-300', bg: 'bg-red-500/10', border: 'border-red-500/25' },
  locked: { icon: '🔒', title: 'Account locked', color: 'text-orange-300', bg: 'bg-orange-500/10', border: 'border-orange-500/25' },
  network: { icon: '📡', title: 'Cannot reach server', color: 'text-yellow-300', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  unknown: { icon: '⚠️', title: 'Something went wrong', color: 'text-red-300', bg: 'bg-red-500/10', border: 'border-red-500/25' },
};

export function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<ErrorType>(null);

  // Field-level touched state
  const [touched, setTouched] = useState({ email: false, password: false });
  const emailError = touched.email && !email ? 'Email is required.' : '';
  const passwordError = touched.password && !password ? 'Password is required.' : '';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!email || !password) return;

    setError(''); setErrorType(null); setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      const msg = err.message || 'Login failed.';
      setError(msg);
      setErrorType(getErrorType(msg));
    } finally { setLoading(false); }
  };

  const cfg = errorType ? ERROR_CONFIGS[errorType] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="bg-blue-950/60 backdrop-blur-sm rounded-2xl p-8 border border-blue-800/50 shadow-xl animate-slide-up">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
            <p className="text-blue-400 text-sm">Sign in to your TrueSite account</p>
          </div>

          {/* Error banner */}
          {cfg && error && (
            <div className={`mb-5 p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}>
              <div className="flex items-start gap-3">
                <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${cfg.color}`} />
                <div>
                  <p className={`text-sm font-semibold ${cfg.color}`}>
                    {cfg.icon} {cfg.title}
                  </p>
                  <p className={`text-xs mt-1 ${cfg.color} opacity-80 whitespace-pre-line`}>{error}</p>

                  {/* Contextual help */}
                  {errorType === 'network' && (
                    <p className="text-xs mt-2 text-yellow-200/70">
                      Make sure the backend is running on <code className="bg-yellow-900/40 px-1 rounded">http://localhost:8000</code>
                    </p>
                  )}
                  {errorType === 'locked' && (
                    <p className="text-xs mt-2 text-orange-200/70">
                      Wait for the lockout period to expire, or contact an admin to unlock your account.
                    </p>
                  )}
                  {errorType === 'credentials' && (
                    <p className="text-xs mt-2 text-red-200/70">
                      Double-check your email and password. Passwords are case-sensitive.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label className="block text-sm text-blue-300 mb-1.5 font-medium">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, email: true }))}
                  placeholder="you@example.com" disabled={loading}
                  className="url-input w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-blue-600 bg-blue-900/50 disabled:opacity-50"
                  style={{ border: `1px solid ${emailError ? 'rgba(239,68,68,0.5)' : 'rgba(59,130,246,0.3)'}` }}
                />
              </div>
              {emailError && <p className="text-red-400 text-xs mt-1 ml-1">{emailError}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-blue-300 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, password: true }))}
                  placeholder="••••••••" disabled={loading}
                  className="url-input w-full pl-10 pr-10 py-3 rounded-xl text-white text-sm placeholder-blue-600 bg-blue-900/50 disabled:opacity-50"
                  style={{ border: `1px solid ${passwordError ? 'rgba(239,68,68,0.5)' : 'rgba(59,130,246,0.3)'}` }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && <p className="text-red-400 text-xs mt-1 ml-1">{passwordError}</p>}
            </div>
            <div className="flex justify-end mt-1 mb-2">
              <Link to="/forgot-password" className="text-xs text-cyan-400 hover:text-white transition-colors">
                Forgot Password?
              </Link>
            </div>
            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 mt-2">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>
                : 'Sign In →'}
            </button>
          </form>

          <p className="text-center text-sm text-blue-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyan-400 hover:text-white font-semibold transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
