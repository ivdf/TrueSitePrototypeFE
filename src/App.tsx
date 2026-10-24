import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { UrlInput } from './components/UrlInput';
import { LogViewer } from './components/LogViewer';
import { Navbar } from './components/Navbar';
import { SignIn } from './pages/SignIn';
import { VerifyEmailPending } from './pages/VerifyEmailPending';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthProvider, useAuth, API } from './context/AuthContext';
import { LogEntry } from './utils/logger';
import { ForgotPassword } from './pages/ForgetPassword';
import { ResetPassword } from './pages/ResetPassword';
import { ChangePassword } from './pages/ChangePassword';
import { ForcePasswordGuard } from './components/ForcePasswordGuard';

import {
  Shield, AlertTriangle, XCircle, Globe, Info,
  Lock, Brain, History, Trash2, ExternalLink, LogIn,
  Clock, Key, Hash, CheckSquare, Award,
} from 'lucide-react';

interface HistoryEntry {
  id: number; url: string; result: string;
  confidence: string; risk_score: string; analyzed_at: string;
}

const RESULT_DOTS: Record<string, string> = {
  legitimate: 'bg-emerald-400',
  suspicious: 'bg-yellow-400',
  scam: 'bg-red-400',
};
const RESULT_COLORS: Record<string, string> = {
  legitimate: 'text-emerald-400',
  suspicious: 'text-yellow-400',
  scam: 'text-red-400',
};

