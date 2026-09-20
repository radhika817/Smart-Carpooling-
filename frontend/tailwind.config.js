/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#F6F8F7',
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#10b981',
          500: '#059669', // Primary Forest Emerald
          600: '#047857', // Rich high-contrast Emerald
          700: '#065f46',
          800: '#064e3b',
          900: '#022c22',
        },
        sunrise: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Dynamic Transit Amber
          600: '#ea580c', // High contrast Amber
          700: '#c2410c', // High contrast Amber text on light bg (WCAG AAA)
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', '"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        elevated: '0 12px 30px -4px rgba(15, 23, 42, 0.1), 0 4px 10px -2px rgba(15, 23, 42, 0.05)',
        'glow-brand': '0 0 20px rgba(5, 150, 105, 0.18)',
        'glow-sunrise': '0 0 20px rgba(249, 115, 22, 0.22)',
      },
    },
  },
  plugins: [],
};
