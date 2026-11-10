/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: {
            50: '#F0F4F8',
            100: '#D9E2EC',
            500: '#1B365D',
            700: '#0F2547',
            800: '#0B1B36',
            900: '#060F22'
          },
          teal: {
            50: '#F0FDF4',
            100: '#DCFCE7',
            500: '#0D9488',
            600: '#0F766E',
            700: '#115E59'
          },
          amber: {
            500: '#D97706',
            600: '#B45309'
          },
          surface: '#F8FAFC',
          card: '#FFFFFF'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
