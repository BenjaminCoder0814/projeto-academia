/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rosa: {
          50: '#FFF5F9',
          100: '#FFE4EF',
          200: '#FFC9DE',
          300: '#FFA0C4',
          400: '#FF74A8',
          500: '#FF4D8D',
        },
        magenta: '#E8107A',
        'magenta-texto': '#C90F68',
        lavanda: '#C7A9FF',
        dourado: '#FFC978',
        vermelhinho: '#FF7A85',
        verde: '#4ADE80',
        carvao: '#2B1E28',
        cinza: '#76626F',
      },
      fontFamily: {
        manuscrita: ['Pacifico', 'Caveat', 'cursive'],
        bilhete: ['Caveat', 'Pacifico', 'cursive'],
        display: ['Outfit', 'Sora', 'system-ui', 'sans-serif'],
        corpo: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '24px', pill: '999px' },
      boxShadow: {
        rosa: '0 8px 32px rgba(255,77,141,.15)',
        rosaForte: '0 12px 40px rgba(255,77,141,.28)',
      },
    },
  },
  plugins: [],
}
