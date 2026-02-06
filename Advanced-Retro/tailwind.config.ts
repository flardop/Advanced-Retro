import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surfaceElevated: 'var(--surface-elevated)',
        text: 'var(--text)',
        textMuted: 'var(--text-muted)',
        primary: 'var(--primary)',
        primarySoft: 'var(--primary-soft)',
        accent: 'var(--accent)',
        line: 'var(--line)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 30px rgba(118, 232, 255, 0.25)',
        deep: '0 30px 80px rgba(0,0,0,0.45)',
      },
    },
  },
  plugins: [require('@tailwindcss/line-clamp')],
};

export default config;
