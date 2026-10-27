/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#22C55E',
          600: '#15803D', // Primary green
          700: '#166534', // Dark green hover
          800: '#14532D',
        },
        app: '#F7F8F7',       // Page background
        surface: '#FFFFFF',   // Surface
        main: '#182230',      // Main text
        secondary: '#667085', // Secondary text
        subtle: '#E5E7EB',    // Subtle borders
        error: '#B42318',     // Error
        warning: '#B54708',   // Warning
      },
      borderRadius: {
        'card': '8px',
      },
    },
  },
  plugins: [],
}
