import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, Users, Crown, Lock, Unlock, Trash2,
  RefreshCw, AlertTriangle, CheckCircle,
  Search, LayoutDashboard, ShieldOff, BarChart2, Loader2,
  AlertCircle, CheckCircle2
} from 'lucide-react';
import { useAuth, API } from '../context/AuthContext';

interface UserRecord {
  User_ID: number;
  full_name: string;
  Email: string;
  Role: string;
  Account_type: string;
  created_at: string;
  failed_attempts: number;
  locked_until: string | null;
  last_login: string | null;
}

interface Stats {
  total_users: number;
  admin_count: number;
  regular_users: number;
  currently_locked: number;
  total_analyses: number;
  total_scans: number;
  results_breakdown: { legitimate: number; suspicious: number; phishing: number };
}

/* ── Access Denied page ──────────────────────────────────────────────── */
function AccessDenied({ reason }: { reason: 'not_logged_in' | 'not_admin' }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center animate-slide-up">

        {/* Icon */}
        <div className="inline-flex p-6 rounded-3xl mb-6"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <ShieldOff className="w-16 h-16 text-red-400" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-red-400 font-semibold text-lg mb-4">
          {reason === 'not_logged_in' ? '401 — Not Authenticated' : '403 — Forbidden'}
        </p>

        {/* Description */}
        <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-5 mb-8 text-left">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              {reason === 'not_logged_in' ? (
                <>
                  <p className="text-red-300 font-semibold text-sm mb-1">You are not signed in</p>
                  <p className="text-red-200/70 text-sm">
                    The Admin Dashboard requires authentication. Please sign in with an admin account to access this page.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-red-300 font-semibold text-sm mb-1">Insufficient permissions</p>
                  <p className="text-red-200/70 text-sm">
                    Your account does not have admin privileges. This page is restricted to administrators only.
                    Contact an admin if you believe this is a mistake.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* What they tried to access */}
        <div className="bg-blue-900/30 border border-blue-800/50 rounded-xl p-4 mb-8 text-left">
          <p className="text-blue-500 text-xs font-semibold uppercase tracking-wider mb-2">Attempted access</p>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-blue-400" />
            <code className="text-blue-300 text-sm">/admin — Admin Dashboard</code>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-xs">Required role: <strong className="text-purple-400">Admin</strong></span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {reason === 'not_logged_in' ? (
            <>
              <Link to="/signin"
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all hover:scale-105">
                Sign In
              </Link>
              <Link to="/"
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-blue-300 hover:text-white border border-blue-700/50 transition-colors">
                Go to Home
              </Link>
            </>
          ) : (
            <>
              <Link to="/"
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all hover:scale-105">
                Back to Analyzer
              </Link>
              <Link to="/signin"
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-blue-300 hover:text-white border border-blue-700/50 transition-colors"
                onClick={() => { localStorage.removeItem('truesite_token'); localStorage.removeItem('truesite_user'); }}>
                Sign in as Admin
              </Link>
            </>
          )}
        </div>

        <p className="text-blue-700 text-xs mt-8">
          TrueSite Security · Unauthorized access attempts are logged.
        </p>
      </div>
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────────────────── */
export function AdminDashboard() {
  const { user, token, isAdmin } = useAuth();

  // Show access denied before any data fetching
  if (!user) return <AccessDenied reason="not_logged_in" />;
  if (!isAdmin()) return <AccessDenied reason="not_admin" />;

  return <DashboardContent user={user} token={token!} />;
}

