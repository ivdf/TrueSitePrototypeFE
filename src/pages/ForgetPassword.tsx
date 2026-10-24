import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true); setError(''); setMessage('');
        try {
            const res = await fetch('http://localhost:8000/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to dispatch route.');
            setMessage(data.message);
        } catch (err: any) {
            setError(err.message);
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-blue-950/60 backdrop-blur-sm rounded-2xl p-8 border border-blue-800/50 shadow-xl">
                <div className="text-center mb-6">
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4 shadow-lg">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Reset Password</h1>
                    <p className="text-blue-400 text-sm mt-1">Provide your email to receive recovery parameters.</p>
                </div>

                {message ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-xl text-emerald-300 text-sm flex gap-3">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p>{message}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/25 p-4 rounded-xl text-red-300 text-sm flex gap-3">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm text-blue-300 mb-1.5 font-medium">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                                <input
                                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com" disabled={loading}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm bg-blue-900/50 border border-blue-500/30 outline-none focus:border-cyan-500/50 transition-colors"
                                />
                            </div>
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center gap-2 transition-all hover:opacity-90">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                        </button>
                    </form>
                )}
                <p className="text-center text-sm text-blue-400 mt-6">
                    <Link to="/signin" className="text-cyan-400 hover:text-white font-semibold transition-colors">← Return to Sign In</Link>
                </p>
            </div>
        </div>
    );
}