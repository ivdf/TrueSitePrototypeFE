import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth, API } from '../context/AuthContext';
import { parseApiError } from '../utils/apiError';

export function ChangePassword() {
  const { token, logout, clearForceChange } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirm, setConfirm]                 = useState('');
  const [error, setError]                     = useState('');
  const [loading, setLoading]                 = useState(false);
  const [success, setSuccess]                 = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password:     newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(parseApiError(data.detail));

      clearForceChange();
      setSuccess(true);
      setTimeout(() => {
        logout();
        navigate('/signin', { replace: true });
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="bg-blue-950/60 backdrop-blur-sm rounded-2xl p-8 border border-blue-800/50 shadow-xl animate-slide-up">

          {/* Header */}
          <div className="text-center mb-7">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Change Your Password</h1>
            <p className="text-blue-400 text-sm">
              Your administrator account is using a default password.
              You must set a new one before continuing.
            </p>
          </div>

          {/* Warning */}
          {!success && (
            <div className="mb-5 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/25 flex gap-3">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-200/80">
                New password must be at least 8 characters, include one uppercase letter,
                one number, and one special character. It must also not appear in known
                data breaches.
              </p>
            </div>
          )}

          {/* Success */}
          {success ? (
            <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-xl text-emerald-300 text-sm flex gap-3">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>Password changed successfully. Redirecting to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/25 p-4 rounded-xl text-red-300 text-sm flex gap-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="whitespace-pre-line">{error}</p>
                </div>
              )}

              {/* Current password */}
              <div>
                <label className="block text-sm text-blue-300 mb-1.5 font-medium">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="admin123"
                    className="url-input w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-blue-600 bg-blue-900/50 disabled:opacity-50"
                    style={{ border: '1px solid rgba(59,130,246,0.3)' }}
                  />
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-sm text-blue-300 mb-1.5 font-medium">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={loading}
                    placeholder="Min 8 chars · uppercase · number · symbol"
                    className="url-input w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-blue-600 bg-blue-900/50 disabled:opacity-50"
                    style={{ border: '1px solid rgba(59,130,246,0.3)' }}
                  />
                </div>
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-sm text-blue-300 mb-1.5 font-medium">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Re-enter your new password"
                    className="url-input w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-blue-600 bg-blue-900/50 disabled:opacity-50"
                    style={{
                      border: confirm && confirm !== newPassword
                        ? '1px solid rgba(239,68,68,0.5)'
                        : '1px solid rgba(59,130,246,0.3)'
                    }}
                  />
                  {confirm && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {confirm === newPassword
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        : <AlertCircle className="w-4 h-4 text-red-400" />}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Updating...</>
                  : 'Change Password →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}