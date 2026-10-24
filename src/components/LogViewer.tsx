import { useRef, useEffect } from 'react';
import { LogEntry, formatTimestamp, getLogColor, getLogPrefix } from '../utils/logger';
import { Terminal } from 'lucide-react';

export function LogViewer({ logs }: { logs: LogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs]);
  if (logs.length === 0) return (
    <div className="bg-blue-950/80 rounded-lg p-6 border border-blue-800/50 flex flex-col items-center justify-center gap-3 min-h-[140px]">
      <Terminal className="w-7 h-7 text-blue-700" />
      <p className="text-blue-500 text-sm">Waiting for analysis...</p>
    </div>
  );
  return (
    <div ref={ref} className="bg-blue-950/80 rounded-lg p-4 border border-blue-800/50 font-mono text-xs overflow-y-auto" style={{ maxHeight: '220px' }}>
      {logs.map((log, i) => (
        <div key={i} className="flex gap-3 py-0.5 hover:bg-blue-800/20 px-2 -mx-2 rounded">
          <span className="text-blue-700 flex-shrink-0 select-none">{formatTimestamp(log.timestamp)}</span>
          <span className={`flex-shrink-0 font-semibold ${getLogColor(log.level)}`}>{getLogPrefix(log.level)}</span>
          <span className="text-blue-200">{log.message}</span>
        </div>
      ))}
    </div>
  );
}
