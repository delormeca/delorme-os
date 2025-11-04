import { Theme, Components } from '@mui/material/styles';
import { gray, orange, green, red, brand } from '../themePrimitives';

export const feedbackCustomizations: Components<Theme> = {
  MuiAlert: {
    styleOverrides: {
      root: ({ theme, ownerState }) => {
        let backgroundColor;
        let borderColor;
        let iconColor;
        const textColor = "#FFFFFF"; // Set text color to white for all alerts

        // Define darker background colors to work with white text
        switch (ownerState.severity) {
          case 'success':
            backgroundColor = green[700];
            borderColor = green[800];
            iconColor = green[300];
            break;
          case 'error':
            backgroundColor = red[700];
            borderColor = red[800];
            iconColor = red[300];
            break;
          case 'warning':
            backgroundColor = orange[700];
            borderColor = orange[800];
            iconColor = orange[300];
            break;
          case 'info':
            backgroundColor = brand[700];
            borderColor = brand[800];
            iconColor = brand[300];
            break;
          default:
            backgroundColor = gray[700];
            borderColor = gray[800];
            iconColor = gray[300];
            break;
        }

        return {
          borderRadius: 10,
          backgroundColor,
          color: textColor, // Set text color to white
          border: `1px solid ${borderColor}`,
          '& .MuiAlert-icon': {
            color: iconColor,
          },
          '& .MuiAlert-message': {
            color: textColor,
          },
          ...theme.applyStyles('dark', {
            backgroundColor,
            border: `1px solid ${borderColor}`,
            color: textColor, // Ensure white text color in dark mode
            '& .MuiAlert-message': {
              color: textColor,
            },
          }),
        };
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiDialog-paper': {
          borderRadius: '10px',
          border: '1px solid',
          borderColor: theme.palette.divider,
        },
      }),
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: ({ theme }) => ({
        height: 8,
        borderRadius: 8,
        backgroundColor: gray[200],
        ...theme.applyStyles('dark', {
          backgroundColor: gray[800],
        }),
      }),
    },
  },
};
