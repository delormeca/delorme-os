import React from 'react';
import { Box, alpha, useTheme } from '@mui/material';

interface AuthFeatureChipProps {
  icon: React.ReactNode;
  label: string;
  color?: 'primary' | 'success' | 'info' | 'warning' | 'error';
}

export const AuthFeatureChip: React.FC<AuthFeatureChipProps> = ({ 
  icon, 
  label, 
  color = 'primary' 
}) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.5,
        py: 0.75,
        background: alpha(theme.palette[color].main, 0.08),
        border: `1px solid ${alpha(theme.palette[color].main, 0.15)}`,
        borderRadius: `${theme.shape.borderRadius * 2}px`,
        fontSize: "0.8rem",
        fontWeight: 500,
        color: theme.palette[color].main,
        '& .MuiSvgIcon-root': {
          fontSize: "0.9rem",
        },
      }}
    >
      {icon}
      {label}
    </Box>
  );
};

