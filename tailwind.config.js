/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      'scroll-y': 'calc(100vh - 100%)',
      borderColor: {
        'focus-black': '#000', // Custom border color for focus
      },
    },
  },
  plugins: [],
}

