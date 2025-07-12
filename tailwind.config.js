/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#376FE9',
        secondary: '#4B5563',
        accent: '#10B981',
        background: '#F3F4F6',
      },
      fontSize: {
        base: '16px',
        h1: '2rem',
        h2: '1.5rem',
        h3: '1.25rem',
      },
    },
  },
  plugins: [],
}