/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/components/**/*.{js,ts,tsx}','./app/screens/**/*.{js,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        dunggeunmiso: ['Hakgyoansim Dunggeunmiso TTF B'],
        boardmarker: ['Hakgyoansim BoardmarkerR'],
      },
    },
  },
  plugins: [],
}
