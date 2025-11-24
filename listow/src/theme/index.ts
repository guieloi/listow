import { 
  MD3LightTheme as DefaultTheme, 
  MD3DarkTheme as PaperDarkTheme, 
  configureFonts 
} from 'react-native-paper';

const fontConfig = {
  displayLarge: { fontFamily: 'System', fontSize: 57, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 64 },
  displayMedium: { fontFamily: 'System', fontSize: 45, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 52 },
  displaySmall: { fontFamily: 'System', fontSize: 36, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 44 },
  headlineLarge: { fontFamily: 'System', fontSize: 32, fontWeight: '700' as const, letterSpacing: 0, lineHeight: 40 },
  headlineMedium: { fontFamily: 'System', fontSize: 28, fontWeight: '600' as const, letterSpacing: 0, lineHeight: 36 },
  headlineSmall: { fontFamily: 'System', fontSize: 24, fontWeight: '600' as const, letterSpacing: 0, lineHeight: 32 },
  titleLarge: { fontFamily: 'System', fontSize: 22, fontWeight: '600' as const, letterSpacing: 0, lineHeight: 28 },
  titleMedium: { fontFamily: 'System', fontSize: 16, fontWeight: '600' as const, letterSpacing: 0.15, lineHeight: 24 },
  titleSmall: { fontFamily: 'System', fontSize: 14, fontWeight: '600' as const, letterSpacing: 0.1, lineHeight: 20 },
  bodyLarge: { fontFamily: 'System', fontSize: 16, fontWeight: '400' as const, letterSpacing: 0.15, lineHeight: 24 },
  bodyMedium: { fontFamily: 'System', fontSize: 14, fontWeight: '400' as const, letterSpacing: 0.25, lineHeight: 20 },
  bodySmall: { fontFamily: 'System', fontSize: 12, fontWeight: '400' as const, letterSpacing: 0.4, lineHeight: 16 },
  labelLarge: { fontFamily: 'System', fontSize: 14, fontWeight: '600' as const, letterSpacing: 0.1, lineHeight: 20 },
};

// --- LIGHT THEME ---
export const lightTheme = {
  ...DefaultTheme,
  // @ts-ignore
  fonts: configureFonts({config: fontConfig}),
  roundness: 16,
  colors: {
    ...DefaultTheme.colors,
    primary: '#A345E0', // Roxo do logo
    onPrimary: '#FFFFFF',
    primaryContainer: '#F0D9FA', // Roxo claro do logo
    onPrimaryContainer: '#6B21A8', // Roxo escuro
    
    secondary: '#C994EE', // Roxo médio do logo
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E9D5FF',
    onSecondaryContainer: '#7C3AED',
    
    tertiary: '#F59E0B', // Amber 500
    
    background: '#FFFFFF',
    onBackground: '#111827',
    
    surface: '#FFFFFF',
    surfaceVariant: '#F9FAFB', 
    onSurface: '#111827',
    onSurfaceVariant: '#6B7280',
    
    outline: '#E5E7EB',
    outlineVariant: '#D1D5DB',
    
    error: '#EF4444',
    
    elevation: {
      level0: 'transparent',
      level1: 'rgba(0, 0, 0, 0.05)',
      level2: 'rgba(0, 0, 0, 0.08)',
      level3: 'rgba(0, 0, 0, 0.11)',
      level4: 'rgba(0, 0, 0, 0.12)',
      level5: 'rgba(0, 0, 0, 0.14)',
    },
  },
  spacing: { xs: 4, s: 8, m: 16, l: 24, xl: 32, xxl: 40 },
};

// --- DARK THEME ---
export const darkTheme = {
  ...PaperDarkTheme,
  // @ts-ignore
  fonts: configureFonts({config: fontConfig}),
  roundness: 16,
  colors: {
    ...PaperDarkTheme.colors,
    primary: '#C994EE', // Roxo médio (Lighter for dark mode)
    onPrimary: '#1E1B4B',
    primaryContainer: '#7C3AED', // Roxo escuro
    onPrimaryContainer: '#F0D9FA', // Roxo claro
    
    secondary: '#D8B4FE', // Roxo claro para dark mode
    onSecondary: '#6B21A8',
    secondaryContainer: '#9333EA',
    onSecondaryContainer: '#E9D5FF',
    
    tertiary: '#FBBF24', // Amber 400 (Lighter for dark mode)
    
    background: '#121212', // Almost Black
    onBackground: '#F3F4F6', // Gray 100
    
    surface: '#1E1E1E', // Dark Gray
    surfaceVariant: '#27272a', // Zinc 800
    onSurface: '#F3F4F6',
    onSurfaceVariant: '#9CA3AF', // Gray 400
    
    outline: '#374151', // Gray 700
    outlineVariant: '#4B5563', // Gray 600
    
    error: '#F87171', // Red 400
    
    elevation: {
      level0: 'transparent',
      level1: 'rgba(255, 255, 255, 0.05)',
      level2: 'rgba(255, 255, 255, 0.08)',
      level3: 'rgba(255, 255, 255, 0.11)',
      level4: 'rgba(255, 255, 255, 0.12)',
      level5: 'rgba(255, 255, 255, 0.14)',
    },
  },
  spacing: { xs: 4, s: 8, m: 16, l: 24, xl: 32, xxl: 40 },
};

export type AppTheme = typeof lightTheme;
