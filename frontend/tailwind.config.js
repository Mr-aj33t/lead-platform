/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#F6F6F2',
          100: '#EAE9E0',
          200: '#D7D6C7',
          300: '#BCBBA8',
          400: '#8E917A',
          500: '#5C6551',
          600: '#3B4A37',
          700: '#2A3727',
          800: '#1D271B',
          900: '#131A12',
        },
        forest: {
          light: '#3B6951',
          DEFAULT: '#284E3A',
          dark: '#1C3829',
          deep: '#14271C',
        },
        cream: {
          50: '#FBFBFA',
          100: '#F3F2EC',
          200: '#ECEBE4',
          300: '#E1E0D6',
        },
        accent: {
          pill: '#B5C9BB',
          badge: '#2B4E3B',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(28, 40, 27, 0.06)',
        card: '0 4px 20px -2px rgba(28, 40, 27, 0.05)',
        pill: '0 2px 10px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
