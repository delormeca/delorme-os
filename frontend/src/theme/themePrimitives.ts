import { createTheme, alpha, Shadows, PaletteMode } from '@mui/material/styles';

declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    highlighted: true;
  }
}
declare module '@mui/material/styles/createPalette' {
  interface ColorRange {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  }

  interface PaletteColor extends ColorRange {}

  interface Palette {
    baseShadow: string;
  }
}

const defaultTheme = createTheme();

const customShadows: Shadows = [...defaultTheme.shadows];

// 🌿 Brand Greens
export const brand = {
  50: '#f4ffd1',   // Pale Green (lightest)
  100: '#e8f9b8',  // Interpolated
  200: '#d8f3a0',  // Interpolated
  300: '#bcd890',  // Soft Moss
  400: '#a3c272',  // Interpolated
  500: '#8aae5a',  // Natural Green (MAIN)
  600: '#6f8f47',  // Interpolated
  700: '#556f35',  // Interpolated
  800: '#3d5025',  // Interpolated
  900: '#303815',  // Forest Base (darkest)
};

// ⚪ Neutrals (Notion-style grays)
export const gray = {
  50: '#fbfbf7',   // Off White (background)
  100: '#f2f3ef',  // Mist
  200: '#e1e1dc',  // Soft Gray (borders)
  300: '#d0d0ca',  // Interpolated
  400: '#a8a9a3',  // Interpolated
  500: '#6c6f66',  // Medium Gray (secondary text)
  600: '#54564f',  // Interpolated
  700: '#3d3f39',  // Interpolated
  800: '#2a2c26',  // Interpolated
  900: '#20231d',  // Charcoal (primary text)
};

// ✅ Success (Functional)
export const green = {
  50: '#e8f5e9',
  100: '#c8e6c9',
  200: '#a5d6a7',
  300: '#81c784',
  400: '#6ca36f',  // Main success color
  500: '#6ca36f',
  600: '#5a8b5d',
  700: '#4a734c',
  800: '#3a5c3b',
  900: '#2d4a2e',
};

// ⚠️ Warning (Functional)
export const orange = {
  50: '#fef9e7',
  100: '#fdf3d0',
  200: '#fbedb9',
  300: '#f9e7a2',
  400: '#e4c468',  // Main warning color
  500: '#e4c468',
  600: '#c9ac5a',
  700: '#a88f4a',
  800: '#87723a',
  900: '#6a592d',
};

// 🎨 Accent 1: Dusty Blue
export const blue = {
  50: '#e8f2ff',
  100: '#d1e5ff',
  200: '#bad8ff',
  300: '#a9c8ff',  // Main accent (Dusty Blue)
  400: '#92b8ff',
  500: '#7ba8ff',
  600: '#6498e8',
  700: '#4d88d0',
  800: '#3678b8',
  900: '#1f68a0',
};

// 🧡 Accent 2: Clay Coral
export const coral = {
  50: '#fef5f2',
  100: '#fce9e4',
  200: '#f9dcd6',
  300: '#e7a18e',  // Main accent (Clay Coral)
  400: '#df8b76',
  500: '#d7755e',
  600: '#c5654f',
  700: '#b35540',
  800: '#a14531',
  900: '#8f3522',
};

// 💛 Accent 3: Golden Beige
export const beige = {
  50: '#fefcf5',
  100: '#fdf9eb',
  200: '#fcf5e1',
  300: '#f6e5b2',  // Main accent (Golden Beige)
  400: '#f0d89a',
  500: '#eaca82',
  600: '#d8b870',
  700: '#c6a65e',
  800: '#b4944c',
  900: '#a2823a',
};

// ❌ Error (Functional)
export const red = {
  50: '#fdeaea',
  100: '#fbd4d4',
  200: '#f9bebe',
  300: '#d26666',  // Main error color
  400: '#c75555',
  500: '#bc4444',
  600: '#a93b3b',
  700: '#963232',
  800: '#832929',
  900: '#702020',
};

