/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        greenhouse: {
          900: '#061a14',
          800: '#0c2e24',
          700: '#114637',
          600: '#1b6350',
          500: '#10b981',
          400: '#34d399',
          300: '#6ee7b7',
          200: '#a7f3d0',
          100: '#d1fae5',
          50: '#ecfdf5'
        },
        darkbg: {
          base: '#0B0F17',
          card: '#111827',
          cardHover: '#162235',
          border: '#1F293D',
          borderGlow: '#059669'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-valid': 'glowValid 2s ease-in-out infinite',
        'glow-corrupted': 'glowCorrupted 1.5s ease-in-out infinite',
        'ping-slow': 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        glowValid: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.8)' }
        },
        glowCorrupted: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)' },
          '50%': { boxShadow: '0 0 22px rgba(239, 68, 68, 0.9)' }
        }
      }
    },
  },
  plugins: [],
}
