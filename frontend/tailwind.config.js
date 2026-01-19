/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/components/**/*.{js,ts,tsx}','./app/screens/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};
