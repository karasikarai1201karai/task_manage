import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        'task-complete-bounce': {
          '0%':   { transform: 'scale(1)',    boxShadow: '0 0 0 0 transparent' },
          '20%':  { transform: 'scale(1.04)', boxShadow: '0 0 0 2px var(--glow-ring), 0 0 16px 6px var(--glow-color)' },
          '45%':  { transform: 'scale(1.05)', boxShadow: '0 0 0 3px var(--glow-ring), 0 0 22px 8px var(--glow-color)' },
          '70%':  { transform: 'scale(0.98)', boxShadow: '0 0 0 1px var(--glow-ring), 0 0 10px 3px var(--glow-color)' },
          '85%':  { transform: 'scale(1.01)', boxShadow: '0 0 0 1px var(--glow-ring), 0 0 7px 2px var(--glow-color)' },
          '100%': { transform: 'scale(1)',    boxShadow: '0 0 0 0 transparent' },
        },
        'check-pop': {
          '0%':   { transform: 'scale(0)', opacity: '0' },
          '55%':  { transform: 'scale(1.3)', opacity: '1' },
          '75%':  { transform: 'scale(0.9)' },
          '90%':  { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'task-complete-bounce': 'task-complete-bounce 400ms ease-out forwards',
        'check-pop': 'check-pop 250ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
    },
  },
  plugins: [],
};

export default config;
