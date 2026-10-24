export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

export type LogCallback = (level: LogEntry['level'], message: string) => void;

export function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function getLogColor(level: LogEntry['level']): string {
  switch (level) {
    case 'info':
      return 'text-blue-400';
    case 'warning':
      return 'text-yellow-400';
    case 'error':
      return 'text-red-400';
    case 'success':
      return 'text-green-400';
    default:
      return 'text-slate-400';
  }
}

export function getLogPrefix(level: LogEntry['level']): string {
  switch (level) {
    case 'info':
      return '[INFO]';
    case 'warning':
      return '[WARN]';
    case 'error':
      return '[ERROR]';
    case 'success':
      return '[OK]';
    default:
      return '[LOG]';
  }
}
