import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Goldman-inspired institutional palette
        bg: {
          DEFAULT: '#F7F5EF',
          elev: '#FFFFFF',
          subtle: '#F0EDE4',
        },
        ink: {
          DEFAULT: '#0B1F3A',
          muted: '#475569',
          faint: '#94A3B8',
        },
        accent: {
          DEFAULT: '#B89D5E',
          strong: '#8C7A45',
          soft: '#F0E8D0',
        },
        brand: {
          DEFAULT: '#1F3A8A',
          light: '#2D54C4',
          dark: '#152966',
        },
        border: {
          DEFAULT: '#E5E2D8',
          strong: '#C8C4B8',
        },
        success: {
          DEFAULT: '#1F6F4A',
          soft: '#D4EDDF',
        },
        warn: {
          DEFAULT: '#A66800',
          soft: '#FEF3C7',
        },
        danger: {
          DEFAULT: '#9B2C2C',
          soft: '#FEE2E2',
        },
        // Chart palette (muted, professional)
        chart: {
          navy: '#0B1F3A',
          gold: '#B89D5E',
          slate: '#64748B',
          sand: '#D4C5A9',
          teal: '#1F6F6F',
        },
      },
      fontFamily: {
        sans: ['Goldman Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(11,31,58,0.08), 0 1px 2px -1px rgba(11,31,58,0.04)',
        panel: '0 4px 16px 0 rgba(11,31,58,0.08)',
        floating: '0 8px 32px 0 rgba(11,31,58,0.12)',
      },
      animation: {
        'pulse-gold': 'pulseGold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [forms],
} satisfies Config
