import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, Mail, Lock, User, Loader2,
  Eye, EyeOff, AlertCircle, CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ── Password strength bar ───────────────────────────────────────────── */
interface StrengthResult {
  score: number;
  label: string;
  color: string;
  checks: { label: string; pass: boolean }[];
}

function getStrength(password: string): StrengthResult {
  const checks = [
    { label: 'At least 8 characters',          pass: password.length >= 8 },
    { label: 'One uppercase letter (A–Z)',      pass: /[A-Z]/.test(password) },
    { label: 'One number (0–9)',                pass: /[0-9]/.test(password) },
    { label: 'One special character (!@#...)',  pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
  return { score, label: labels[score] || '', color: colors[score] || '', checks };
}

function StrengthBar({ password, show }: { password: string; show: boolean }) {
  if (!show || !password) return null;
  const { score, label, color, checks } = getStrength(password);
  return (
    <div className="mt-2 space-y-2">
      {/* Bar */}
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? color : 'rgba(59,130,246,0.15)' }} />
        ))}
      </div>
      <p className="text-xs font-medium" style={{ color }}>{label}</p>
      {/* Checklist */}
      <div className="grid grid-cols-2 gap-1">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1.5">
            {c.pass
              ? <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              : <div className="w-3 h-3 rounded-full border border-blue-700 flex-shrink-0" />}
            <span className={`text-xs ${c.pass ? 'text-emerald-400' : 'text-blue-600'}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Register page ───────────────────────────────────────────────────── */
export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [agreed,   setAgreed]   = useState(false);
  const [touched,  setTouched]  = useState({
    name: false, email: false, password: false, confirm: false
  });

  const strength = getStrength(password);

  // Field validation
  const fieldErrors = {
  name:     touched.name     && !name.trim()
                              ? 'Full name is required.' :
            touched.name     && /[0-9]/.test(name)
                              ? 'Name cannot contain numbers.' :
            touched.name     && !/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/.test(name.trim())
                              ? 'Name can only contain letters, spaces, hyphens, and apostrophes.' :
            '',
    email:    touched.email    && !email.trim()                       ? 'Email address is required.'         :
              touched.email    && !/\S+@\S+\.\S+/.test(email)        ? 'Enter a valid email address.'       : '',
    password: touched.password && !password                           ? 'Password is required.'              :
              touched.password && strength.score < 4                 ? 'Password does not meet requirements.' : '',
    confirm:  touched.confirm  && !confirm                            ? 'Please confirm your password.'      :
              touched.confirm  && confirm !== password                ? 'Passwords do not match.'            : '',
  };

  const touch = (field: keyof typeof touched) =>
    setTouched(t => ({ ...t, [field]: true }));

  const touchAll = () =>
    setTouched({ name: true, email: true, password: true, confirm: true });

  const isNetworkError = error.toLowerCase().includes('failed to fetch') ||
                         error.toLowerCase().includes('network');
  const isBreachError  = error.toLowerCase().includes('breach') ||
                         error.toLowerCase().includes('pwned');
  const isEmailTaken   = error.toLowerCase().includes('already registered') ||
                         error.toLowerCase().includes('email');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    touchAll();
    if (Object.values(fieldErrors).some(Boolean)) return;
    if (!agreed) { setError('You must agree to the Terms of Service to continue.'); return; }

    setError(''); setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate('/verify-email-pending'); 
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const inputBorder = (field: keyof typeof fieldErrors) =>
    fieldErrors[field]
      ? '1px solid rgba(239,68,68,0.5)'
      : touched[field]
      ? '1px solid rgba(34,211,238,0.3)'
      : '1px solid rgba(59,130,246,0.3)';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="bg-blue-950/60 backdrop-blur-sm rounded-2xl p-8 border border-blue-800/50 shadow-xl animate-slide-up">

          {/* Header */}
          <div className="text-center mb-7">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
            <p className="text-blue-400 text-sm">Join TrueSite — free · 5 analyses per day</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className={`mb-5 p-4 rounded-xl border ${
              isNetworkError ? 'bg-yellow-500/10 border-yellow-500/25' :
              isBreachError  ? 'bg-orange-500/10 border-orange-500/25' :
              'bg-red-500/10 border-red-500/25'
            }`}>
              <div className="flex items-start gap-3">
                <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  isNetworkError ? 'text-yellow-400' :
                  isBreachError  ? 'text-orange-400' : 'text-red-400'
                }`} />
                <div>
                  <p className={`text-sm font-semibold ${
                    isNetworkError ? 'text-yellow-300' :
                    isBreachError  ? 'text-orange-300' : 'text-red-300'
                  }`}>
                    {isNetworkError ? '📡 Cannot reach server'    :
                     isBreachError  ? '🚨 Password found in breach' :
                     isEmailTaken   ? '📧 Email already registered' :
                     '⚠️ Registration failed'}
                  </p>
                  <p className={`text-xs mt-1 whitespace-pre-line ${
                    isNetworkError ? 'text-yellow-200/70' :
                    isBreachError  ? 'text-orange-200/70' : 'text-red-200/70'
                  }`}>{error}</p>

                  {/* Contextual tips */}
                  {isNetworkError && (
                    <p className="text-xs mt-2 text-yellow-200/60">
                      Make sure the backend is running: <code className="bg-yellow-900/40 px-1 rounded">uvicorn main:app --reload --port 8000</code>
                    </p>
                  )}
                  {isBreachError && (
                    <p className="text-xs mt-2 text-orange-200/60">
                      This password appeared in a known data breach. Choose a unique password you haven't used elsewhere.
                    </p>
                  )}
                  {isEmailTaken && (
                    <p className="text-xs mt-2 text-red-200/60">
                      Try <Link to="/signin" className="text-cyan-400 hover:text-white underline">signing in</Link> instead.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Full name */}
            <div>
              <label className="block text-sm text-blue-300 mb-1.5 font-medium">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input type="text" value={name}
                  onChange={e => setName(e.target.value)}
                  onBlur={() => touch('name')}
                   onKeyDown={e => {
                     if (/[0-9]/.test(e.key)) e.preventDefault();}}
                  placeholder="Your Name" disabled={loading}
                  className="url-input w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-blue-600 bg-blue-900/50 disabled:opacity-50"
                  style={{ border: inputBorder('name') }} />
              </div>
              {fieldErrors.name && <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-blue-300 mb-1.5 font-medium">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={() => touch('email')}
                  placeholder="you@example.com" disabled={loading}
                  className="url-input w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-blue-600 bg-blue-900/50 disabled:opacity-50"
                  style={{ border: inputBorder('email') }} />
              </div>
              {fieldErrors.email && <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-blue-300 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={() => touch('password')}
                  placeholder="Min 8 chars · uppercase · number · symbol" disabled={loading}
                  className="url-input w-full pl-10 pr-10 py-3 rounded-xl text-white text-sm placeholder-blue-600 bg-blue-900/50 disabled:opacity-50"
                  style={{ border: inputBorder('password') }} />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.password}</p>}
              <StrengthBar password={password} show={touched.password || password.length > 0} />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm text-blue-300 mb-1.5 font-medium">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onBlur={() => touch('confirm')}
                  placeholder="Re-enter your password" disabled={loading}
                  className="url-input w-full pl-10 pr-10 py-3 rounded-xl text-white text-sm placeholder-blue-600 bg-blue-900/50 disabled:opacity-50"
                  style={{ border: inputBorder('confirm') }} />
                {confirm && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {confirm === password
                      ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                      : <AlertCircle className="w-4 h-4 text-red-400" />}
                  </div>
                )}
              </div>
              {fieldErrors.confirm && <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.confirm}</p>}
            </div>

            {/* Terms */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 accent-blue-500" />
                <span className="text-xs text-blue-400">
                  I agree to the{' '}
                  <a href="#" className="text-cyan-400 hover:text-white transition-colors">Terms of Service</a>{' '}
                  and{' '}
                  <a href="#" className="text-cyan-400 hover:text-white transition-colors">Privacy Policy</a>
                </span>
              </label>
              {!agreed && error.includes('Terms') && (
                <p className="text-red-400 text-xs mt-1 ml-6 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />You must agree to continue.
                </p>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account...</>
                : 'Create Account →'}
            </button>
          </form>

          <p className="text-center text-sm text-blue-400 mt-5">
            Already have an account?{' '}
            <Link to="/signin" className="text-cyan-400 hover:text-white font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
