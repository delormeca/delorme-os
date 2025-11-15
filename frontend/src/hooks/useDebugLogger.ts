import { useState, useEffect, useCallback, useRef } from 'react';
import type { DebugLogEntry } from '@/components/DebugPanel';

export const useDebugLogger = () => {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const pollCountRef = useRef<number>(0);
  const lastPollTimeRef = useRef<number>(Date.now());

  const addLog = useCallback((
    type: DebugLogEntry['type'],
    message: string,
    data?: any
  ) => {
    const entry: DebugLogEntry = {
      timestamp: new Date(),
      type,
      message,
      data,
    };

    setLogs((prev) => [...prev, entry]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    pollCountRef.current = 0;
    lastPollTimeRef.current = Date.now();
  }, []);

  // Intercept console methods
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.log = (...args) => {
      originalConsoleLog(...args);
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      addLog('console', message, args.length === 1 && typeof args[0] === 'object' ? args[0] : undefined);
    };

    console.error = (...args) => {
      originalConsoleError(...args);
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      addLog('error', message, args.length === 1 && typeof args[0] === 'object' ? args[0] : undefined);
    };

    console.warn = (...args) => {
      originalConsoleWarn(...args);
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      addLog('event', message, args.length === 1 && typeof args[0] === 'object' ? args[0] : undefined);
    };

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, [addLog]);

  // Track status polling
  const logStatusPoll = useCallback((crawlRunId: string, status: any) => {
    pollCountRef.current += 1;
    const now = Date.now();
    const intervalMs = now - lastPollTimeRef.current;
    lastPollTimeRef.current = now;

    addLog(
      'api',
      `Status poll #${pollCountRef.current} (interval: ${(intervalMs / 1000).toFixed(1)}s)`,
      {
        crawlRunId,
        pollCount: pollCountRef.current,
        intervalMs,
        status: status?.status,
        progress: status?.progress,
        successful: status?.successful_count,
        failed: status?.failed_count,
      }
    );
  }, [addLog]);

  // Track API calls
  const logApiCall = useCallback((method: string, url: string, status?: number, data?: any) => {
    addLog(
      'api',
      `${method} ${url}${status ? ` → ${status}` : ''}`,
      data
    );
  }, [addLog]);

  // Track events
  const logEvent = useCallback((event: string, data?: any) => {
    addLog('event', event, data);
  }, [addLog]);

  // Track errors
  const logError = useCallback((error: string, data?: any) => {
    addLog('error', error, data);
  }, [addLog]);

  return {
    logs,
    addLog,
    clearLogs,
    logStatusPoll,
    logApiCall,
    logEvent,
    logError,
    pollCount: pollCountRef.current,
  };
};
