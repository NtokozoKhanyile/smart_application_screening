/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#f0f3fa',
          100: '#d9e0f2',
          200: '#b3c2e5',
          300: '#8da3d8',
          400: '#6685cb',
          500: '#4066be',
          600: '#2d4f9e',
          700: '#1B2B6B',
          800: '#162358',
          900: '#101a42',
        },
        gold: {
          50:  '#fdf8ec',
          100: '#faefd0',
          200: '#f5dfa1',
          300: '#f0cf72',
          400: '#ebbf43',
          500: '#D4A017',
          600: '#b08512',
          700: '#8c6a0e',
          800: '#684f0b',
          900: '#443407',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}