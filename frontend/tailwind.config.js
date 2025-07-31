// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        pulseBackground: "pulseBackground 8s ease-in-out infinite",
      },
      keyframes: {
        pulseBackground: {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "0.5" },
        },
      },
    },
  },
  plugins: [],
};