// styles/designTokens.ts

export const colors = {
    backgroundDeep: '#e8e8ed',
    backgroundBase: '#f5f5f7',
    backgroundElevated: '#ffffff',

    // Surfaces - glass-like
    surface: 'rgba(255, 255, 255, 0.72)',
    surfaceHover: 'rgba(255, 255, 255, 0.92)',
    surfaceActive: 'rgba(245, 245, 247, 0.96)',

    // Foreground - off-white for less harshness
    foreground: '#1d1d1f',
    foregroundMuted: '#6e6e73',
    foregroundSubtle: '#86868b',

    // Accent - primary interactive color
    accent: '#0071e3',
    accentBright: '#0077ed',
    accentGlow: 'rgba(0, 113, 227, 0.18)',
    accentGlowStrong: 'rgba(0, 113, 227, 0.28)',

    // Borders - subtle
    borderDefault: 'rgba(0, 0, 0, 0.10)',
    borderHover: 'rgba(0, 0, 0, 0.18)',
    borderAccent: 'rgba(0, 113, 227, 0.30)',

    // Ambient blob colors
    blobPrimary: 'rgba(0, 113, 227, 0.10)',
    blobSecondary: 'rgba(52, 199, 89, 0.08)',
    blobTertiary: 'rgba(90, 200, 250, 0.08)',

    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
};

export const typography = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',

    // Type scale
    display: '4.5rem',      // 72px
    h1: '3rem',             // 48px
    h2: '2.25rem',          // 36px
    h3: '1.5rem',           // 24px
    bodyLarge: '1.125rem',  // 18px
    body: '0.875rem',       // 14px
    label: '0.75rem',       // 12px

    // Weights
    weightNormal: '400',
    weightMedium: '500',
    weightSemibold: '600',
    weightBold: '700',

    // Tracking
    trackingTight: '-0.02em',
    trackingNormal: 'normal',
    trackingWide: '0.05em',
};

export const spacing = {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px',
    '5xl': '128px',
};

export const radii = {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    full: '9999px',
};

// Multi-layer shadow system
export const shadows = {
    card: `0 1px 2px rgba(0, 0, 0, 0.04), 0 18px 44px rgba(0, 0, 0, 0.08)`,

    // Card hover: brighter border + deeper shadow + accent glow
    cardHover: `0 2px 8px rgba(0, 0, 0, 0.06), 0 24px 64px rgba(0, 0, 0, 0.12)`,

    // Button primary: accent glow + inner highlight
    buttonPrimary: `0 0 0 1px ${colors.accentGlowStrong}, 0 4px 12px ${colors.accentGlow}, inset 0 1px 0 0 rgba(255, 255, 255, 0.1)`,

    // Button hover
    buttonPrimaryHover: `0 0 0 1px ${colors.accentGlowStrong}, 0 6px 20px ${colors.accentGlow}, inset 0 1px 0 0 rgba(255, 255, 255, 0.15)`,

    // Button secondary
    buttonSecondary: `inset 0 1px 0 0 rgba(255, 255, 255, 0.05)`,

    // Elevation
    elevated: `0 28px 80px rgba(0, 0, 0, 0.16)`,
};

export const animation = {
    // Easing curves
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Durations
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    entrance: '600ms',
    ambient: '8000ms',

    // Keyframes
    float: `
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(1deg); }
    }
  `,

    pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }
  `,

    shimmer: `
    @keyframes shimmer {
      0% { background-position: 0% 0%; }
      100% { background-position: 200% 0%; }
    }
  `,
};
