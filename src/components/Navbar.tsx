import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LogOut, User, Menu, X, LayoutDashboard, Key, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth, API } from '../context/AuthContext';

export function Navbar() {
  const { user, logout, isAdmin, token } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  
  const handleLogout = () => { logout(); navigate('/signin'); };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-blue-800/50 bg-blue-950/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg">TrueSite</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Admin dashboard link */}
                {isAdmin() && (
                  <Link to="/admin"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/10 border border-purple-500/25 text-purple-300 hover:text-white hover:bg-purple-500/20 transition-all">
                    <LayoutDashboard className="w-3.5 h-3.5" />Admin Dashboard
                  </Link>
                )}

                {/* 🔑 Reset Password Icon */}
                <button
                  onClick={() => setShowResetModal(true)}
                  className="p-2 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all"
                  title="Change Password"
                >
                  <Key className="w-4 h-4" />
                </button>

                {/* User info */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-900/50 border border-blue-800/50">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-sm text-blue-200 max-w-[140px] truncate">{user.full_name}</span>
                  <span className="text-xs text-blue-500">· {user.Role}</span>
                </div>

                {/* Logout */}
                <button onClick={handleLogout}
                  className="p-2 rounded-lg text-blue-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Sign out">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/signin" className="px-4 py-1.5 rounded-lg text-sm font-medium text-blue-300 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="px-4 py-1.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-blue-400" onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden px-4 pb-4 flex flex-col gap-2 border-t border-blue-800/50">
            {user ? (
              <>
                <span className="text-blue-400 text-xs pt-2">{user.Email} · {user.Role}</span>
                
                {/* Mobile reset password option */}
                <button 
                  onClick={() => { setShowResetModal(true); setMenuOpen(false); }}
                  className="text-cyan-400 text-sm py-1 flex items-center gap-2"
                >
                  <Key className="w-3.5 h-3.5" /> Change Password
                </button>
                
                {isAdmin() && (
                  <Link to="/admin" className="text-purple-300 text-sm py-1" onClick={() => setMenuOpen(false)}>
                    Admin Dashboard
                  </Link>
                )}
                <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="text-red-400 text-sm text-left py-2">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/signin"   className="text-blue-300 text-sm py-2" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link to="/register" className="text-white text-sm py-2 font-bold" onClick={() => setMenuOpen(false)}>Get Started →</Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Reset Password Modal */}
      {showResetModal && (
        <ResetPasswordModal onClose={() => setShowResetModal(false)} />
      )}
    </>
  );
}

// Add this component after the Navbar component
function ResetPasswordModal({ onClose }: { onClose: () => void }) {
  const { token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to change password');
      }

      setMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gradient-to-br from-blue-950 to-slate-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-blue-700/50 shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <Key className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Change Password</h2>
          </div>
          <button
            onClick={onClose}
            className="text-blue-400 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        <p className="text-blue-400 text-xs mb-5">
          Update your password to keep your account secure.
        </p>

        {message && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-blue-300 mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
              <input
                type={showCurrentPass ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-blue-900/40 border border-blue-600/30 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-300"
              >
                {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-blue-300 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-blue-900/40 border border-blue-600/30 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                placeholder="Min 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-300"
              >
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-blue-300 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
              <input
                type={showConfirmPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-blue-900/40 border border-blue-600/30 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-300"
              >
                {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-medium text-blue-300 border border-blue-700/50 hover:bg-blue-800/30 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>

        {/* Password requirements hint */}
        <div className="mt-4 pt-3 border-t border-blue-800/50">
          <p className="text-xs text-blue-500">
            Password must be at least 8 characters and include uppercase, number, and special character.
          </p>
        </div>
      </div>
    </div>
  );
}