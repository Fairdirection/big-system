# 📄 tailwind-config.md
# SalesFlow Frontend — Tailwind CSS Configuration

## Full `tailwind.config.js`

```js
// tailwind.config.js
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
        'sf-bg':       '#0a0b0f',   // Deep space black — default page bg
        'sf-surface':  '#12141a',   // Card / panel surfaces
        'sf-elevated': '#1a1d27',   // Hover-state / input bg
        'sf-border':   '#252836',   // Borders and dividers

        // Text
        'sf-text':    '#e2e8f0',    // Primary text
        'sf-muted':   '#64748b',    // Secondary / placeholder text
        'sf-subtle':  '#334155',    // Disabled states

        // Brand Neon Accents
        'neon': {
          purple: '#9d4edd',        // Primary action color
          'purple-glow': '#c77dff', // Hover / active highlights
          cyan:   '#00d4ff',        // Info / active states
          'cyan-glow': '#67e8f9',   // Cyan hover variant
          pink:   '#f72585',        // Alerts / danger / badges
          'pink-glow': '#ff4d9e',   // Pink hover variant
          green:  '#06ffa5',        // Success / confirmed status
          amber:  '#fbbf24',        // Warning / pending status
        },

        // Status colors (mapped to sale statuses from backend)
        'status': {
          draft:     '#64748b',     // Gray — sale.status === 'draft'
          confirmed: '#00d4ff',     // Cyan — sale.status === 'confirmed'
          claimed:   '#9d4edd',     // Purple — sale.status === 'claimed'
          collected: '#06ffa5',     // Green — sale.status === 'collected'
        },
      },

      // ─── Typography ───────────────────────────────────────────────
      fontFamily: {
        display: ['"Space Grotesk"', ...defaultTheme.fontFamily.sans],
        body:    ['"DM Sans"', ...defaultTheme.fontFamily.sans],
        mono:    ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },

      // ─── Spacing & Border Radius ───────────────────────────────────
      borderRadius: {
        'sm':  '6px',
        DEFAULT: '10px',
        'lg':  '14px',
        'xl':  '18px',
        '2xl': '24px',
        '3xl': '32px',
        'pill': '9999px',
      },

      // ─── Shadows (Neon Glow System) ────────────────────────────────
      boxShadow: {
        // Subtle elevation
        'sm':     '0 1px 3px rgba(0,0,0,0.4)',
        'md':     '0 4px 12px rgba(0,0,0,0.5)',
        'lg':     '0 8px 30px rgba(0,0,0,0.6)',
        'xl':     '0 20px 60px rgba(0,0,0,0.7)',

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
      },
      animation: {
        'fade-in':       'fade-in 0.3s ease-out both',
        'slide-in-left': 'slide-in-left 0.3s ease-out both',
        'slide-in-right':'slide-in-right 0.3s ease-out both',
        'pulse-glow':    'pulse-glow 2s ease-in-out infinite',
        'shimmer':       'shimmer 2s linear infinite',
      },

      // ─── Backdrop Blur ────────────────────────────────────────────
      backdropBlur: {
        xs: '2px',
        sm: '8px',
        md: '12px',
        lg: '20px',
        xl: '40px',
      },

      // ─── Background Image ─────────────────────────────────────────
      backgroundImage: {
        'gradient-purple': 'linear-gradient(135deg, #9d4edd 0%, #c77dff 100%)',
        'gradient-cyan':   'linear-gradient(135deg, #00d4ff 0%, #67e8f9 100%)',
        'gradient-pink':   'linear-gradient(135deg, #f72585 0%, #ff4d9e 100%)',
        'gradient-dark':   'linear-gradient(135deg, #12141a 0%, #1a1d27 100%)',
        'gradient-glass':  'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        'grid-pattern':    "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(37 40 54 / 0.8)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e\")",
      },
    },
  },

  plugins: [
    // Custom component layer utilities
    function({ addComponents, addUtilities, theme }) {
      // Glassmorphism card base
      addComponents({
        '.glass-card': {
          background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${theme('colors.sf-border')}`,
          borderRadius: theme('borderRadius.2xl'),
        },
        '.glass-card-hover': {
          transition: 'all 0.2s ease',
          '&:hover': {
            background: 'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)',
            borderColor: 'rgba(157, 78, 221, 0.4)',
            boxShadow: theme('boxShadow.glow-purple'),
            transform: 'translateY(-2px)',
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
```

---

## Google Fonts Import

Add to `src/index.html` inside `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## Design Token Reference

### Colors Quick Reference

| Token | Hex | Usage |
|---|---|---|
| `sf-bg` | `#0a0b0f` | Page background |
| `sf-surface` | `#12141a` | Cards, panels |
| `sf-elevated` | `#1a1d27` | Inputs, hover states |
| `sf-border` | `#252836` | Borders |
| `neon-purple` | `#9d4edd` | Primary CTA buttons |
| `neon-cyan` | `#00d4ff` | Info, confirmed status |
| `neon-pink` | `#f72585` | Alerts, danger |
| `neon-green` | `#06ffa5` | Success, collected |
| `neon-amber` | `#fbbf24` | Warnings, pending |

### Sale Status → Color Mapping

```ts
// Matches backend: sale.status enum ['draft','confirmed','claimed','collected']
const statusColorMap = {
  draft:     'text-status-draft bg-status-draft/10',
  confirmed: 'text-status-confirmed bg-status-confirmed/10',
  claimed:   'text-status-claimed bg-status-claimed/10',
  collected: 'text-status-collected bg-status-collected/10',
};
```
