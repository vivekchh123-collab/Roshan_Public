import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { blue: '#0b57c8', navy: '#0a2a66', red: '#d90d0d', sun: '#f59e0b' },
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(-100%)' } },
      },
      animation: { marquee: 'marquee 22s linear infinite' },
    },
  },
  plugins: [],
};
export default config;
