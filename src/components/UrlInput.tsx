import { useState, KeyboardEvent } from 'react';
import { Search, Loader2, Link } from 'lucide-react';

interface UrlInputProps { onAnalyze: (url: string) => void; isLoading: boolean; disabled?: boolean; }

export function UrlInput({ onAnalyze, isLoading, disabled }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const submit = () => { if (url.trim() && !isLoading && !disabled) onAnalyze(url.trim()); };
  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') submit(); };
  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
          <input type="text" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={handleKey}
            placeholder="Enter URL (e.g., https://example.com)" disabled={isLoading || disabled}
            className="url-input w-full pl-12 pr-4 py-4 bg-blue-900/50 border border-blue-700/50 rounded-xl text-white placeholder-blue-500 text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
        </div>
        <button onClick={submit} disabled={isLoading || !url.trim() || disabled}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-blue-900 disabled:to-blue-900 disabled:cursor-not-allowed rounded-xl font-semibold transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
          {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />Analyzing...</> : <><Search className="w-5 h-5" />Analyze</>}
        </button>
      </div>
      <p className="text-xs text-blue-600 mt-2 ml-1">Press <kbd className="px-1.5 py-0.5 rounded text-xs bg-blue-900/60 border border-blue-700/50">Enter</kbd> to analyze instantly</p>
    </div>
  );
}