/* ── Analyzer page ───────────────────────────────────────────────────── */
function AnalyzerPage() {
  const { user, token, usage, refreshUsage } = useAuth();
  const navigate = useNavigate();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');

  const reachedLimit = !usage.unlimited && usage.remaining <= 0;

  const addLog = (level: LogEntry['level'], message: string) =>
    setLogs(prev => [...prev, { timestamp: new Date(), level, message }]);

  const loadHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/analysis/history?limit=8`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setHistory(await res.json());
    } catch { /* ignore */ }
  };

  useEffect(() => { if (token) loadHistory(); }, [token]);

  const handleAnalyze = async (inputUrl: string) => {
    if (!user || !token) { navigate('/signin'); return; }
    if (reachedLimit) { setError('Daily limit reached. Resets at midnight UTC.'); return; }

    setIsAnalyzing(true); setResult(null); setError(null); setLogs([]); setCurrentUrl(inputUrl);

    addLog('info', `Starting analysis for: ${inputUrl}`);
    addLog('info', 'Parsing domain information...');
    addLog('info', 'Extracting SSL certificate metadata...');
    addLog('info', 'Running ML classifier...');

    try {
      const res = await fetch(`${API}/api/analysis/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: inputUrl }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Analysis failed.'); }
      const data = await res.json();
      setResult(data);
      addLog('info', `Result: ${data.result.toUpperCase()} — confidence ${Math.round(data.confidence * 100)}%`);
      addLog('info', 'Analysis saved to history.');
      await refreshUsage();
      await loadHistory();
    } catch (err: any) {
      const msg = err.message || 'Unknown error';
      setError(msg); addLog('error', `Failed: ${msg}`);
    } finally { setIsAnalyzing(false); }
  };

  const examples = [
    { url: 'https://google.com', label: '✓ google.com' },
    { url: 'https://github.com', label: '✓ github.com' },
    { url: 'https://paypa1-secure.verify-account.xyz', label: '⚠ phishing example' },
    { url: 'http://192.168.1.1/login', label: '✗ IP login' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-cyan-600/20" />
        <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-16 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-2xl shadow-blue-500/40 mb-6">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-cyan-300 bg-clip-text text-transparent">
            TrueSite
          </h1>
          <p className="text-lg md:text-xl text-blue-200 max-w-2xl mx-auto mb-6">
            SSL certificate analysis powered by machine learning — detect phishing through certificate metadata.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            {[
              { icon: <Clock className="w-4 h-4 text-blue-300" />, label: 'Certificate Age' },
              { icon: <Hash className="w-4 h-4 text-cyan-400" />, label: 'SAN Count' },
              { icon: <Key className="w-4 h-4 text-sky-400" />, label: 'Key Length' },
              { icon: <Globe className="w-4 h-4 text-blue-300" />, label: 'Wildcard Usage' },
              { icon: <Award className="w-4 h-4 text-cyan-400" />, label: 'Validation Type' },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-2 px-4 py-2 bg-blue-900/60 rounded-full border border-blue-700/50">
                {b.icon}<span className="text-sm text-blue-200">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 -mt-4">
        {!user && (
          <section className="mb-8">
            <div className="bg-blue-950/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-800/50 text-center">
              <LogIn className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="font-bold text-white text-lg mb-2">Sign in to analyze URLs</h3>
              <p className="text-blue-400 text-sm mb-6">Create a free account to get 5 analyses per day.</p>
              <div className="flex justify-center gap-3">
                <Link to="/signin" className="px-5 py-2 rounded-xl text-sm font-bold text-blue-300 hover:text-white border border-blue-700/50 transition-colors">Sign In</Link>
                <Link to="/register" className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600">Create Free Account →</Link>
              </div>
            </div>
          </section>
        )}

        {user && usage.unlimited && (
          <div className="mb-6 p-3 rounded-xl flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25">
            <p className="text-sm text-emerald-300">∞ Unlimited analyses (Admin)</p>
          </div>
        )}

        {user && !usage.unlimited && usage.remaining <= 2 && (
          <div className={`mb-6 p-3 rounded-xl flex items-center justify-between gap-3 ${reachedLimit ? 'bg-red-500/10 border border-red-500/25' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
            <p className={`text-sm ${reachedLimit ? 'text-red-300' : 'text-yellow-300'}`}>
              {reachedLimit
                ? '🚫 Daily limit reached. Resets at midnight UTC.'
                : `⚡ ${usage.remaining} free ${usage.remaining === 1 ? 'analysis' : 'analyses'} remaining today.`}
            </p>
          </div>
        )}

        <section className="mb-8">
          <div className="bg-blue-950/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-800/50 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse inline-block" />
              Enter URL to Analyze
              {user && (
                <span className="ml-auto text-xs text-blue-500 font-normal">
                  {usage.unlimited
                    ? `${usage.used} used today · Unlimited`
                    : `${usage.used} / ${usage.limit} used today`}
                </span>
              )}
            </h2>
            <UrlInput onAnalyze={handleAnalyze} isLoading={isAnalyzing} disabled={!user || reachedLimit} />
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-blue-400">Try examples:</span>
              {examples.map(ex => (
                <button key={ex.url} onClick={() => handleAnalyze(ex.url)}
                  disabled={isAnalyzing || !user || reachedLimit}
                  className="text-sm px-3 py-1.5 bg-blue-800/50 hover:bg-blue-700/50 border border-blue-600/50 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-blue-300">
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error && (
          <section className="mb-8">
            <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300 text-sm">Error</p>
                <p className="text-red-200/80 text-sm">{error}</p>
              </div>
            </div>
          </section>
        )}

        {result && (
          <section className="mb-8">
            <ResultsDisplay result={result} currentUrl={currentUrl} />
          </section>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-950/60 backdrop-blur-sm rounded-2xl p-5 border border-blue-800/50">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-white">
              <AlertTriangle className="w-4 h-4 text-cyan-400" />Analysis Log
            </h2>
            <LogViewer logs={logs} />
          </div>
          <div className="bg-blue-950/60 backdrop-blur-sm rounded-2xl p-5 border border-blue-800/50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold flex items-center gap-2 text-white">
                <History className="w-4 h-4 text-blue-400" />Recent Checks
              </h2>
              {history.length > 0 && (
                <button onClick={() => setHistory([])} className="text-blue-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-7 h-7 mx-auto mb-2 opacity-30 text-blue-700" />
                <p className="text-blue-700 text-sm">No analysis history found</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {history.map(h => (
                  <button key={h.id} onClick={() => handleAnalyze(h.url)}
                    disabled={isAnalyzing || reachedLimit}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-800/30 transition-all text-left group disabled:opacity-40">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${RESULT_DOTS[h.result.toLowerCase()] || 'bg-blue-400'}`} />
                    <span className="flex-1 text-xs truncate font-mono text-blue-300">{h.url.replace(/^https?:\/\//, '').slice(0, 38)}</span>
                    <span className={`text-xs flex-shrink-0 ${RESULT_COLORS[h.result.toLowerCase()] || 'text-blue-400'}`}>{h.result}</span>
                    <ExternalLink className="w-3 h-3 text-blue-600 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-700/40 rounded-xl p-4 flex items-start gap-3 mb-8">
          <AlertTriangle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-200/80">
            <span className="font-semibold text-cyan-400">Disclaimer: </span>
            TrueSite is a BTech graduation project. Always verify suspicious URLs through multiple sources before sharing personal information.
          </p>
        </div>
      </main>

      <footer className="border-t border-blue-800/50">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-blue-400" /><span className="font-bold text-white">TrueSite</span></div>
          <p className="text-xs text-blue-500 text-center">BTech Graduation Project · University of Technology and Applied Sciences · 2026</p>
          <p className="text-xs text-blue-700">FastAPI + PostgreSQL + React</p>
        </div>
      </footer>
    </div>
  );
}

/* ── Results display ─────────────────────────────────────────────────── */
function ResultsDisplay({ result, currentUrl }: { result: any; currentUrl: string }) {
  const { result: verdict, confidence, risk_score, details } = result;
  const { domain, ssl, features, classification } = details;

  // Whether the certificate was actually retrievable.
  // Fallback to true for older API responses that don't include the flag,
  // so nothing breaks if the backend hasn't been updated yet.
  const certAvailable: boolean = ssl?.is_available !== false;

  type Cfg = { textColor: string; border: string; bg: string; label: string; gradient: string };
  const cfgMap: Record<string, Cfg> = {
    legitimate: { textColor: 'text-green-400', border: 'border-green-500/30', bg: 'bg-green-500/10', label: 'LEGITIMATE', gradient: 'from-green-500 to-emerald-500' },
    suspicious: { textColor: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', label: 'SUSPICIOUS', gradient: 'from-yellow-500 to-orange-500' },
    scam: { textColor: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10', label: 'POTENTIAL SCAM', gradient: 'from-red-500 to-rose-500' },
  };
  const cfg = cfgMap[verdict] ?? cfgMap.suspicious;

  const confPct = Math.round(confidence * 100);
  const riskPct = Math.round(risk_score * 100);

  // Algorithm-aware key strength (only meaningful if cert is available)
  const keyAlgo = features?.key_algorithm ?? 'RSA';
  const keyBits = features?.key_length ?? 0;
  const keyStrong = keyAlgo === 'EC' ? keyBits >= 256 : keyBits >= 2048;
  const keyDetail = !keyStrong
    ? 'Weak — below standard'
    : keyAlgo === 'EC'
      ? `Strong (EC ${keyBits}-bit)`
      : keyBits === 2048
        ? 'Standard (RSA 2048)'
        : `Strong (RSA ${keyBits})`;

  return (
    <div className="space-y-6">
      {/* Verdict banner */}
      <div className={`p-6 rounded-2xl ${cfg.bg} border ${cfg.border}`}>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className={`p-4 rounded-2xl ${cfg.bg} border ${cfg.border}`}>
            {verdict === 'legitimate'
              ? <Shield className={`w-12 h-12 ${cfg.textColor}`} />
              : verdict === 'suspicious'
                ? <AlertTriangle className={`w-12 h-12 ${cfg.textColor}`} />
                : <XCircle className={`w-12 h-12 ${cfg.textColor}`} />}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className={`text-3xl font-bold ${cfg.textColor}`}>{cfg.label}</h3>
            <p className="text-blue-200 mt-1 text-sm font-mono truncate max-w-sm">{currentUrl}</p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-blue-400 text-xs mb-1">Confidence</p>
              <p className={`text-3xl font-bold ${cfg.textColor}`}>{confPct}%</p>
            </div>
            <div className="text-center">
              <p className="text-blue-400 text-xs mb-1">Risk</p>
              <p className={`text-3xl font-bold ${riskPct > 50 ? 'text-red-400' : riskPct > 25 ? 'text-yellow-400' : 'text-green-400'}`}>{riskPct}%</p>
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[
            { label: 'Confidence', pct: confPct, grad: cfg.gradient },
            { label: 'Risk Score', pct: riskPct, grad: riskPct > 50 ? 'from-red-500 to-rose-500' : riskPct > 25 ? 'from-yellow-500 to-orange-500' : 'from-green-500 to-emerald-500' },
          ].map(b => (
            <div key={b.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-blue-400">{b.label}</span>
                <span className={cfg.textColor}>{b.pct}%</span>
              </div>
              <div className="h-2 bg-blue-900/60 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${b.grad} transition-all duration-500`} style={{ width: `${b.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certificate features — OR unavailable banner */}
      <div>
        <h4 className="font-semibold mb-4 flex items-center gap-2 text-white">
          <Brain className="w-5 h-5 text-cyan-400" />Certificate Feature Analysis
        </h4>

        {!certAvailable ? (
          <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-6 text-center">
            <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-red-300 font-semibold mb-1">Certificate not retrievable</p>
            <p className="text-red-200/70 text-sm max-w-md mx-auto">
              We could not obtain a TLS certificate from this host. The server may be
              offline, blocking connections, or presenting a malformed certificate.
              No certificate features could be measured.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <FeatureCard
              icon={<Clock className="w-5 h-5" />}
              no="1" label="Certificate Age"
              value={`${features?.cert_age_days ?? 0} days`}
              status={features?.cert_age_days < 30 ? 'error' : features?.cert_age_days < 90 ? 'warning' : 'ok'}
              detail={features?.cert_age_days < 30 ? 'Very new' : features?.cert_age_days < 90 ? 'Relatively new' : 'Established'}
            />
            <FeatureCard
              icon={<Hash className="w-5 h-5" />}
              no="2" label="SAN Count"
              value={`${features?.san_count ?? 0} name${features?.san_count !== 1 ? 's' : ''}`}
              status={features?.san_count <= 1 ? 'warning' : 'ok'}
              detail={features?.san_count <= 1 ? 'Minimal coverage' : features?.san_count <= 3 ? 'Standard' : 'Broad coverage'}
            />
            <FeatureCard
              icon={<Key className="w-5 h-5" />}
              no="3" label="Key Length"
              value={`${keyBits} bits`}
              status={keyStrong ? 'ok' : 'error'}
              detail={keyDetail}
            />
            <FeatureCard
              icon={<Globe className="w-5 h-5" />}
              no="4" label="Wildcard Usage"
              value={features?.is_wildcard ? 'Yes (*.domain)' : 'No'}
              status={features?.is_wildcard ? 'warning' : 'ok'}
              detail={features?.is_wildcard ? 'Wildcard detected' : 'No wildcard'}
            />
            <FeatureCard
              icon={<Award className="w-5 h-5" />}
              no="5" label="Validation Type"
              value={features?.validation_type ?? 'DV'}
              status={features?.validation_type === 'EV' || features?.validation_type === 'OV' ? 'ok' : 'warning'}
              detail={features?.validation_type === 'EV' ? 'Extended Validation' : features?.validation_type === 'OV' ? 'Organisation Validated' : 'Domain Validated only'}
            />
          </div>
        )}
      </div>

      {/* Domain + SSL info */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-950/60 rounded-xl p-5 border border-blue-800/50">
          <h4 className="font-semibold mb-4 flex items-center gap-2 text-white"><Globe className="w-5 h-5 text-blue-400" />Domain Information</h4>
          {[
            { label: 'Full Domain', value: domain?.full_domain || '-', mono: true },
            { label: 'Protocol', value: (domain?.protocol || '').toUpperCase(), status: domain?.protocol === 'https' ? 'ok' : 'warning' },
            { label: 'TLD', value: `.${domain?.tld || ''}` },
            { label: 'Subdomains', value: domain?.subdomain || 'None', status: (domain?.subdomain_count || 0) > 2 ? 'warning' : 'ok' },
            { label: 'IP Address', value: domain?.is_ip_address ? 'Yes' : 'No', status: domain?.is_ip_address ? 'error' : 'ok' },
            { label: 'Entropy', value: (domain?.entropy || 0).toFixed(2), status: (domain?.entropy || 0) > 3.8 ? 'warning' : 'ok' },
          ].map(r => <InfoRow key={r.label} label={r.label} value={String(r.value)} status={r.status} mono={r.mono} />)}
          {domain?.suspicious_keywords?.length > 0 && (
            <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-xs text-yellow-400 mb-2 font-medium">⚠️ Suspicious Keywords:</p>
              <div className="flex flex-wrap gap-1">
                {domain.suspicious_keywords.map((kw: string) => (
                  <span key={kw} className="px-2 py-0.5 bg-yellow-500/20 rounded text-xs text-yellow-300">{kw}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-950/60 rounded-xl p-5 border border-blue-800/50">
          <h4 className="font-semibold mb-4 flex items-center gap-2 text-white"><Lock className="w-5 h-5 text-cyan-400" />SSL Certificate</h4>
          <div className="mb-4">
            {!certAvailable ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                ⚠ Certificate not retrievable
              </span>
            ) : ssl?.is_valid ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                ✓ Valid Certificate
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                ✗ Invalid Certificate
              </span>
            )}
          </div>
          {[
            { label: 'Issuer', value: certAvailable ? (ssl?.issuer || '-') : 'Not retrievable' },
            { label: 'Protocol', value: certAvailable ? (ssl?.protocol || '-') : 'N/A' },
            { label: 'Trusted CA', value: certAvailable ? (ssl?.is_trusted_ca ? 'Yes' : 'No') : 'N/A',
              status: certAvailable ? (ssl?.is_trusted_ca ? 'ok' : 'error') : 'error' },
            { label: 'Days Until Expiry', value: certAvailable ? `${ssl?.days_until_expiry || 0} days` : 'N/A',
              status: certAvailable ? ((ssl?.days_until_expiry || 0) < 30 ? 'warning' : 'ok') : 'error' },
            { label: 'Revoked', value: certAvailable ? (ssl?.is_revoked ? 'Yes' : 'No') : 'N/A',
              status: certAvailable ? (ssl?.is_revoked ? 'error' : 'ok') : 'error' },
          ].map(r => <InfoRow key={r.label} label={r.label} value={String(r.value)} status={r.status} />)}
        </div>
      </div>

      {/* Analysis summary */}
      <div className="bg-blue-950/60 rounded-xl p-5 border border-blue-800/50">
        <h4 className="font-semibold mb-4 flex items-center gap-2 text-white">
          <CheckSquare className="w-5 h-5 text-emerald-400" />Analysis Summary
        </h4>
        <ul className="space-y-2">
          {classification?.reasons?.map((r: string, i: number) => (
            <li key={i} className="flex items-start gap-3 py-1">
              <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${r.startsWith('✓') ? 'bg-green-400' : r.startsWith('⚠') ? 'bg-yellow-400' : 'bg-blue-400'}`} />
              <span className="text-sm text-blue-200">{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── Feature card ────────────────────────────────────────────────────── */
function FeatureCard({ icon, no, label, value, status, detail }: {
  icon: React.ReactNode; no: string; label: string;
  value: string; status: 'ok' | 'warning' | 'error'; detail: string;
}) {
  const styles = {
    ok: { bg: 'bg-green-500/8  border-green-500/20', text: 'text-green-400', dot: 'bg-green-400' },
    warning: { bg: 'bg-yellow-500/8 border-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
    error: { bg: 'bg-red-500/8    border-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
  }[status];

  return (
    <div className={`p-4 rounded-xl border text-center ${styles.bg}`}>
      <div className={`flex items-center justify-center mb-2 ${styles.text}`}>{icon}</div>
      <p className="text-blue-500 text-xs font-semibold mb-1">Feature {no}</p>
      <p className="text-white text-xs font-bold mb-2">{label}</p>
      <p className={`text-base font-bold ${styles.text} mb-1`}>{value}</p>
      <div className="flex items-center justify-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
        <span className={`text-xs ${styles.text} opacity-80`}>{detail}</span>
      </div>
    </div>
  );
}

/* ── Info row ────────────────────────────────────────────────────────── */
function InfoRow({ label, value, status = 'neutral', mono = false }: {
  label: string; value: string; status?: string; mono?: boolean;
}) {
  const colors: Record<string, string> = { ok: 'text-green-400', warning: 'text-yellow-400', error: 'text-red-400', neutral: 'text-blue-200' };
  return (
    <div className="flex justify-between items-center py-2 border-b border-blue-800/40 last:border-0">
      <span className="text-blue-400 text-sm">{label}</span>
      <span className={`${colors[status] ?? colors['neutral']} ${mono ? 'font-mono text-xs' : 'text-sm'} max-w-[200px] truncate`}>{value}</span>
    </div>
  );
}

/* ── Routes ──────────────────────────────────────────────────────────── */
function AppShell() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmailPending />} />
      <Route path="/verify-email-pending" element={<VerifyEmailPending />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/admin" element={
        <ForcePasswordGuard>
          <AdminDashboard />
        </ForcePasswordGuard>
      } />
      <Route path="/" element={
        <ForcePasswordGuard>
          <><Navbar /><AnalyzerPage /></>
        </ForcePasswordGuard>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}