/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      'scroll-y': 'calc(100vh - 100%)'
    },
  },
  plugins: [],
}