// 💙 Info (Functional)
export const purple = {
  50: '#e8f1fc',
  100: '#d1e3f9',
  200: '#bad5f6',
  300: '#6c9ee8',  // Main info color
  400: '#5a8ed9',
  500: '#487eca',
  600: '#3f6eb5',
  700: '#365ea0',
  800: '#2d4e8b',
  900: '#243e76',
};

export const getDesignTokens = (mode: PaletteMode) => {
  customShadows[1] =
    mode === 'dark'
      ? 'rgba(0, 0, 0, 0.2) 0px 2px 8px 0px'
      : 'rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px';

  return {
    palette: {
      mode,
      primary: {
        light: brand[300],      // Soft Moss
        main: brand[500],       // Natural Green
        dark: brand[900],       // Forest Base
        contrastText: '#ffffff',
        ...(mode === 'dark' && {
          contrastText: '#ffffff',
          light: brand[400],
          main: brand[500],
          dark: brand[800],
        }),
      },
      info: {
        light: purple[200],
        main: purple[300],      // Info blue
        dark: purple[700],
        contrastText: gray[50],
        ...(mode === 'dark' && {
          contrastText: purple[200],
          light: purple[400],
          main: purple[500],
          dark: purple[800],
        }),
      },
      warning: {
        light: orange[200],
        main: orange[400],      // Warning yellow
        dark: orange[800],
        ...(mode === 'dark' && {
          light: orange[300],
          main: orange[500],
          dark: orange[700],
        }),
      },
      error: {
        light: red[200],
        main: red[300],         // Error red
        dark: red[800],
        ...(mode === 'dark' && {
          light: red[300],
          main: red[400],
          dark: red[700],
        }),
      },
      success: {
        light: green[200],
        main: green[400],       // Success green
        dark: green[800],
        ...(mode === 'dark' && {
          light: green[300],
          main: green[500],
          dark: green[700],
        }),
      },
      grey: {
        ...gray,
      },
      divider: mode === 'dark' ? alpha(gray[700], 0.4) : alpha(gray[200], 0.8),
      background: {
        default: '#fbfbf7',     // Off White
        paper: '#ffffff',       // White
        ...(mode === 'dark' && {
          default: '#20231d',   // Charcoal
          paper: '#2a2c26'      // Slightly lighter
        }),
      },
      text: {
        primary: '#20231d',     // Charcoal
        secondary: '#6c6f66',   // Medium Gray
        ...(mode === 'dark' && {
          primary: '#ffffff',
          secondary: gray[400]
        }),
      },
      action: {
        hover: alpha(brand[200], 0.1),
        selected: alpha(brand[300], 0.15),
        ...(mode === 'dark' && {
          hover: alpha(gray[600], 0.2),
          selected: alpha(gray[600], 0.3),
        }),
      },
    },
    typography: {
      fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: {
        fontSize: defaultTheme.typography.pxToRem(48),
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: -0.5,
      },
      h2: {
        fontSize: defaultTheme.typography.pxToRem(36),
        fontWeight: 700,
        lineHeight: 1.2,
      },
      h3: {
        fontSize: defaultTheme.typography.pxToRem(30),
        fontWeight: 600,
        lineHeight: 1.2,
      },
      h4: {
        fontSize: defaultTheme.typography.pxToRem(24),
        fontWeight: 600,
        lineHeight: 1.5,
      },
      h5: {
        fontSize: defaultTheme.typography.pxToRem(20),
        fontWeight: 600,
      },
      h6: {
        fontSize: defaultTheme.typography.pxToRem(18),
        fontWeight: 600,
      },
      subtitle1: {
        fontSize: defaultTheme.typography.pxToRem(18),
      },
      subtitle2: {
        fontSize: defaultTheme.typography.pxToRem(14),
        fontWeight: 500,
      },
      body1: {
        fontSize: defaultTheme.typography.pxToRem(15),
        lineHeight: 1.6,
      },
      body2: {
        fontSize: defaultTheme.typography.pxToRem(14),
        fontWeight: 400,
        lineHeight: 1.6,
      },
      caption: {
        fontSize: defaultTheme.typography.pxToRem(12),
        fontWeight: 400,
      },
    },
    shape: {
      borderRadius: 3,  // Notion uses minimal rounding (square-ish)
    },
    shadows: customShadows,
  };
};