/* ── Dashboard content — only renders if admin ───────────────────────── */
function DashboardContent({ user, token }: { user: any; token: string }) {
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [confirmDel, setConfirmDel] = useState<number | null>(null);

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch(`${API}/api/admin/users`, { headers: authHeaders }),
        fetch(`${API}/api/admin/stats`, { headers: authHeaders }),
      ]);
      if (!usersRes.ok) throw new Error('Failed to load users.');
      setUsers(await usersRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e: any) {
      setError(e.message || 'Failed to load data.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const showMsg = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const updateRole = async (userId: number, newRole: string) => {
    const res = await fetch(`${API}/api/admin/users/${userId}/role`, {
      method: 'PUT', headers: authHeaders,
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) { showMsg(`Role updated to ${newRole}.`); fetchData(); }
    else { const e = await res.json(); showMsg(`Error: ${e.detail}`); }
  };

  const resetLockout = async (userId: number, email: string) => {
    const res = await fetch(`${API}/api/admin/users/${userId}/reset-lockout`, {
      method: 'POST', headers: authHeaders,
    });
    if (res.ok) { showMsg(`Lockout cleared for ${email}.`); fetchData(); }
    else { const e = await res.json(); showMsg(`Error: ${e.detail}`); }
  };

  const deleteUser = async (userId: number) => {
    const res = await fetch(`${API}/api/admin/users/${userId}`, {
      method: 'DELETE', headers: authHeaders,
    });
    if (res.ok) { showMsg('User deleted.'); setConfirmDel(null); fetchData(); }
    else { const e = await res.json(); showMsg(`Error: ${e.detail}`); }
  };

  const isLocked = (u: UserRecord) =>
    u.locked_until && new Date(u.locked_until) > new Date();

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.Email.toLowerCase().includes(search.toLowerCase()) ||
    u.Role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white">

      {/* Header */}
      <div className="border-b border-blue-800/50 bg-blue-950/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-xs text-blue-400">TrueSite User Management · Signed in as <span className="text-purple-400">{user.full_name}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-blue-300 hover:text-white bg-blue-800/40 hover:bg-blue-700/40 border border-blue-700/50 transition-all">
              <RefreshCw className="w-4 h-4" />Refresh
            </button>
            <Link to="/"
              className="px-3 py-2 rounded-xl text-sm text-blue-300 hover:text-white border border-blue-700/50 transition-colors">
              ← Back to Analyzer
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Action message */}
        {actionMsg && (
          <div className="mb-6 p-3 rounded-xl flex items-center gap-2 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 animate-slide-up">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />{actionMsg}
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 rounded-xl flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/25">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 animate-slide-up">
            {[
              { label: 'Total Users', value: stats.total_users, icon: <Users className="w-5 h-5 text-blue-400" />, bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
              { label: 'Admins', value: stats.admin_count, icon: <Crown className="w-5 h-5 text-purple-400" />, bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
              { label: 'Regular Users', value: stats.regular_users, icon: <Users className="w-5 h-5 text-cyan-400" />, bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
              { label: 'Locked Accounts', value: stats.currently_locked, icon: <Lock className="w-5 h-5 text-red-400" />, bg: 'bg-red-500/10', border: 'border-red-500/20' },
              { label: 'Total Analyses', value: stats.total_analyses, icon: <BarChart2 className="w-5 h-5 text-emerald-400" />, bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
              { label: 'Total URL Scans', value: stats.total_scans, icon: <CheckCircle className="w-5 h-5 text-sky-400" />, bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-blue-300 text-sm">{s.label}</span>{s.icon}
                </div>
                <p className="text-3xl font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>
        )}


        {/* Results breakdown */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8 animate-slide-up-1">
            <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-2xl p-4 text-center">
              <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">Legitimate</p>
              <p className="text-3xl font-bold text-emerald-400">{stats.results_breakdown.legitimate}</p>
              <p className="text-xs text-blue-500 mt-1">from analysis_results</p>
            </div>
            <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-2xl p-4 text-center">
              <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-2">Suspicious</p>
              <p className="text-3xl font-bold text-yellow-400">{stats.results_breakdown.suspicious}</p>
              <p className="text-xs text-blue-500 mt-1">from analysis_results</p>
            </div>
            <div className="bg-red-500/8 border border-red-500/20 rounded-2xl p-4 text-center">
              <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">Phishing Alert</p>
              <p className="text-3xl font-bold text-red-400">{stats.results_breakdown.phishing}</p>
              <p className="text-xs text-blue-500 mt-1">from analysis_results</p>
            </div>
          </div>
        )}

        {/* Security controls */}
        <div className="bg-blue-950/60 backdrop-blur-sm rounded-2xl p-5 border border-blue-800/50 mb-8 animate-slide-up-1">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />Implemented Security Controls
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { no: '1', label: 'Session Management', detail: 'JWT tokens · 60 min expiry' },
              { no: '2', label: 'Role-Based Access Control', detail: 'User / Admin roles' },
              { no: '3', label: 'Password Policy + HIBP', detail: '8 chars · uppercase · number · symbol · breach check' },
              { no: '4', label: 'bcrypt Storage', detail: 'Hashed with salt rounds' },
              { no: '5', label: 'Account Lockout', detail: '5 failures → 15 min lock' },
            ].map(c => (
              <div key={c.no} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs font-bold text-emerald-400">Control {c.no}</span>
                </div>
                <p className="text-xs text-white font-medium">{c.label}</p>
                <p className="text-xs text-blue-400 mt-0.5">{c.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Users table */}
        <div className="bg-blue-950/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-blue-800/50 animate-slide-up-2">
          <div className="p-5 border-b border-blue-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              All Users
              <span className="text-xs text-blue-500 font-normal ml-1">({filtered.length})</span>
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-500" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search name, email, role..."
                className="pl-8 pr-4 py-2 text-sm bg-blue-900/50 border border-blue-700/50 rounded-xl text-white placeholder-blue-600 url-input w-64" />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-blue-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />Loading users...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-blue-600 text-sm">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-blue-800/50">
                    {['ID', 'Name', 'Email', 'Role', 'Account', 'Status', 'Last Login', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-blue-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, idx) => {
                    const locked = isLocked(u);
                    const isCurrentUser = u.User_ID === user?.User_ID;
                    return (
                      <tr key={u.User_ID}
                        className={`border-b border-blue-900/50 transition-colors hover:bg-blue-800/15 ${idx % 2 === 0 ? '' : 'bg-blue-950/20'}`}>
                        <td className="px-4 py-3 text-sm text-blue-500 font-mono">{u.User_ID}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {u.full_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-white font-medium">{u.full_name}</span>
                            {isCurrentUser && <span className="text-xs text-cyan-400">(you)</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-300 font-mono">{u.Email}</td>
                        <td className="px-4 py-3">
                          {isCurrentUser ? (
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-500/10 border border-purple-500/25 text-purple-300">{u.Role}</span>
                          ) : (
                            <select value={u.Role} onChange={e => updateRole(u.User_ID, e.target.value)}
                              className="text-xs px-2 py-1 rounded-lg bg-blue-900/60 border border-blue-700/50 text-white cursor-pointer hover:border-blue-500/50 transition-colors">
                              <option value="User">User</option>
                              <option value="Admin">Admin</option>
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-300">{u.Account_type}</span>
                        </td>
                        <td className="px-4 py-3">
                          {locked ? (
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                              <span className="text-xs text-red-400 font-medium">Locked</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span className="text-xs text-emerald-400">Active</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-blue-500">
                          {u.last_login ? new Date(u.last_login).toLocaleString() : <span className="text-blue-700">Never</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {locked && (
                              <button onClick={() => resetLockout(u.User_ID, u.Email)} title="Clear lockout"
                                className="p-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/25 text-yellow-400 transition-colors">
                                <Unlock className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!isCurrentUser && (
                              confirmDel === u.User_ID ? (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => deleteUser(u.User_ID)}
                                    className="px-2 py-1 rounded text-xs font-bold bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors">
                                    Confirm
                                  </button>
                                  <button onClick={() => setConfirmDel(null)}
                                    className="px-2 py-1 rounded text-xs text-blue-400 hover:text-white transition-colors">
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmDel(u.User_ID)} title="Delete user"
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-blue-700 mt-6">
          Admin actions are permanent · Role changes take effect on next login · Access attempts are logged
        </p>
      </div>
    </div>
  );
}