import { Link, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API } from '../context/AuthContext';

export function VerifyEmailPending() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    setStatus('verifying');
    fetch(`${API}/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Verification failed.');
        setStatus('success');
        setMessage(data.message || 'Email verified successfully.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Verification failed.');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-blue-950/60 backdrop-blur-sm rounded-2xl p-8 border border-blue-800/50 shadow-2xl text-center">

        {status === 'pending' && !token && (
          <>
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Check your inbox</h1>
            <p className="text-blue-300 text-sm mb-6">
              We've sent a verification link to your email address.
              Click the link to activate your account.
            </p>
            <div className="p-4 bg-blue-900/40 border border-blue-700/40 rounded-xl text-left mb-6">
              <p className="text-xs text-blue-300 leading-relaxed">
                <strong className="text-cyan-400">Dev mode:</strong> The verification link
                was printed to the backend terminal. Look for the box that says
                <code className="bg-blue-950/60 px-1 rounded mx-1">📧 EMAIL VERIFICATION LINK</code>
                and copy the URL.
              </p>
            </div>
            <Link
              to="/signin"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              Back to Sign In
            </Link>
          </>
        )}

        {status === 'verifying' && (
          <>
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Verifying your email...</h1>
            <p className="text-blue-300 text-sm">Please wait.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Email verified!</h1>
            <p className="text-blue-300 text-sm mb-6">{message}</p>
            <Link
              to="/signin"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              Sign In Now →
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex p-4 rounded-2xl bg-red-500/20 border border-red-500/30 mb-4">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verification failed</h1>
            <p className="text-red-300 text-sm mb-6">{message}</p>
            <Link
              to="/signin"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-blue-600 to-cyan-600"
            >
              Back to Sign In
            </Link>
          </>
        )}

      </div>
    </div>
  );
}