export const colorSchemes = {
  light: {
    palette: {
      primary: {
        light: brand[300],
        main: brand[500],
        dark: brand[900],
        contrastText: '#ffffff',
      },
      info: {
        light: purple[200],
        main: purple[300],
        dark: purple[700],
        contrastText: gray[50],
      },
      warning: {
        light: orange[200],
        main: orange[400],
        dark: orange[800],
      },
      error: {
        light: red[200],
        main: red[300],
        dark: red[800],
      },
      success: {
        light: green[200],
        main: green[400],
        dark: green[800],
      },
      grey: {
        ...gray,
      },
      divider: alpha(gray[200], 0.8),
      background: {
        default: '#fbfbf7',
        paper: '#ffffff',
      },
      text: {
        primary: '#20231d',
        secondary: '#6c6f66',
      },
      action: {
        hover: alpha(brand[200], 0.1),
        selected: alpha(brand[300], 0.15),
      },
      baseShadow:
        'rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px',
    },
  },
  dark: {
    palette: {
      primary: {
        contrastText: '#ffffff',
        light: brand[400],
        main: brand[500],
        dark: brand[800],
      },
      info: {
        contrastText: purple[200],
        light: purple[400],
        main: purple[500],
        dark: purple[800],
      },
      warning: {
        light: orange[300],
        main: orange[500],
        dark: orange[700],
      },
      error: {
        light: red[300],
        main: red[400],
        dark: red[700],
      },
      success: {
        light: green[300],
        main: green[500],
        dark: green[700],
      },
      grey: {
        ...gray,
      },
      divider: alpha(gray[700], 0.4),
      background: {
        default: '#20231d',
        paper: '#2a2c26',
      },
      text: {
        primary: '#ffffff',
        secondary: gray[400],
      },
      action: {
        hover: alpha(gray[600], 0.2),
        selected: alpha(gray[600], 0.3),
      },
      baseShadow:
        'rgba(0, 0, 0, 0.2) 0px 2px 8px 0px',
    },
  },
};

export const typography = {
  fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  h1: {
    fontSize: defaultTheme.typography.pxToRem(48),
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: defaultTheme.typography.pxToRem(36),
    fontWeight: 700,
    lineHeight: 1.2,
  },
  h3: {
    fontSize: defaultTheme.typography.pxToRem(30),
    fontWeight: 600,
    lineHeight: 1.2,
  },
  h4: {
    fontSize: defaultTheme.typography.pxToRem(24),
    fontWeight: 600,
    lineHeight: 1.5,
  },
  h5: {
    fontSize: defaultTheme.typography.pxToRem(20),
    fontWeight: 600,
  },
  h6: {
    fontSize: defaultTheme.typography.pxToRem(18),
    fontWeight: 600,
  },
  subtitle1: {
    fontSize: defaultTheme.typography.pxToRem(18),
  },
  subtitle2: {
    fontSize: defaultTheme.typography.pxToRem(14),
    fontWeight: 500,
  },
  body1: {
    fontSize: defaultTheme.typography.pxToRem(15),
    lineHeight: 1.6,
  },
  body2: {
    fontSize: defaultTheme.typography.pxToRem(14),
    fontWeight: 400,
    lineHeight: 1.6,
  },
  caption: {
    fontSize: defaultTheme.typography.pxToRem(12),
    fontWeight: 400,
  },
};

export const shape = {
  borderRadius: 3,  // Square-ish like Notion
};

// @ts-ignore
const defaultShadows: Shadows = [
  'none',
  'var(--template-palette-baseShadow)',
  ...defaultTheme.shadows.slice(2),
];
export const shadows = defaultShadows;
