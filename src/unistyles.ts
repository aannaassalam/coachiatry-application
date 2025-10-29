import { UnistylesRegistry } from 'react-native-unistyles';
export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  superLarge: 2000,
  tvLike: 4000,
} as const;

export const lightTheme = {
  colors: {
    background: '#F9F9F9',
    primary: '#0E1734',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
  },
  fonts: {
    archivo: {
      thin: 'Archivo-Thin',
      thinItalic: 'Archivo-ThinItalic',
      extraLight: 'Archivo-ExtraLight',
      extraLightItalic: 'Archivo-ExtraLightItalic',
      light: 'Archivo-Light',
      lightItalic: 'Archivo-LightItalic',
      regular: 'Archivo-Regular',
      italic: 'Archivo-Italic',
      medium: 'Archivo-Medium',
      mediumItalic: 'Archivo-MediumItalic',
      semiBold: 'Archivo-SemiBold',
      semiBoldItalic: 'Archivo-SemiBoldItalic',
      bold: 'Archivo-Bold',
      boldItalic: 'Archivo-BoldItalic',
      extraBold: 'Archivo-ExtraBold',
      extraBoldItalic: 'Archivo-ExtraBoldItalic',
      black: 'Archivo-Black',
      blackItalic: 'Archivo-BlackItalic',
    },
  },
  margins: {
    sm: 2,
    md: 4,
    lg: 8,
    xl: 12,
  },
} as const;

export const darkTheme = {
  colors: {
    typography: '#ffffff',
    background: '#000000',
  },
  margins: {
    sm: 2,
    md: 4,
    lg: 8,
    xl: 12,
  },
} as const;

// define other themes
type AppBreakpoints = typeof breakpoints;
type AppThemes = {
  light: typeof lightTheme;
  dark: typeof darkTheme;
};

declare module 'react-native-unistyles' {
  export interface UnistylesBreakpoints extends AppBreakpoints {}
  export interface UnistylesThemes extends AppThemes {}
}

UnistylesRegistry.addBreakpoints(breakpoints)
  .addThemes({
    light: lightTheme,
    dark: darkTheme,
  })
  .addConfig({
    adaptiveThemes: true,
  });
