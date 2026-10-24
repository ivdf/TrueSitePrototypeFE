import { useState, FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get('token') || '';
    const email = searchParams.get('email') || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return setError("Passwords do not match.");
        }

        setLoading(true); setError('');
        try {
            const res = await fetch('http://localhost:8000/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, email, new_password: newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed processing conversion request.');

            setSuccess(true);
            setTimeout(() => navigate('/signin'), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-blue-950/60 backdrop-blur-sm rounded-2xl p-8 border border-blue-800/50 shadow-xl">
                <h1 className="text-2xl font-bold text-white mb-2 text-center">Update Password</h1>
                <p className="text-blue-400 text-xs text-center mb-6">Create and confirm your updated application password credentials.</p>

                {success ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-xl text-emerald-300 text-sm flex gap-3">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p>Password modified successfully. Moving to login screen...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/25 p-4 rounded-xl text-red-300 text-sm flex gap-3">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <p className="whitespace-pre-line">{error}</p>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm text-blue-300 mb-1 font-medium">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                                <input
                                    type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-white bg-blue-900/50 border border-blue-500/30 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-blue-300 mb-1 font-medium">Confirm New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                                <input
                                    type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-white bg-blue-900/50 border border-blue-500/30 outline-none"
                                />
                            </div>
                        </div>
                        <button type="submit" disabled={loading || !token || !email}
                            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 flex justify-center items-center gap-2 hover:opacity-90 transition-opacity">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Adjustment'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}