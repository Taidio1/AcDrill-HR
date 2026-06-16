import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#18212E',
        anthracite: '#2C3A4D',
        orange: '#FF6A1A',
        amber: '#FFC400',
        success: '#1FA35A',
        danger: '#E0392B',
        warning: '#E0A53A',
        info: '#2563A8',
        ink: '#121821',
        strong: '#243042',
        muted: '#5A6678',
        subtle: '#9AA3B0',
        canvas: '#F4F6F8',
        soft: '#EEF1F4',
        line: '#DCE1E8',
        lineSoft: '#E6EAEF',
        white: '#FFFFFF',
      },
      fontFamily: {
        sans: ['var(--font-ibm-plex-sans)', 'sans-serif'],
        display: ['var(--font-archivo)', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'monospace'],
      },
      borderRadius: {
        sm: '9px',
        control: '13px',
        card: '16px',
        lg: '20px',
        round: '999px',
      },
    },
  },
  plugins: [],
};

export default config;
