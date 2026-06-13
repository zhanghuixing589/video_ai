// styles/designTokens.ts

export const colors = {
    // Backgrounds - never pure black
    backgroundDeep: '#020203',
    backgroundBase: '#050506',
    backgroundElevated: '#0a0a0c',

    // Surfaces - glass-like
    surface: 'rgba(255, 255, 255, 0.05)',
    surfaceHover: 'rgba(255, 255, 255, 0.08)',
    surfaceActive: 'rgba(255, 255, 255, 0.12)',

    // Foreground - off-white for less harshness
    foreground: '#EDEDEF',
    foregroundMuted: '#8A8F98',
    foregroundSubtle: 'rgba(255, 255, 255, 0.60)',

    // Accent - primary interactive color
    accent: '#5E6AD2',
    accentBright: '#6872D9',
    accentGlow: 'rgba(94, 106, 210, 0.3)',
    accentGlowStrong: 'rgba(94, 106, 210, 0.5)',

    // Borders - subtle
    borderDefault: 'rgba(255, 255, 255, 0.06)',
    borderHover: 'rgba(255, 255, 255, 0.10)',
    borderAccent: 'rgba(94, 106, 210, 0.30)',

    // Ambient blob colors
    blobPrimary: 'rgba(94, 106, 210, 0.25)',
    blobSecondary: 'rgba(139, 92, 246, 0.15)', // purple
    blobTertiary: 'rgba(59, 130, 246, 0.12)', // blue

    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
};

export const typography = {
    fontFamily: '"Inter", "Geist Sans", system-ui, -apple-system, sans-serif',

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
    // Card default: border highlight + soft diffuse + ambient darkness
    card: `0 0 0 1px ${colors.borderDefault}, 0 2px 20px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 0, 0, 0.2)`,

    // Card hover: brighter border + deeper shadow + accent glow
    cardHover: `0 0 0 1px ${colors.borderHover}, 0 8px 40px rgba(0, 0, 0, 0.5), 0 0 80px ${colors.accentGlow}`,

    // Button primary: accent glow + inner highlight
    buttonPrimary: `0 0 0 1px ${colors.accentGlowStrong}, 0 4px 12px ${colors.accentGlow}, inset 0 1px 0 0 rgba(255, 255, 255, 0.1)`,

    // Button hover
    buttonPrimaryHover: `0 0 0 1px ${colors.accentGlowStrong}, 0 6px 20px ${colors.accentGlow}, inset 0 1px 0 0 rgba(255, 255, 255, 0.15)`,

    // Button secondary
    buttonSecondary: `inset 0 1px 0 0 rgba(255, 255, 255, 0.05)`,

    // Elevation
    elevated: `0 0 0 1px ${colors.borderDefault}, 0 8px 40px rgba(0, 0, 0, 0.3), 0 0 60px rgba(0, 0, 0, 0.2)`,
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