/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        purple: {
          50:  '#EDE9FF',
          100: '#D4CAFF',
          200: '#B09BFF',
          400: '#8B68FF',
          500: '#6C47FF',   // primary brand
          600: '#5535DD',
          700: '#4C2FBB',
          800: '#3B2299',
          900: '#26175C',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
