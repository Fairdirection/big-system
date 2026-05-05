const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
    './src/app/**/*.{html,ts}',
  ],
  darkMode: 'class', // Controlled via Angular signal — see theming-dark-mode.md
  theme: {
    extend: {

      // ─── Color Palette ────────────────────────────────────────────
      colors: {
        // Backgrounds
        'sf-bg':       'rgb(var(--sf-bg) / <alpha-value>)',
        'sf-surface':  'rgb(var(--sf-surface) / <alpha-value>)',
        'sf-elevated': 'rgb(var(--sf-elevated) / <alpha-value>)',
        'sf-border':   'rgb(var(--sf-border) / <alpha-value>)',

        // Text
        'sf-text':    'rgb(var(--sf-text) / <alpha-value>)',
        'sf-muted':   'rgb(var(--sf-muted) / <alpha-value>)',
        'sf-subtle':  'rgb(var(--sf-subtle) / <alpha-value>)',

        // Standard Aliases
        'sf-primary': 'rgb(var(--sf-primary) / <alpha-value>)',
        'sf-secondary': 'rgb(var(--sf-secondary) / <alpha-value>)',
        'sf-success': 'rgb(var(--sf-success) / <alpha-value>)',
        'sf-warning': 'rgb(var(--sf-warning) / <alpha-value>)',
        'sf-info':    'rgb(var(--sf-info) / <alpha-value>)',
        'sf-error':   'rgb(var(--sf-error) / <alpha-value>)',

        // Brand Neon Accents
        'neon': {
          purple: 'rgb(var(--sf-primary) / <alpha-value>)',
          'purple-glow': 'rgb(var(--sf-primary) / 0.4)',
          cyan:   'rgb(var(--sf-info) / <alpha-value>)',
          'cyan-glow': 'rgb(var(--sf-info) / 0.4)',
          pink:   'rgb(var(--sf-secondary) / <alpha-value>)',
          'pink-glow': 'rgb(var(--sf-secondary) / 0.4)',
          green:  'rgb(var(--sf-success) / <alpha-value>)',
          amber:  'rgb(var(--sf-warning) / <alpha-value>)',
        },

        // Status colors (mapped to sale statuses from backend)
        'status': {
          draft:     '#64748b',     // Gray
          confirmed: 'rgb(var(--sf-info) / <alpha-value>)',
          claimed:   'rgb(var(--sf-primary) / <alpha-value>)',
          collected: 'rgb(var(--sf-success) / <alpha-value>)',
        },
      },

      // ─── Typography ───────────────────────────────────────────────
      fontFamily: {
        display: ['Cairo', '"Space Grotesk"', ...defaultTheme.fontFamily.sans],
        body:    ['Cairo', '"DM Sans"', ...defaultTheme.fontFamily.sans],
        mono:    ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },

      // ─── Spacing & Border Radius ───────────────────────────────────
      borderRadius: {
        'sm':  '4px',
        DEFAULT: '8px',
        'lg':  '12px',
        'xl':  '16px',
        '2xl': '20px',
        '3xl': '24px',
        'pill': '9999px',
      },

      // ─── Shadows (Neon Glow System) ────────────────────────────────
      boxShadow: {
        // Subtle elevation (Refined for professional look)
        'sm':     '0 1px 2px rgba(0,0,0,0.05)',
        'md':     '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
        'lg':     '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.05)',
        'xl':     '0 20px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.08)',
        '3d':     '0 10px 30px -5px rgba(0,0,0,0.08), 0 0 0 1px rgba(var(--sf-border) / 0.1)',

        // Neon glow effects
        'glow-purple': '0 0 20px rgba(157, 78, 221, 0.4), 0 0 60px rgba(157, 78, 221, 0.15)',
        'glow-cyan':   '0 0 20px rgba(0, 212, 255, 0.4), 0 0 60px rgba(0, 212, 255, 0.15)',
        'glow-pink':   '0 0 20px rgba(247, 37, 133, 0.4), 0 0 60px rgba(247, 37, 133, 0.15)',
        'glow-green':  '0 0 20px rgba(6, 255, 165, 0.4), 0 0 60px rgba(6, 255, 165, 0.15)',

        // Inset glow for inputs
        'inner-purple': 'inset 0 0 0 1px rgba(157, 78, 221, 0.5)',
        'inner-cyan':   'inset 0 0 0 1px rgba(0, 212, 255, 0.5)',
      },

      // ─── Animations ───────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%':   { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(157, 78, 221, 0.3)' },
          '50%':      { boxShadow: '0 0 30px rgba(157, 78, 221, 0.7)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'count-up': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'aurora-1': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        },
        'aurora-2': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-30px, 50px) scale(0.9)' },
          '66%': { transform: 'translate(20px, -20px) scale(1.1)' },
        },
        'aurora-3': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(50px, 50px) scale(1.2)' },
        },
      },
      animation: {
        'fade-in':       'fade-in 0.3s ease-out both',
        'slide-in-left': 'slide-in-left 0.3s ease-out both',
        'slide-in-right':'slide-in-right 0.3s ease-out both',
        'pulse-glow':    'pulse-glow 2s ease-in-out infinite',
        'shimmer':       'shimmer 2s linear infinite',
        'aurora-1':      'aurora-1 20s ease-in-out infinite',
        'aurora-2':      'aurora-2 25s ease-in-out infinite',
        'aurora-3':      'aurora-3 30s ease-in-out infinite',
      },

      // ─── Backdrop Blur ────────────────────────────────────────────
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },

      // ─── Background Image ─────────────────────────────────────────
      backgroundImage: {
        'gradient-purple': 'linear-gradient(135deg, #9d4edd 0%, #c77dff 100%)',
        'gradient-cyan':   'linear-gradient(135deg, #00d4ff 0%, #67e8f9 100%)',
        'gradient-pink':   'linear-gradient(135deg, #f72585 0%, #ff4d9e 100%)',
        'gradient-dark':   'linear-gradient(135deg, #151b2b 0%, #1e2538 100%)',
        'gradient-glass':  'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        'noise-pattern':   'none',
        'grid-pattern':    'none',
      },
    },
  },

  plugins: [
    // Custom component layer utilities
    function({ addComponents, addUtilities, theme }) {
      // Glassmorphism card base
      addComponents({
        '.glass-card': {
          background: theme('colors.sf-surface'),
          border: `1px solid ${theme('colors.sf-border')}`,
          borderRadius: theme('borderRadius.xl'),
          boxShadow: theme('boxShadow.3d'),
        },
        '.glass-card-hover': {
          transition: 'all 0.2s ease-out',
          '&:hover': {
            background: theme('colors.sf-elevated'),
            borderColor: 'rgba(255, 255, 255, 0.15)',
            transform: 'translateY(-2px)',
            boxShadow: theme('boxShadow.xl'),
          },
        },
      });

      // Neon text gradient utility
      addUtilities({
        '.text-gradient-purple': {
          background: 'linear-gradient(135deg, #9d4edd, #c77dff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
        '.text-gradient-cyan': {
          background: 'linear-gradient(135deg, #00d4ff, #67e8f9)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
        '.text-gradient-pink': {
          background: 'linear-gradient(135deg, #f72585, #ff4d9e)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
      });
    },
  ],
};
