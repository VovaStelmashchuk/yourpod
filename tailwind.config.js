/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      'scroll-y': 'calc(100vh - 100%)',
      borderColor: {
        'focus-black': '#000', // Custom border color for focus
      },
      animation: {
        rotate: "rotate 10s linear infinite",
      },
      keyframes: {
        rotate: {
          "0%": { transform: "rotate(0deg) scale(10)" },
          "100%": { transform: "rotate(-360deg) scale(10)" },
        },
      },
    },
  },
  plugins: [],
}

