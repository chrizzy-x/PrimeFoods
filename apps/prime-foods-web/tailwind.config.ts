import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        bg: '#0d0a07',
        surface: '#1a1410',
        'surface-2': '#251e18',
        border: '#2e261f',
        accent: '#e8521a',
        'accent-dark': '#c43f0d',
        'accent-light': '#f06a34',
        muted: '#7a6a5a',
        'text-primary': '#f5f0eb',
        'text-secondary': '#a89880',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      maxWidth: {
        app: '430px',
      },
      screens: {
        app: '430px',
      },
    },
  },
  plugins: [],
} satisfies Config;
