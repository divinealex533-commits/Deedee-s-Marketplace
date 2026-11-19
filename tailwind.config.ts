import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Colours come from CSS variables so the site can switch between dark and light (see globals.css).
        white: 'rgb(var(--c-white) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        panel: 'rgb(var(--c-panel) / <alpha-value>)',
        panel2: 'rgb(var(--c-panel2) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        line2: 'rgb(var(--c-line2) / <alpha-value>)',
        text: 'rgb(var(--c-text) / <alpha-value>)',
        soft: 'rgb(var(--c-soft) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        placeholder: 'rgb(var(--c-placeholder) / <alpha-value>)',
        accent: { DEFAULT: '#6246EA', hover: '#5236D6', text: 'rgb(var(--c-accent-text) / <alpha-value>)' },
        success: 'rgb(var(--c-success) / <alpha-value>)',
        warn: 'rgb(var(--c-warn) / <alpha-value>)',
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
        whatsapp: '#0E7C4A',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-inter)', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      keyframes: {
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        pulseDot: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.35' } },
      },
      animation: {
        marquee: 'marquee 35s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
