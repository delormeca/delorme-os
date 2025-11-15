import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Collapse,
  Chip,
  Stack,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  BugReport,
  ExpandMore,
  ExpandLess,
  Clear,
  RadioButtonChecked,
} from '@mui/icons-material';

export interface DebugLogEntry {
  timestamp: Date;
  type: 'api' | 'status' | 'console' | 'event' | 'error';
  message: string;
  data?: any;
}

interface DebugPanelProps {
  logs: DebugLogEntry[];
  onClear?: () => void;
  maxLogs?: number;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  logs,
  onClear,
  maxLogs = 100,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const displayLogs = logs.slice(-maxLogs);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const getTypeColor = (type: DebugLogEntry['type']) => {
    switch (type) {
      case 'api':
        return theme.palette.info.main;
      case 'status':
        return theme.palette.success.main;
      case 'console':
        return theme.palette.grey[500];
      case 'event':
        return theme.palette.warning.main;
      case 'error':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getTypeIcon = (type: DebugLogEntry['type']) => {
    return <RadioButtonChecked sx={{ fontSize: 12 }} />;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  const formatData = (data: any) => {
    if (!data) return null;
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: { xs: '90%', md: 600 },
        maxHeight: expanded ? '60vh' : 'auto',
        zIndex: 9999,
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: alpha(theme.palette.background.paper, 0.98),
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          backgroundColor: theme.palette.mode === 'dark'
            ? alpha(theme.palette.primary.main, 0.15)
            : alpha(theme.palette.primary.main, 0.1),
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BugReport sx={{ fontSize: 20, color: theme.palette.primary.main }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Debug Logger
          </Typography>
          <Chip
            label={displayLogs.length}
            size="small"
            color="primary"
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
        </Box>
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" onClick={onClear} title="Clear logs">
            <Clear sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
          </IconButton>
        </Stack>
      </Box>

      {/* Logs Container */}
      <Collapse in={expanded}>
        <Box
          ref={logContainerRef}
          sx={{
            maxHeight: 'calc(60vh - 60px)',
            overflowY: 'auto',
            px: 2,
            py: 1,
            backgroundColor: theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.default, 0.5)
              : theme.palette.background.default,
          }}
        >
          {displayLogs.length === 0 ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', textAlign: 'center', py: 4 }}
            >
              No logs yet. Waiting for activity...
            </Typography>
          ) : (
            <Stack spacing={1}>
              {displayLogs.map((log, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: alpha(getTypeColor(log.type), 0.05),
                    borderLeft: `3px solid ${getTypeColor(log.type)}`,
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: log.data ? 0.5 : 0,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: getTypeColor(log.type),
                      }}
                    >
                      {getTypeIcon(log.type)}
                    </Box>
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '0.7rem',
                        color: theme.palette.text.secondary,
                        fontFamily: 'monospace',
                      }}
                    >
                      {formatTime(log.timestamp)}
                    </Typography>
                    <Chip
                      label={log.type.toUpperCase()}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        backgroundColor: alpha(getTypeColor(log.type), 0.2),
                        color: getTypeColor(log.type),
                      }}
                    />
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '0.75rem',
                        flex: 1,
                        fontFamily: 'monospace',
                        wordBreak: 'break-word',
                      }}
                    >
                      {log.message}
                    </Typography>
                  </Box>
                  {log.data && (
                    <Box
                      sx={{
                        mt: 0.5,
                        pl: 2,
                        fontSize: '0.7rem',
                        color: theme.palette.text.secondary,
                        backgroundColor: alpha(theme.palette.background.paper, 0.5),
                        borderRadius: 0.5,
                        p: 0.5,
                        overflow: 'auto',
                        maxHeight: 200,
                      }}
                    >
                      <pre style={{ margin: 0, fontFamily: 'monospace' }}>
                        {formatData(log.data)}
                      </pre>
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Collapse>

      {/* Footer with stats */}
      {expanded && displayLogs.length > 0 && (
        <Box
          sx={{
            px: 2,
            py: 0.5,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            backgroundColor: alpha(theme.palette.background.default, 0.5),
          }}
        >
          <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem />}>
            <Typography variant="caption" color="text.secondary">
              API: {displayLogs.filter((l) => l.type === 'api').length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Status: {displayLogs.filter((l) => l.type === 'status').length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Events: {displayLogs.filter((l) => l.type === 'event').length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Errors: {displayLogs.filter((l) => l.type === 'error').length}
            </Typography>
          </Stack>
        </Box>
      )}
    </Paper>
  );
};

export default DebugPanel;
