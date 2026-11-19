import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B1020',
        panel: '#121833',
        panel2: '#0F1429',
        line: '#1E2540',
        line2: '#2E3658',
        text: '#E7E9F3',
        soft: '#C7CBDD',
        muted: '#A3A9C2',
        placeholder: '#7E85A3',
        accent: { DEFAULT: '#6246EA', hover: '#5236D6', text: '#A897FF' },
        success: '#6EE7B7',
        warn: '#FCD34D',
        danger: '#FCA5B5',
        whatsapp: '#0E7C4A',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-inter)', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
