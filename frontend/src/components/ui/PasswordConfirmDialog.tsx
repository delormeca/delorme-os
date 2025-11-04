import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { Lock } from '@mui/icons-material';

interface PasswordConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: (password: string) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

const PasswordConfirmDialog: React.FC<PasswordConfirmDialogProps> = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading = false,
  error = null,
}) => {
  const [password, setPassword] = useState('');

  const handleConfirm = async () => {
    if (!password.trim()) {
      return;
    }
    await onConfirm(password);
  };

  const handleClose = () => {
    setPassword('');
    onCancel();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && password.trim() && !loading) {
      handleConfirm();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Lock color="error" />
          {title}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 3 }}>
          {message}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          autoFocus
          type="password"
          label="Your Password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          helperText="Enter your password to confirm this action"
          error={!!error}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
          disabled={!password.trim() || loading}
        >
          {loading ? 'Deleting...' : 'Confirm Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordConfirmDialog;
