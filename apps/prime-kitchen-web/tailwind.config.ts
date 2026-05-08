import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        bg: '#0f1117',
        surface: '#171b24',
        'surface-2': '#1e2433',
        border: '#252d3d',
        accent: '#e8521a',
        'accent-dark': '#c43f0d',
        'accent-light': '#f06a34',
        muted: '#6b7a99',
        'text-primary': '#e8eaf0',
        'text-secondary': '#8892a4',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
